'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditIconButton } from '@/components/ui/edit-icon-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusMessage } from '@/components/ui/status-message';
import { uploadCompanyLogo } from '@/features/companies/upload-logo';
import { apiErrorMessage } from '@/lib/api-error';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateCompanyLogoMutation,
  useCreateCompanyMutation,
  useGetCompaniesQuery,
  useUpdateCompanyMutation,
} from '@/store/api/api';
import type { Company } from '@/types/api';

export function CompaniesPage() {
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.COMPANIES_MANAGE),
  );
  const { data, isLoading, isError, refetch } = useGetCompaniesQuery();
  const [createCompany, { isLoading: creating }] = useCreateCompanyMutation();
  const [updateCompany, { isLoading: updating }] = useUpdateCompanyMutation();
  const [createLogo] = useCreateCompanyLogoMutation();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Company | null>(null);

  async function saveLogo(companyId: string, file: File | undefined): Promise<void> {
    if (!file || file.size === 0) return;
    await uploadCompanyLogo(createLogo, companyId, file);
    await refetch();
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const file = (form.get('logo') as File | null) ?? undefined;
    try {
      const created = await createCompany({
        name: String(form.get('name') ?? ''),
        address: String(form.get('address') ?? ''),
      }).unwrap();
      await saveLogo(created.data.id, file && file.size > 0 ? file : undefined);
      formEl.reset();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to create company.'));
    }
  }

  async function onSaveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setError(null);
    const form = new FormData(event.currentTarget);
    const file = (form.get('logo') as File | null) ?? undefined;
    try {
      await updateCompany({
        id: editing.id,
        body: {
          name: String(form.get('name') ?? ''),
          address: String(form.get('address') ?? ''),
          status: String(form.get('status') ?? 'active') as 'active' | 'inactive',
        },
      }).unwrap();
      await saveLogo(editing.id, file && file.size > 0 ? file : undefined);
      setEditing(null);
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to update company.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Organization" title="Companies" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Salary slips use the employee’s company name, address, and logo. Changing a company later does not rewrite
        published slips.
      </p>
      {canManage ? (
        <form
          onSubmit={onCreate}
          className="mb-8 max-w-3xl space-y-4 rounded border border-border bg-background p-6 shadow-card"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="30M Genomics or Insyra" />
            </div>
            <div>
              <Label htmlFor="logo">Logo</Label>
              <Input id="logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" required />
            </div>
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? 'Saving…' : 'Add company'}
          </Button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-muted">HR Manager maintains companies. This list is read-only.</p>
      )}
      {error && !editing ? (
        <div className="mb-4">
          <StatusMessage tone="danger">{error}</StatusMessage>
        </div>
      ) : null}
      {isError ? <p className="mb-4 text-sm">Unable to load companies.</p> : null}
      <DataTable
        columns={[
          {
            id: 'logo',
            header: 'Logo',
            cell: (row) =>
              row.logoUrl ? (
                <img src={row.logoUrl} alt="" className="h-8 w-8 object-contain" />
              ) : (
                '—'
              ),
          },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          { id: 'address', header: 'Address', cell: (row) => row.address || '—' },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          ...(canManage
            ? [
                {
                  id: 'edit',
                  header: 'Edit',
                  cell: (row: Company) => (
                    <EditIconButton label={`Edit ${row.name}`} onClick={() => setEditing(row)} />
                  ),
                },
              ]
            : []),
        ]}
        rows={data?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No companies'}
        emptyDescription="Add 30M Genomics and Insyra so you can assign employees."
      />

      <Dialog open={Boolean(editing) && canManage} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent>
          <DialogTitle>Edit company</DialogTitle>
          <DialogDescription>Name, address, and logo appear on salary slips from the next publish.</DialogDescription>
          {editing ? (
            <form key={editing.id} onSubmit={onSaveEdit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" defaultValue={editing.name} required />
              </div>
              <div>
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" name="address" defaultValue={editing.address} required />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  name="status"
                  className="h-10 w-full rounded border border-border bg-background px-3 text-sm"
                  defaultValue={editing.status}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <Label htmlFor="edit-logo">Replace logo</Label>
                <Input id="edit-logo" name="logo" type="file" accept="image/jpeg,image/png,image/webp" />
              </div>
              {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
