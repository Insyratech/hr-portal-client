'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
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
  const displayLabel = selectedOption?.label ?? emptyLabel;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function selectOption(nextId: string) {
    onChange(nextId);
    setOpen(false);
    setSearch('');
    setFilter(ALL_FILTER);
  }

  return (
    <div className="space-y-2" ref={rootRef}>
      <Label htmlFor={fieldId}>{label}</Label>
      {/* Hidden input so parent forms can still honor required when used inside <form>. */}
      <input
        type="text"
        className="sr-only"
        tabIndex={-1}
        value={value}
        required={required}
        readOnly
        aria-hidden
      />
      <button
        id={fieldId}
        type="button"
        className={`${SELECT_CLASS} flex w-full items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-muted'}`}>{displayLabel}</span>
        <span className="shrink-0 text-xs text-muted" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open ? (
        <div className="rounded border border-border bg-surface/40 p-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              autoFocus
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

          <ul
            className="mt-2 max-h-56 overflow-y-auto rounded border border-border bg-background"
            role="listbox"
            aria-label={label}
          >
            <li>
              <button
                type="button"
                role="option"
                aria-selected={!value}
                className={`flex w-full px-3 py-2 text-left text-sm hover:bg-surface ${
                  !value ? 'bg-surface font-medium' : ''
                }`}
                onClick={() => selectOption('')}
              >
                {emptyLabel}
              </button>
            </li>
            {filtered.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === option.id}
                  className={`flex w-full px-3 py-2 text-left text-sm hover:bg-surface ${
                    value === option.id ? 'bg-surface font-medium' : ''
                  }`}
                  onClick={() => selectOption(option.id)}
                >
                  {option.label}
                </button>
              </li>
            ))}
            {!filtered.length ? (
              <li className="px-3 py-2 text-sm text-muted">No matches.</li>
            ) : null}
          </ul>

          <p className="mt-2 text-xs text-muted">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'}
            {filter === PREPARED_FILTER
              ? ' · prepared recipe outputs and matching catalog reagents'
              : ''}
            . Stock deduct uses lots of the linked catalog item.
          </p>
        </div>
      ) : selectedOption ? (
        <p className="text-xs text-muted">Stock deduct uses lots of the linked catalog item.</p>
      ) : null}
    </div>
  );
}
