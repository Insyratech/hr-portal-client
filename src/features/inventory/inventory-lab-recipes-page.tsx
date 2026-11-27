'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { SELECT_CLASS } from '@/features/inventory/inventory-constants';
import { InventoryCatalogLinkPicker } from '@/features/inventory/inventory-catalog-link-picker';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventoryLabActivityMutation,
  useCreateInventoryLabRecipeMutation,
  useDeleteInventoryLabRecipeMutation,
  useGetInventoryCatalogQuery,
  useGetInventoryLabActivitiesQuery,
  useGetInventoryLabGelChartQuery,
  useGetInventoryLabRecipesQuery,
  useGetInventorySopFilesQuery,
  useUpdateInventoryLabActivityMutation,
  useUpdateInventoryLabGelComponentsMutation,
  useUpdateInventoryLabRecipeMutation,
} from '@/store/api/api';
import { agaroseGrams, formatGelPercentLabel } from '@/features/inventory/gel-chart';
import type {
  InventoryLabActivity,
  InventoryLabGelComponentKey,
  InventoryLabRecipe,
} from '@/types/api';

type DraftComponent = {
  key: string;
  name: string;
  quantityValue: string;
  quantityUnit: string;
  notes: string;
  catalogItemId: string;
};

function emptyComponent(): DraftComponent {
  return {
    key: crypto.randomUUID(),
    name: '',
    quantityValue: '',
    quantityUnit: '',
    notes: '',
    catalogItemId: '',
  };
}

function componentsFromRecipe(recipe: InventoryLabRecipe): DraftComponent[] {
  if (!recipe.components.length) return [emptyComponent()];
  return recipe.components.map((component) => ({
    key: component.id,
    name: component.name,
    quantityValue:
      component.quantityValue === null || component.quantityValue === undefined
        ? ''
        : String(component.quantityValue),
    quantityUnit: component.quantityUnit,
    notes: component.notes,
    catalogItemId: component.catalogItemId ?? '',
  }));
}

export function InventoryLabRecipesPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_LAB_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_PREP_MANAGE);

  const { data: activitiesData, isLoading: loadingActivities } = useGetInventoryLabActivitiesQuery(
    undefined,
    { skip: !canManage },
  );
  const { data: catalogData } = useGetInventoryCatalogQuery(undefined, { skip: !canManage });
  const catalogItems = useMemo(
    () => (catalogData?.data ?? []).filter((item) => item.status === 'active'),
    [catalogData?.data],
  );
  const activities = activitiesData?.data ?? [];
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [createsOutputLot, setCreatesOutputLot] = useState(false);
  const [outputCatalogItemId, setOutputCatalogItemId] = useState('');
  const [sopFileId, setSopFileId] = useState('');

  useEffect(() => {
    if (!selectedActivityId && activities.length) {
      setSelectedActivityId(activities[0]!.id);
    }
  }, [activities, selectedActivityId]);

  const selectedActivity = useMemo(
    () => activities.find((row) => row.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );
  const isMethodActivity = selectedActivity?.usageMode === 'method';
  const isGelActivity = selectedActivity?.usageMode === 'gel';
  const itemNoun = isMethodActivity ? 'method' : 'recipe';
  const itemNounTitle = isMethodActivity ? 'Method' : 'Recipe';

  const { data: recipesData, isLoading: loadingRecipes } = useGetInventoryLabRecipesQuery(
    selectedActivityId ? { activityId: selectedActivityId } : undefined,
    { skip: !canManage || !selectedActivityId || isGelActivity },
  );
  const recipes = recipesData?.data ?? [];

  /** All recipes (every work type) so prepared outputs can be linked as components. */
  const { data: allRecipesData } = useGetInventoryLabRecipesQuery(undefined, { skip: !canManage });
  const allRecipes = allRecipesData?.data ?? [];
  const { data: sopFilesData } = useGetInventorySopFilesQuery(undefined, { skip: !canManage });
  const sopFiles = sopFilesData?.data ?? [];
  const { data: gelChartData, isLoading: loadingGel } = useGetInventoryLabGelChartQuery(
    selectedActivityId,
    { skip: !canManage || !selectedActivityId || !isGelActivity },
  );
  const gelChart = gelChartData?.data;

  const [createActivity, { isLoading: creatingActivity }] = useCreateInventoryLabActivityMutation();
  const [updateActivity, { isLoading: updatingActivity }] = useUpdateInventoryLabActivityMutation();
  const [createRecipe, { isLoading: creatingRecipe }] = useCreateInventoryLabRecipeMutation();
  const [updateRecipe, { isLoading: updatingRecipe }] = useUpdateInventoryLabRecipeMutation();
  const [deleteRecipe, { isLoading: deletingRecipe }] = useDeleteInventoryLabRecipeMutation();
  const [updateGelLinks, { isLoading: savingGelLinks }] = useUpdateInventoryLabGelComponentsMutation();

  const [activityOpen, setActivityOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<InventoryLabRecipe | null>(null);
  const [draftComponents, setDraftComponents] = useState<DraftComponent[]>([emptyComponent()]);
  const [gelLinks, setGelLinks] = useState<
    Record<InventoryLabGelComponentKey, { name: string; catalogItemId: string }>
  >({
    agarose: { name: 'Agarose', catalogItemId: '' },
    buffer: { name: '1X TAE Buffer', catalogItemId: '' },
    stain: { name: 'EtBr', catalogItemId: '' },
  });

  useEffect(() => {
    if (!gelChart) return;
    const next: Record<InventoryLabGelComponentKey, { name: string; catalogItemId: string }> = {
      agarose: { name: 'Agarose', catalogItemId: '' },
      buffer: { name: '1X TAE Buffer', catalogItemId: '' },
      stain: { name: 'EtBr', catalogItemId: '' },
    };
    for (const row of gelChart.components) {
      next[row.componentKey] = {
        name: row.name,
        catalogItemId: row.catalogItemId ?? '',
      };
    }
    setGelLinks(next);
  }, [gelChart]);

  function openNewRecipe() {
    setEditingRecipe(null);
    setCreatesOutputLot(false);
    setOutputCatalogItemId('');
    setSopFileId('');
    setDraftComponents([emptyComponent()]);
    setRecipeOpen(true);
  }

  function openEditRecipe(recipe: InventoryLabRecipe) {
    setEditingRecipe(recipe);
    setCreatesOutputLot(Boolean(recipe.createsOutputLot));
    setOutputCatalogItemId(recipe.outputCatalogItemId ?? '');
    setSopFileId(recipe.sopFileId ?? '');
    setDraftComponents(componentsFromRecipe(recipe));
    setRecipeOpen(true);
  }

  async function onCreateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const usageModeRaw = String(form.get('usageMode') ?? 'method');
    const usageMode =
      usageModeRaw === 'recipe' ? 'recipe' : usageModeRaw === 'gel' ? 'gel' : 'method';
    try {
      const created = await createActivity({
        name: String(form.get('name') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
        usageMode,
      }).unwrap();
      setActivityOpen(false);
      setSelectedActivityId(created.data.id);
      toast.success('Work type added.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to add work type.'));
    }
  }

  async function onToggleActivity(activity: InventoryLabActivity) {
    try {
      await updateActivity({
        id: activity.id,
        body: { status: activity.status === 'active' ? 'inactive' : 'active' },
      }).unwrap();
      toast.success(activity.status === 'active' ? 'Work type deactivated.' : 'Work type activated.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to update work type.'));
    }
  }

  async function onSaveGelLinks() {
    if (!selectedActivityId) return;
    try {
      await updateGelLinks({
        activityId: selectedActivityId,
        components: (Object.keys(gelLinks) as InventoryLabGelComponentKey[]).map((componentKey) => ({
          componentKey,
          name: gelLinks[componentKey].name,
          catalogItemId: gelLinks[componentKey].catalogItemId || null,
        })),
      }).unwrap();
      toast.success('Gel component links saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save gel links.'));
    }
  }

  async function onSaveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedActivityId) {
      toast.error('Select a work type first.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const finalVolumeRaw = isMethodActivity
      ? ''
      : String(form.get('finalVolumeValue') ?? '').trim();
    const finalVolumeValue = finalVolumeRaw ? Number(finalVolumeRaw) : null;
    const finalVolumeUnit = isMethodActivity
      ? ''
      : String(form.get('finalVolumeUnit') ?? '').trim();
    const components = draftComponents
      .map((row, index) => {
        const qtyRaw = isMethodActivity ? '' : row.quantityValue.trim();
        return {
          name: row.name.trim(),
          quantityValue: qtyRaw ? Number(qtyRaw) : null,
          quantityUnit: isMethodActivity ? '' : row.quantityUnit.trim(),
          notes: row.notes.trim(),
          sortOrder: (index + 1) * 10,
          catalogItemId: row.catalogItemId.trim() || null,
        };
      })
      .filter((row) => row.name);
    const outputId = createsOutputLot ? outputCatalogItemId.trim() || null : null;

    if (!name) {
      toast.error(`${itemNounTitle} name is required.`);
      return;
    }
    const allowOutputLot = !isMethodActivity && createsOutputLot;
    if (allowOutputLot && !outputId) {
      toast.error('Select an output catalog item for the prepared reagent.');
      return;
    }
    if (
      !isMethodActivity &&
      components.some((row) => row.quantityValue !== null && !Number.isFinite(row.quantityValue))
    ) {
      toast.error('Component quantities must be numbers (or blank).');
      return;
    }

    try {
      if (editingRecipe) {
        await updateRecipe({
          id: editingRecipe.id,
          body: {
            name,
            finalVolumeValue,
            finalVolumeUnit,
            notes: String(form.get('notes') ?? '').trim(),
            status: String(form.get('status') ?? 'active') as 'active' | 'inactive',
            createsOutputLot: allowOutputLot,
            outputCatalogItemId: allowOutputLot ? outputId : null,
            sopFileId: sopFileId.trim() || null,
            components,
          },
        }).unwrap();
        toast.success(`${itemNounTitle} updated.`);
      } else {
        await createRecipe({
          activityId: selectedActivityId,
          name,
          finalVolumeValue,
          finalVolumeUnit,
          notes: String(form.get('notes') ?? '').trim(),
          createsOutputLot: allowOutputLot,
          outputCatalogItemId: allowOutputLot ? outputId : null,
          sopFileId: sopFileId.trim() || null,
          components,
        }).unwrap();
        toast.success(`${itemNounTitle} created.`);
      }
      setRecipeOpen(false);
      setEditingRecipe(null);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save recipe.'));
    }
  }

  async function onDeleteRecipe(recipe: InventoryLabRecipe) {
    if (!window.confirm(`Delete ${itemNoun} “${recipe.name}”? This cannot be undone.`)) return;
    try {
      await deleteRecipe(recipe.id).unwrap();
      toast.success(`${itemNounTitle} deleted.`);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, `Unable to delete ${itemNoun}.`));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Inventory" title="Lab recipes" />
        <p className="text-sm text-muted">You need lab recipe manage permission.</p>
      </>
    );
  }

  const busy =
    loadingActivities ||
    loadingRecipes ||
    creatingActivity ||
    updatingActivity ||
    creatingRecipe ||
    updatingRecipe ||
    deletingRecipe;

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader
        kicker="Inventory"
        title="Lab recipes"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setActivityOpen(true)}>
              Add work type
            </Button>
            {!isGelActivity ? (
              <Button type="button" onClick={openNewRecipe} disabled={!selectedActivityId}>
                Add {itemNoun}
              </Button>
            ) : null}
          </div>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        DNA Extraction, PCR, and Loading use <span className="text-foreground">methods</span>{' '}
        (component list + optional catalog links; staff pick how many Nx on the Inside lab QR).
        Gel preparation uses the <span className="text-foreground">agarose % + volume chart</span>.
        Reagent preparation stays as <span className="text-foreground">recipes</span> with measured
        volumes and optional output lots.
      </p>

      <div className="mb-6 grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="space-y-2 rounded border border-border p-3">
          <Meta>Work types</Meta>
          <div className="space-y-1">
            {activities.map((activity) => (
              <button
                key={activity.id}
                type="button"
                className={`flex w-full flex-col rounded px-3 py-2 text-left text-sm ${
                  selectedActivityId === activity.id
                    ? 'bg-foreground text-background'
                    : 'hover:bg-surface'
                }`}
                onClick={() => setSelectedActivityId(activity.id)}
              >
                <span className="font-medium">{activity.name}</span>
                <span
                  className={`text-xs ${
                    selectedActivityId === activity.id ? 'text-background/80' : 'text-muted'
                  }`}
                >
                  {activity.usageMode === 'gel'
                    ? 'chart'
                    : `${activity.recipeCount} ${
                        activity.usageMode === 'method'
                          ? `method${activity.recipeCount === 1 ? '' : 's'}`
                          : `recipe${activity.recipeCount === 1 ? '' : 's'}`
                      }`}
                  {activity.status !== 'active' ? ' · inactive' : ''}
                </span>
              </button>
            ))}
          </div>
          {selectedActivity ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => void onToggleActivity(selectedActivity)}
            >
              {selectedActivity.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          ) : null}
        </aside>

        <section>
          {selectedActivity?.description ? (
            <p className="mb-4 text-sm text-muted">{selectedActivity.description}</p>
          ) : null}

          {isGelActivity ? (
            <div className="space-y-6">
              <DelayedLoadingOverlay active={loadingGel} />
              <div className="rounded border border-border p-4">
                <Meta>Agarose gel chart</Meta>
                <p className="mt-2 text-sm text-muted">
                  Staff pick % and volume on the Inside lab QR. Agarose (g) = % ÷ 100 × volume (mL).
                  TAE buffer equals the chosen volume. EtBr follows the chart by volume.
                </p>
                {gelChart ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                          <th className="px-2 py-2">% w/v</th>
                          {gelChart.volumesMl.map((volume) => (
                            <th key={volume} className="px-2 py-2">
                              {volume} mL
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gelChart.percentages.map((percent) => (
                          <tr key={percent} className="border-b border-border/60">
                            <td className="px-2 py-2 font-medium">{formatGelPercentLabel(percent)}</td>
                            {gelChart.volumesMl.map((volume) => (
                              <td key={`${percent}-${volume}`} className="px-2 py-2 tabular-nums">
                                {agaroseGrams(percent, volume)} g
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-3 text-xs text-muted">
                      EtBr:{' '}
                      {gelChart.volumesMl
                        .map(
                          (volume) =>
                            `${volume} mL → ${gelChart.etbrUlByVolumeMl[String(volume)] ?? '—'} µL`,
                        )
                        .join(' · ')}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4 rounded border border-border p-4">
                <Meta>Stock deduct links</Meta>
                <p className="text-sm text-muted">
                  Link catalog items so Inside lab can deduct Agarose, TAE Buffer, and EtBr.
                </p>
                {(Object.keys(gelLinks) as InventoryLabGelComponentKey[]).map((key) => (
                  <div key={key} className="space-y-2 rounded border border-border p-3">
                    <Label htmlFor={`gel-name-${key}`}>
                      {key === 'agarose' ? 'Agarose' : key === 'buffer' ? 'TAE Buffer' : 'EtBr'}
                    </Label>
                    <Input
                      id={`gel-name-${key}`}
                      value={gelLinks[key].name}
                      onChange={(event) =>
                        setGelLinks((current) => ({
                          ...current,
                          [key]: { ...current[key], name: event.target.value },
                        }))
                      }
                    />
                    <InventoryCatalogLinkPicker
                      id={`gel-link-${key}`}
                      label="Link catalog item (for stock deduct)"
                      value={gelLinks[key].catalogItemId}
                      onChange={(catalogItemId) =>
                        setGelLinks((current) => ({
                          ...current,
                          [key]: { ...current[key], catalogItemId },
                        }))
                      }
                      catalogItems={catalogItems}
                      recipes={allRecipes}
                      emptyLabel="No stock deduct"
                    />
                  </div>
                ))}
                <Button type="button" disabled={savingGelLinks} onClick={() => void onSaveGelLinks()}>
                  {savingGelLinks ? 'Saving…' : 'Save gel links'}
                </Button>
              </div>
            </div>
          ) : (
            <DataTable<InventoryLabRecipe>
              columns={[
                { id: 'name', header: itemNounTitle, cell: (row) => row.name },
                {
                  id: 'sop',
                  header: 'SOP',
                  cell: (row) => row.sopTitle || '—',
                },
                ...(isMethodActivity
                  ? []
                  : [
                      {
                        id: 'volume',
                        header: 'Final volume',
                        cell: (row: InventoryLabRecipe) =>
                          row.finalVolumeValue != null
                            ? `${row.finalVolumeValue} ${row.finalVolumeUnit}`.trim()
                            : row.finalVolumeUnit || '—',
                      },
                    ]),
                {
                  id: 'components',
                  header: 'Components',
                  cell: (row) => String(row.components.length),
                },
                { id: 'status', header: 'Status', cell: (row) => row.status },
                {
                  id: 'actions',
                  header: '',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEditRecipe(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void onDeleteRecipe(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={recipes}
              loading={loadingRecipes}
              emptyTitle={isMethodActivity ? 'No methods yet' : 'No recipes yet'}
              emptyDescription={
                isMethodActivity
                  ? 'Add a method with its component list (e.g. Blood DNA Extraction).'
                  : 'Add a recipe with composition lines (e.g. 6X Loading Dye).'
              }
            />
          )}
        </section>
      </div>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogTitle>Add work type</DialogTitle>
          <DialogDescription>
            Appears on the Inside lab scan form. Use Method for DNA/PCR/Loading-style work, Gel chart
            for agarose % + volume, or Recipe for reagent preparation.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreateActivity}>
            <div>
              <Label htmlFor="activity-name">Name</Label>
              <Input id="activity-name" name="name" required placeholder="e.g. RNA Extraction" />
            </div>
            <div>
              <Label htmlFor="activity-description">Description</Label>
              <Input
                id="activity-description"
                name="description"
                placeholder="Short hint for lab staff"
              />
            </div>
            <div>
              <Label htmlFor="activity-usage-mode">Mode</Label>
              <select
                id="activity-usage-mode"
                name="usageMode"
                className={SELECT_CLASS}
                defaultValue="method"
              >
                <option value="method">Method (component list + how many Nx)</option>
                <option value="gel">Gel chart (agarose % + volume)</option>
                <option value="recipe">Recipe (reagent prep / measured volumes)</option>
              </select>
            </div>
            <Button type="submit" disabled={creatingActivity}>
              Save work type
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>
            {editingRecipe ? `Edit ${itemNoun}` : `Add ${itemNoun}`}
          </DialogTitle>
          <DialogDescription>
            {isMethodActivity
              ? `List the components used in this ${selectedActivity?.name ?? 'work type'} method. On the Inside lab QR, staff choose the method and how many (Nx).`
              : `Predefined composition for ${selectedActivity?.name ?? 'this work type'}. Employees can adjust quantities when they submit from the Inside lab QR.`}
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onSaveRecipe}>
            <div>
              <Label htmlFor="recipe-name">{isMethodActivity ? 'Method name' : 'Recipe name'}</Label>
              <Input
                id="recipe-name"
                name="name"
                required
                defaultValue={editingRecipe?.name ?? ''}
                placeholder={
                  isMethodActivity ? 'e.g. Blood DNA Extraction' : 'e.g. 6X Loading Dye'
                }
              />
            </div>
            {!isMethodActivity ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="finalVolumeValue">Final volume</Label>
                  <Input
                    id="finalVolumeValue"
                    name="finalVolumeValue"
                    type="number"
                    step="any"
                    defaultValue={
                      editingRecipe?.finalVolumeValue != null
                        ? String(editingRecipe.finalVolumeValue)
                        : ''
                    }
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="finalVolumeUnit">Volume unit</Label>
                  <Input
                    id="finalVolumeUnit"
                    name="finalVolumeUnit"
                    defaultValue={editingRecipe?.finalVolumeUnit ?? ''}
                    placeholder="mL"
                  />
                </div>
              </div>
            ) : null}
            <div>
              <Label htmlFor="recipe-notes">Notes</Label>
              <Input
                id="recipe-notes"
                name="notes"
                defaultValue={editingRecipe?.notes ?? ''}
                placeholder={isMethodActivity ? 'Optional method notes' : 'Optional prep notes'}
              />
            </div>
            {editingRecipe ? (
              <div>
                <Label htmlFor="recipe-status">Status</Label>
                <select
                  id="recipe-status"
                  name="status"
                  className={SELECT_CLASS}
                  defaultValue={editingRecipe.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            ) : null}

            {!isMethodActivity ? (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={createsOutputLot}
                    onChange={(event) => {
                      setCreatesOutputLot(event.target.checked);
                      if (!event.target.checked) setOutputCatalogItemId('');
                    }}
                  />
                  Create output reagent lot on submit (reagent prep)
                </label>
                {createsOutputLot ? (
                  <InventoryCatalogLinkPicker
                    id="outputCatalogItemId"
                    label="Output catalog item"
                    value={outputCatalogItemId}
                    onChange={setOutputCatalogItemId}
                    catalogItems={catalogItems}
                    recipes={allRecipes}
                    excludeRecipeId={editingRecipe?.id}
                    required
                    emptyLabel="Select catalog item"
                  />
                ) : null}
              </>
            ) : (
              <p className="text-xs text-muted">
                Methods have no measured volumes here. Staff record how many (Nx) on the Inside lab
                scan. Link catalog items only if you want those components tracked on the method.
              </p>
            )}

            <div>
              <Label htmlFor="recipe-sop">Linked SOP (optional)</Label>
              <select
                id="recipe-sop"
                className={SELECT_CLASS}
                value={sopFileId}
                onChange={(event) => setSopFileId(event.target.value)}
              >
                <option value="">No SOP linked</option>
                {sopFiles.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted">
                Upload PDFs under Stock → SOPs, then link here for Inside lab preview.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Meta>Composition</Meta>
                <button
                  type="button"
                  className="text-sm underline-offset-2 hover:underline"
                  onClick={() => setDraftComponents((current) => [...current, emptyComponent()])}
                >
                  Add component
                </button>
              </div>
              {draftComponents.map((component, index) => (
                <div key={component.key} className="space-y-2 rounded border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted">Component {index + 1}</p>
                    {draftComponents.length > 1 ? (
                      <button
                        type="button"
                        className="text-xs underline-offset-2 hover:underline"
                        onClick={() =>
                          setDraftComponents((current) =>
                            current.filter((row) => row.key !== component.key),
                          )
                        }
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <Input
                    value={component.name}
                    onChange={(event) =>
                      setDraftComponents((current) =>
                        current.map((row) =>
                          row.key === component.key ? { ...row, name: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder={
                      isMethodActivity
                        ? 'e.g. Proteinase K'
                        : 'e.g. Bromophenol Blue powder'
                    }
                    required={index === 0}
                  />
                  {!isMethodActivity ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={component.quantityValue}
                        onChange={(event) =>
                          setDraftComponents((current) =>
                            current.map((row) =>
                              row.key === component.key
                                ? { ...row, quantityValue: event.target.value }
                                : row,
                            ),
                          )
                        }
                        placeholder="Qty (blank = as required)"
                        type="number"
                        step="any"
                      />
                      <Input
                        value={component.quantityUnit}
                        onChange={(event) =>
                          setDraftComponents((current) =>
                            current.map((row) =>
                              row.key === component.key
                                ? { ...row, quantityUnit: event.target.value }
                                : row,
                            ),
                          )
                        }
                        placeholder="Unit (mg, µL, mL…)"
                      />
                    </div>
                  ) : null}
                  <Input
                    value={component.notes}
                    onChange={(event) =>
                      setDraftComponents((current) =>
                        current.map((row) =>
                          row.key === component.key ? { ...row, notes: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder={
                      isMethodActivity
                        ? 'Optional notes for this component'
                        : 'Notes (make up to… / adjust pH…)'
                    }
                  />
                  <InventoryCatalogLinkPicker
                    id={`component-link-${component.key}`}
                    value={component.catalogItemId}
                    onChange={(catalogItemId) =>
                      setDraftComponents((current) =>
                        current.map((row) =>
                          row.key === component.key ? { ...row, catalogItemId } : row,
                        ),
                      )
                    }
                    catalogItems={catalogItems}
                    recipes={allRecipes}
                    excludeRecipeId={editingRecipe?.id}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" disabled={creatingRecipe || updatingRecipe}>
              {editingRecipe ? 'Save changes' : `Create ${itemNoun}`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
