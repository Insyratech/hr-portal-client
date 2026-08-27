'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { CheckboxIdPicker } from '@/features/work/checkbox-id-picker';
import { EmployeeWorkPanel } from '@/features/employees/employee-work-panel';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useGetEmployeeQuery,
  useGetEmployeeWorkProjectsQuery,
  useGetWorkProjectsQuery,
  useSetEmployeeWorkProjectsMutation,
} from '@/store/api/api';

export function CsoEmployeeDetailPage({ employeeId }: { employeeId: string }) {
  const toast = useToast();
  const { data: employeeData, isError: employeeError, isLoading: employeeLoading } = useGetEmployeeQuery(employeeId);
  const { data: assignedData, isLoading: assignedLoading } = useGetEmployeeWorkProjectsQuery(employeeId);
  const { data: catalogData } = useGetWorkProjectsQuery();
  const [setProjects, setState] = useSetEmployeeWorkProjectsMutation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const employee = employeeData?.data;
  const catalog = catalogData?.data ?? [];
  const assignedIds = useMemo(
    () => (assignedData?.data.projects ?? []).map((project) => project.id),
    [assignedData?.data.projects],
  );

  useEffect(() => {
    setSelectedIds(assignedIds);
  }, [assignedIds]);

  const options = useMemo(
    () =>
      catalog.map((project) => ({
        id: project.id,
        label: `${project.code} · ${project.name}`,
        hint: `${project.memberCount ?? project.members?.length ?? 0} member(s)`,
      })),
    [catalog],
  );

  const dirty = [...selectedIds].sort().join(',') !== [...assignedIds].sort().join(',');

  async function onSave() {
    try {
      await setProjects({ employeeId, projectIds: selectedIds }).unwrap();
      toast.success('Projects updated for this employee.');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update projects.'));
    }
  }

  if (employeeLoading) {
    return <p className="text-sm text-muted">Loading employee…</p>;
  }
  if (employeeError || !employee) {
    return <p className="text-sm">Unable to load this employee.</p>;
  }

  return (
    <>
      <PageHeader kicker="Work" title={employee.fullName} />
      <p className="mb-2 text-sm text-muted">
        {employee.employeeCode}
        {employee.departmentName ? ` · ${employee.departmentName}` : ''}
        {employee.designationName ? ` · ${employee.designationName}` : ''}
      </p>
      <p className="mb-8 text-sm text-muted">
        <Link href="/cso/work/employees" className="underline-offset-2 hover:underline">
          ← All employees
        </Link>
        {' · '}
        <Link
          href={`/cso/work/priorities?employeeId=${encodeURIComponent(employeeId)}`}
          className="underline-offset-2 hover:underline"
        >
          Open priorities
        </Link>
        {' · '}
        <Link href="/cso/work/projects" className="underline-offset-2 hover:underline">
          Projects catalog
        </Link>
      </p>

      <section className="mb-10 max-w-2xl space-y-4 border border-border bg-background p-5 shadow-card">
        <Meta>Allocated projects</Meta>
        <p className="text-sm text-muted">
          One employee can join many projects; one project can include many employees. Saving replaces the full set.
        </p>
        {assignedLoading ? <p className="text-sm text-muted">Loading assignments…</p> : null}
        <CheckboxIdPicker
          options={options}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          emptyLabel="Create a project first under Projects."
        />
        <Button type="button" disabled={!dirty || setState.isLoading} onClick={() => void onSave()}>
          {setState.isLoading ? 'Saving…' : 'Save projects'}
        </Button>
      </section>

      <EmployeeWorkPanel employeeId={employeeId} />
    </>
  );
}
