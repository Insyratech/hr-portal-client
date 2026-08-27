'use client';

import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Meta } from '@/components/layout/meta';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useGetCompaniesQuery, useUpdateEmployeeCompanyMutation } from '@/store/api/api';
import type { Employee } from '@/types/api';

export function EmployeeCompanyEditor({ employee }: { employee: Employee }) {
  const toast = useToast();
  const { data: companies } = useGetCompaniesQuery();
  const [updateCompany, { isLoading }] = useUpdateEmployeeCompanyMutation();
  const activeCompanies = (companies?.data ?? []).filter(
    (item) => item.status === 'active' || item.id === employee.companyId,
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const companyId = String(form.get('companyId') ?? '');
    if (!companyId) {
      toast.error('Select a company.');
      return;
    }
    try {
      await updateCompany({ id: employee.id, companyId }).unwrap();
      toast.success('Company saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save company.'));
    }
  }

  return (
    <section className="mb-8 max-w-2xl space-y-4 rounded border border-border bg-background p-5 shadow-card">
      <div>
        <Meta>Company</Meta>
        <p className="mt-1 text-sm text-muted">
          Required before payroll runs. No directory unlock needed — HR Manager sets this.
        </p>
      </div>
      {activeCompanies.length === 0 ? (
        <p className="text-sm text-muted">Add companies under Organization first.</p>
      ) : (
        <form key={`${employee.id}:${employee.companyId ?? ''}`} onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="companyId">Company</Label>
            <select
              id="companyId"
              name="companyId"
              required
              className="h-10 w-full border border-border bg-background px-3 text-sm"
              defaultValue={employee.companyId ?? ''}
            >
              <option value="">Select</option>
              {activeCompanies.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Save company'}
          </Button>
        </form>
      )}
    </section>
  );
}
