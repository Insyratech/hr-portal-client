'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { useCreatePolicyMutation, useGetPoliciesQuery, usePublishPolicyMutation } from '@/store/api/api';

export default function HrPoliciesPage() {
  const { data, isLoading } = useGetPoliciesQuery();
  const [createPolicy, { isLoading: creating }] = useCreatePolicyMutation();
  const [publishPolicy, { isLoading: publishing }] = usePublishPolicyMutation();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      await createPolicy({
        title: String(form.get('title') ?? ''),
        content: String(form.get('content') ?? ''),
        versionLabel: String(form.get('versionLabel') ?? '1.0') || '1.0',
        effectiveDate: String(form.get('effectiveDate') ?? '') || undefined,
        acknowledgementRequired: form.get('acknowledgementRequired') === 'on',
      }).unwrap();
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create policy.'));
    }
  }

  async function onPublishDraft(id: string) {
    setError(null);
    try {
      await publishPolicy({ id }).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to publish draft.'));
    }
  }

  async function onPublishNewVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const id = String(form.get('policyId') ?? selectedId);
    try {
      await publishPolicy({
        id,
        content: String(form.get('content') ?? ''),
        versionLabel: String(form.get('versionLabel') ?? '') || undefined,
        effectiveDate: String(form.get('effectiveDate') ?? '') || undefined,
        acknowledgementRequired: form.get('acknowledgementRequired') === 'on',
      }).unwrap();
      event.currentTarget.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to publish new version.'));
    }
  }

  const policies = data?.data ?? [];

  return (
    <>
      <PageHeader kicker="Policies" title="HR policies" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Publish creates a new version. Previously acknowledged versions stay unchanged.
      </p>

      <form onSubmit={onCreate} className="mb-10 max-w-2xl space-y-4 border border-border p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">New policy</p>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="versionLabel">Version</Label>
          <Input id="versionLabel" name="versionLabel" defaultValue="1.0" />
        </div>
        <div>
          <Label htmlFor="effectiveDate">Effective date</Label>
          <Input id="effectiveDate" name="effectiveDate" type="date" />
        </div>
        <div>
          <Label htmlFor="content">Content</Label>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acknowledgementRequired" defaultChecked /> Acknowledgement required
        </label>
        <Button type="submit" disabled={creating}>
          Create draft
        </Button>
      </form>

      <form onSubmit={onPublishNewVersion} className="mb-10 max-w-2xl space-y-4 border border-border p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Publish new version</p>
        <div>
          <Label htmlFor="policyId">Policy</Label>
          <select
            id="policyId"
            name="policyId"
            className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
            value={selectedId}
            onChange={(event) => setSelectedId(event.target.value)}
            required
          >
            <option value="" disabled>
              Select policy
            </option>
            {policies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="newVersionLabel">Version label</Label>
          <Input id="newVersionLabel" name="versionLabel" placeholder="2.1" />
        </div>
        <div>
          <Label htmlFor="newEffectiveDate">Effective date</Label>
          <Input id="newEffectiveDate" name="effectiveDate" type="date" />
        </div>
        <div>
          <Label htmlFor="newContent">Content</Label>
          <textarea
            id="newContent"
            name="content"
            required
            rows={6}
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="acknowledgementRequired" defaultChecked /> Acknowledgement required
        </label>
        <Button type="submit" disabled={publishing}>
          Publish new version
        </Button>
      </form>

      {error ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}

      <DataTable
        columns={[
          { id: 'title', header: 'Title', cell: (row) => row.title },
          {
            id: 'current',
            header: 'Published',
            cell: (row) => row.currentVersion?.versionLabel ?? 'None',
          },
          {
            id: 'draft',
            header: 'Draft',
            cell: (row) => row.draftVersion?.versionLabel ?? '—',
          },
          {
            id: 'publish',
            header: 'Publish draft',
            cell: (row) =>
              row.draftVersion ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={publishing}
                  onClick={() => void onPublishDraft(row.id)}
                >
                  Publish {row.draftVersion.versionLabel}
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={policies}
        emptyTitle={isLoading ? 'Loading' : 'No HR policies'}
        emptyDescription="Create a draft, then publish it. New versions never rewrite old ones."
      />
    </>
  );
}
