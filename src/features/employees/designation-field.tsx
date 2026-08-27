'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiErrorMessage } from '@/lib/api-error';
import type { NamedEntity } from '@/types/api';

const ADD_VALUE = '__add_designation__';

export function designationCodeFromName(name: string): string {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 12);
  return base || 'DESIG';
}

function isConflictError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const status = 'status' in error ? Number((error as { status?: number }).status) : NaN;
  if (status === 409) return true;
  const message = apiErrorMessage(error, '').toLowerCase();
  return message.includes('already exists') || message.includes('conflict');
}

export async function resolveDesignationId(
  form: FormData,
  createDesignation: (input: { name: string; code: string }) => Promise<{ data: { id: string } }>,
): Promise<string | undefined> {
  const newName = String(form.get('newDesignationName') ?? '').trim();
  if (newName) {
    const requestedCode = String(form.get('newDesignationCode') ?? '').trim() || designationCodeFromName(newName);
    try {
      const created = await createDesignation({ name: newName, code: requestedCode });
      return created.data.id;
    } catch (cause) {
      if (!isConflictError(cause)) {
        throw cause;
      }
      const retry = await createDesignation({
        name: newName,
        code: `${designationCodeFromName(newName)}_${Date.now().toString().slice(-4)}`,
      });
      return retry.data.id;
    }
  }
  return String(form.get('designationId') ?? '') || undefined;
}

export function DesignationField({
  items,
  defaultId = '',
  allowCreate = true,
}: {
  items: NamedEntity[];
  defaultId?: string;
  allowCreate?: boolean;
}) {
  const [value, setValue] = useState(defaultId);
  const adding = value === ADD_VALUE;

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="designationPicker">Designation (job title)</Label>
        <select
          id="designationPicker"
          className="h-10 w-full border border-border bg-background px-3 text-sm"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        >
          <option value="">None</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
          {allowCreate ? <option value={ADD_VALUE}>Add new designation…</option> : null}
        </select>
        <p className="mt-1 text-sm text-muted">
          Job title only — not portal access
          {allowCreate ? '. If the title is not listed, choose Add new designation.' : '.'}
        </p>
      </div>
      {adding ? (
        <div className="space-y-3 border border-border bg-surface p-3">
          <div>
            <Label htmlFor="newDesignationName">Name</Label>
            <Input id="newDesignationName" name="newDesignationName" placeholder="e.g. Software Engineer" required />
          </div>
          <div>
            <Label htmlFor="newDesignationCode">Code</Label>
            <Input id="newDesignationCode" name="newDesignationCode" placeholder="Optional, e.g. SE" />
          </div>
        </div>
      ) : (
        <input type="hidden" name="designationId" value={value} />
      )}
    </div>
  );
}
