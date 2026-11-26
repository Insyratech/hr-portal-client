'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SELECT_CLASS,
  formatCatalogItemLabel,
} from '@/features/inventory/inventory-constants';
import type { InventoryCatalogItem, InventoryLabRecipe } from '@/types/api';

const PREPARED_FILTER = '__prepared__';
const ALL_FILTER = '';

type LinkOption = {
  id: string;
  label: string;
  searchText: string;
  filterKey: string;
  filterLabel: string;
  fromRecipe: boolean;
};

function buildLinkOptions(
  catalogItems: readonly InventoryCatalogItem[],
  recipes: readonly InventoryLabRecipe[],
  excludeRecipeId?: string | null,
): LinkOption[] {
  const byId = new Map<string, LinkOption>();

  for (const item of catalogItems) {
    const label = formatCatalogItemLabel(item, { withCategory: true, withUnit: true });
    byId.set(item.id, {
      id: item.id,
      label,
      searchText: [
        item.name,
        item.brandName ?? '',
        item.catalogNumber ?? '',
        item.categoryName,
        item.unit,
      ]
        .join(' ')
        .toLowerCase(),
      filterKey: item.categoryId || item.categoryName || 'other',
      filterLabel: item.categoryName || 'Other',
      fromRecipe: false,
    });
  }

  const nameIndex = new Map<string, string>();
  for (const item of catalogItems) {
    nameIndex.set(item.name.trim().toLowerCase(), item.id);
  }

  for (const recipe of recipes) {
    if (recipe.status !== 'active') continue;
    if (excludeRecipeId && recipe.id === excludeRecipeId) continue;

    const linkedId =
      recipe.outputCatalogItemId ||
      nameIndex.get(recipe.name.trim().toLowerCase()) ||
      null;
    if (!linkedId) continue;

    const existing = byId.get(linkedId);
    const recipeBit = `Recipe · ${recipe.name}`;
    if (existing) {
      byId.set(linkedId, {
        ...existing,
        label: existing.fromRecipe
          ? existing.label
          : `${existing.label} · ${recipeBit}`,
        searchText: `${existing.searchText} ${recipe.name} prepared recipe`.toLowerCase(),
        fromRecipe: true,
      });
    } else {
      const outputName = recipe.outputCatalogItemName?.trim();
      byId.set(linkedId, {
        id: linkedId,
        label: outputName ? `${recipeBit} → ${outputName}` : recipeBit,
        searchText: `${recipe.name} ${outputName ?? ''} prepared recipe`.toLowerCase(),
        filterKey: PREPARED_FILTER,
        filterLabel: 'Prepared recipes',
        fromRecipe: true,
      });
    }
  }

  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function InventoryCatalogLinkPicker({
  id,
  label = 'Link catalog item (for stock deduct)',
  value,
  onChange,
  catalogItems,
  recipes,
  excludeRecipeId,
  required = false,
  emptyLabel = 'No stock deduct',
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (catalogItemId: string) => void;
  catalogItems: readonly InventoryCatalogItem[];
  recipes: readonly InventoryLabRecipe[];
  excludeRecipeId?: string | null;
  required?: boolean;
  emptyLabel?: string;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(ALL_FILTER);

  const options = useMemo(
    () => buildLinkOptions(catalogItems, recipes, excludeRecipeId),
    [catalogItems, recipes, excludeRecipeId],
  );

  const filterChoices = useMemo(() => {
    const map = new Map<string, string>();
    map.set(PREPARED_FILTER, 'Prepared recipes');
    for (const option of options) {
      if (option.filterKey === PREPARED_FILTER) continue;
      if (!map.has(option.filterKey)) map.set(option.filterKey, option.filterLabel);
    }
    return [...map.entries()]
      .map(([key, name]) => ({ key, name }))
      .sort((a, b) => {
        if (a.key === PREPARED_FILTER) return -1;
        if (b.key === PREPARED_FILTER) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [options]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return options.filter((option) => {
      if (filter === PREPARED_FILTER) {
        if (!option.fromRecipe) return false;
      } else if (filter && option.filterKey !== filter) {
        return false;
      }
      if (!q) return true;
      return option.searchText.includes(q) || option.label.toLowerCase().includes(q);
    });
  }, [options, search, filter]);

  const selectedOption = value ? options.find((option) => option.id === value) : undefined;
  const selectedHiddenByFilter = Boolean(
    value && selectedOption && !filtered.some((option) => option.id === value),
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, catalogue no., recipe…"
          aria-label="Search link options"
        />
        <select
          className={SELECT_CLASS}
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Filter link options"
        >
          <option value={ALL_FILTER}>All sources</option>
          {filterChoices.map((choice) => (
            <option key={choice.key} value={choice.key}>
              {choice.name}
            </option>
          ))}
        </select>
      </div>
      <select
        id={id}
        className={SELECT_CLASS}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{emptyLabel}</option>
        {selectedHiddenByFilter && selectedOption ? (
          <option value={selectedOption.id}>{selectedOption.label} (hidden by filter)</option>
        ) : null}
        {filtered.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted">
        {filtered.length} match{filtered.length === 1 ? '' : 'es'}
        {filter === PREPARED_FILTER
          ? ' · prepared recipe outputs and matching catalog reagents'
          : ''}
        . Stock deduct uses lots of the linked catalog item.
      </p>
    </div>
  );
}
