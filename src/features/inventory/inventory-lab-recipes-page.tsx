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
  useGetInventoryLabRecipesQuery,
  useUpdateInventoryLabActivityMutation,
  useUpdateInventoryLabRecipeMutation,
} from '@/store/api/api';
import type { InventoryLabActivity, InventoryLabRecipe } from '@/types/api';

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

  useEffect(() => {
    if (!selectedActivityId && activities.length) {
      setSelectedActivityId(activities[0]!.id);
    }
  }, [activities, selectedActivityId]);

  const { data: recipesData, isLoading: loadingRecipes } = useGetInventoryLabRecipesQuery(
    selectedActivityId ? { activityId: selectedActivityId } : undefined,
    { skip: !canManage || !selectedActivityId },
  );
  const recipes = recipesData?.data ?? [];

  /** All recipes (every work type) so prepared outputs can be linked as components. */
  const { data: allRecipesData } = useGetInventoryLabRecipesQuery(undefined, { skip: !canManage });
  const allRecipes = allRecipesData?.data ?? [];

  const [createActivity, { isLoading: creatingActivity }] = useCreateInventoryLabActivityMutation();
  const [updateActivity, { isLoading: updatingActivity }] = useUpdateInventoryLabActivityMutation();
  const [createRecipe, { isLoading: creatingRecipe }] = useCreateInventoryLabRecipeMutation();
  const [updateRecipe, { isLoading: updatingRecipe }] = useUpdateInventoryLabRecipeMutation();
  const [deleteRecipe, { isLoading: deletingRecipe }] = useDeleteInventoryLabRecipeMutation();

  const [activityOpen, setActivityOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<InventoryLabRecipe | null>(null);
  const [draftComponents, setDraftComponents] = useState<DraftComponent[]>([emptyComponent()]);

  const selectedActivity = useMemo(
    () => activities.find((row) => row.id === selectedActivityId) ?? null,
    [activities, selectedActivityId],
  );

  function openNewRecipe() {
    setEditingRecipe(null);
    setCreatesOutputLot(false);
    setOutputCatalogItemId('');
    setDraftComponents([emptyComponent()]);
    setRecipeOpen(true);
  }

  function openEditRecipe(recipe: InventoryLabRecipe) {
    setEditingRecipe(recipe);
    setCreatesOutputLot(Boolean(recipe.createsOutputLot));
    setOutputCatalogItemId(recipe.outputCatalogItemId ?? '');
    setDraftComponents(componentsFromRecipe(recipe));
    setRecipeOpen(true);
  }

  async function onCreateActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const created = await createActivity({
        name: String(form.get('name') ?? '').trim(),
        description: String(form.get('description') ?? '').trim(),
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

  async function onSaveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedActivityId) {
      toast.error('Select a work type first.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const finalVolumeRaw = String(form.get('finalVolumeValue') ?? '').trim();
    const finalVolumeValue = finalVolumeRaw ? Number(finalVolumeRaw) : null;
    const components = draftComponents
      .map((row, index) => {
        const qtyRaw = row.quantityValue.trim();
        return {
          name: row.name.trim(),
          quantityValue: qtyRaw ? Number(qtyRaw) : null,
          quantityUnit: row.quantityUnit.trim(),
          notes: row.notes.trim(),
          sortOrder: (index + 1) * 10,
          catalogItemId: row.catalogItemId.trim() || null,
        };
      })
      .filter((row) => row.name);
    const outputId = createsOutputLot ? outputCatalogItemId.trim() || null : null;

    if (!name) {
      toast.error('Recipe name is required.');
      return;
    }
    if (createsOutputLot && !outputId) {
      toast.error('Select an output catalog item for the prepared reagent.');
      return;
    }
    if (components.some((row) => row.quantityValue !== null && !Number.isFinite(row.quantityValue))) {
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
            finalVolumeUnit: String(form.get('finalVolumeUnit') ?? '').trim(),
            notes: String(form.get('notes') ?? '').trim(),
            status: String(form.get('status') ?? 'active') as 'active' | 'inactive',
            createsOutputLot,
            outputCatalogItemId: outputId,
            components,
          },
        }).unwrap();
        toast.success('Recipe updated.');
      } else {
        await createRecipe({
          activityId: selectedActivityId,
          name,
          finalVolumeValue,
          finalVolumeUnit: String(form.get('finalVolumeUnit') ?? '').trim(),
          notes: String(form.get('notes') ?? '').trim(),
          createsOutputLot,
          outputCatalogItemId: outputId,
          components,
        }).unwrap();
        toast.success('Recipe created.');
      }
      setRecipeOpen(false);
      setEditingRecipe(null);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save recipe.'));
    }
  }

  async function onDeleteRecipe(recipe: InventoryLabRecipe) {
    if (!window.confirm(`Delete recipe “${recipe.name}”? This cannot be undone.`)) return;
    try {
      await deleteRecipe(recipe.id).unwrap();
      toast.success('Recipe deleted.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to delete recipe.'));
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
            <Button type="button" onClick={openNewRecipe} disabled={!selectedActivityId}>
              Add recipe
            </Button>
          </div>
        }
      />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Inventory Manager sandbox for Inside lab work: DNA Extraction, PCR, Gel prep, DNA loading,
        Reagent preparation, and any types you add. Recipes hold the predefined composition lines
        employees can edit when they scan the Inside lab QR.
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
                  {activity.recipeCount} recipe{activity.recipeCount === 1 ? '' : 's'}
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
          <DataTable<InventoryLabRecipe>
            columns={[
              { id: 'name', header: 'Recipe', cell: (row) => row.name },
              {
                id: 'volume',
                header: 'Final volume',
                cell: (row) =>
                  row.finalVolumeValue != null
                    ? `${row.finalVolumeValue} ${row.finalVolumeUnit}`.trim()
                    : row.finalVolumeUnit || '—',
              },
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
                    <Button type="button" variant="outline" size="sm" onClick={() => openEditRecipe(row)}>
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
            emptyTitle="No recipes yet"
            emptyDescription="Add a recipe with composition lines (e.g. 6X Loading Dye)."
          />
        </section>
      </div>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent>
          <DialogTitle>Add work type</DialogTitle>
          <DialogDescription>
            Appears on the Inside lab scan form (e.g. a new PCR family or extraction protocol).
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
            <Button type="submit" disabled={creatingActivity}>
              Save work type
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogTitle>{editingRecipe ? 'Edit recipe' : 'Add recipe'}</DialogTitle>
          <DialogDescription>
            Predefined composition for {selectedActivity?.name ?? 'this work type'}. Employees can
            adjust quantities when they submit from the Inside lab QR.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onSaveRecipe}>
            <div>
              <Label htmlFor="recipe-name">Recipe name</Label>
              <Input
                id="recipe-name"
                name="name"
                required
                defaultValue={editingRecipe?.name ?? ''}
                placeholder="e.g. 6X Loading Dye"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="finalVolumeValue">Final volume</Label>
                <Input
                  id="finalVolumeValue"
                  name="finalVolumeValue"
                  type="number"
                  step="any"
                  defaultValue={
                    editingRecipe?.finalVolumeValue != null ? String(editingRecipe.finalVolumeValue) : ''
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
            <div>
              <Label htmlFor="recipe-notes">Notes</Label>
              <Input
                id="recipe-notes"
                name="notes"
                defaultValue={editingRecipe?.notes ?? ''}
                placeholder="Optional prep notes"
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
                    placeholder="e.g. Bromophenol Blue powder"
                    required={index === 0}
                  />
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
                  <Input
                    value={component.notes}
                    onChange={(event) =>
                      setDraftComponents((current) =>
                        current.map((row) =>
                          row.key === component.key ? { ...row, notes: event.target.value } : row,
                        ),
                      )
                    }
                    placeholder="Notes (make up to… / adjust pH…)"
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
              {editingRecipe ? 'Save changes' : 'Create recipe'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
