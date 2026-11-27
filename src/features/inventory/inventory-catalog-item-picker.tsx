'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SELECT_CLASS,
  formatCatalogItemLabel,
} from '@/features/inventory/inventory-constants';
import type { InventoryCatalogItem } from '@/types/api';

type CatalogOption = {
  id: string;
  label: string;
  searchText: string;
};

function buildOptions(catalogItems: readonly InventoryCatalogItem[]): CatalogOption[] {
  return catalogItems
    .map((item) => {
      const label = formatCatalogItemLabel(item, { withUnit: true });
      return {
        id: item.id,
        label,
        searchText: [
          item.name,
          item.brandName ?? '',
          item.catalogNumber ?? '',
          item.categoryName,
          item.unit,
          label,
        ]
          .join(' ')
          .toLowerCase(),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Catalog item dropdown with search inside the open panel only
 * (no external search field). Used by Receive journey Step 2.
 */
export function InventoryCatalogItemPicker({
  id,
  label = 'Catalog item',
  value,
  onChange,
  catalogItems,
  required = false,
  emptyLabel = 'Select item',
  disabled = false,
}: {
  id?: string;
  label?: string;
  value: string;
  onChange: (catalogItemId: string) => void;
  catalogItems: readonly InventoryCatalogItem[];
  required?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const options = useMemo(() => buildOptions(catalogItems), [catalogItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (option) => option.searchText.includes(q) || option.label.toLowerCase().includes(q),
    );
  }, [options, search]);

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

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  function selectOption(nextId: string) {
    onChange(nextId);
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="space-y-1" ref={rootRef}>
      <Label htmlFor={fieldId}>{label}</Label>
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
        disabled={disabled}
        className={`${SELECT_CLASS} flex w-full items-center justify-between gap-2 text-left disabled:opacity-60`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
      >
        <span className={`truncate ${selectedOption ? '' : 'text-muted'}`}>{displayLabel}</span>
        <span className="shrink-0 text-xs text-muted" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open ? (
        <div className="rounded border border-border bg-surface/40 p-2">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or catalogue number…"
            aria-label="Search catalog items"
            autoComplete="off"
          />
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
            {filtered.length} of {options.length} item{options.length === 1 ? '' : 's'}
            {search.trim() ? ' matching' : ''}.
          </p>
        </div>
      ) : null}
    </div>
  );
}
