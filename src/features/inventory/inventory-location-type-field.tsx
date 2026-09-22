'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LOCATION_TYPES,
  SELECT_CLASS,
  humanizeLocationType,
  slugifyLocationType,
} from '@/features/inventory/inventory-constants';

const ADD_NEW = '__add_new_location_type__';

type Props = {
  id: string;
  name: string;
  defaultValue?: string;
  /** Extra type slugs already used on other locations (shown in the list). */
  knownTypes?: string[];
};

/**
 * Location type select with “Add new type…” — presets stay fixed;
 * custom labels are slugified into the hidden form value.
 */
export function InventoryLocationTypeField({
  id,
  name,
  defaultValue = 'store',
  knownTypes = [],
}: Props) {
  const presetValues = useMemo(() => new Set(LOCATION_TYPES.map((item) => item.value)), []);
  const extras = useMemo(
    () =>
      [...new Set(knownTypes)]
        .filter((value) => value && !presetValues.has(value))
        .sort((a, b) => a.localeCompare(b)),
    [knownTypes, presetValues],
  );

  const initialCustom = Boolean(defaultValue && !presetValues.has(defaultValue));
  const [selectValue, setSelectValue] = useState(initialCustom ? ADD_NEW : defaultValue || 'store');
  const [customLabel, setCustomLabel] = useState(
    initialCustom ? humanizeLocationType(defaultValue) : '',
  );

  const resolved =
    selectValue === ADD_NEW ? slugifyLocationType(customLabel) : selectValue;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Type</Label>
      <select
        id={id}
        className={SELECT_CLASS}
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value;
          setSelectValue(next);
          if (next !== ADD_NEW) setCustomLabel('');
        }}
      >
        {LOCATION_TYPES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
        {extras.map((value) => (
          <option key={value} value={value}>
            {humanizeLocationType(value)}
          </option>
        ))}
        <option value={ADD_NEW}>Add new type…</option>
      </select>
      {selectValue === ADD_NEW ? (
        <div>
          <Label htmlFor={`${id}-custom`}>New type name</Label>
          <Input
            id={`${id}-custom`}
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            placeholder="e.g. Incubator"
            required
            minLength={2}
            maxLength={40}
          />
          <p className="mt-1 text-xs text-muted">
            Saved as a short code (e.g. incubator). Appears in the list next time.
          </p>
        </div>
      ) : null}
      <input type="hidden" name={name} value={resolved} />
    </div>
  );
}
