'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckboxIdPicker } from '@/features/work/checkbox-id-picker';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateWorkProjectMutation,
  useGetEmployeesQuery,
  useGetWorkProjectsQuery,
  useSetProjectMembersMutation,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import type { WorkProject } from '@/types/api';

export function AdminWorkProjectsPage() {
  const toast = useToast();
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.PROJECTS_MANAGE),
  );
  const { data, isLoading, refetch } = useGetWorkProjectsQuery();
  const { data: employees } = useGetEmployeesQuery({ status: 'active' }, { skip: !canManage });
  const [createProject, { isLoading: saving }] = useCreateWorkProjectMutation();
  const [setMembers, setMembersState] = useSetProjectMembersMutation();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [createMemberIds, setCreateMemberIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);

  const projects = data?.data ?? [];
  const people = useMemo(
    () =>
      (employees?.data ?? [])
        .slice()
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map((person) => ({
          id: person.id,
          label: person.fullName,
          hint: person.departmentName ?? person.employeeCode,
        })),
    [employees?.data],
  );

  useEffect(() => {
    if (!editingId) return;
    const project = projects.find((row) => row.id === editingId);
    setEditMemberIds((project?.members ?? []).map((member) => member.employeeId));
  }, [editingId, projects]);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createProject({
        name,
        code,
        employeeIds: createMemberIds.length ? createMemberIds : undefined,
      }).unwrap();
      setName('');
      setCode('');
      setCreateMemberIds([]);
      toast.success('Project saved. You were added as a member automatically.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create the project.'));
    }
  }

  async function onSaveMembers(project: WorkProject) {
    try {
      await setMembers({ projectId: project.id, employeeIds: editMemberIds }).unwrap();
      toast.success('Project members updated.');
      setEditingId(null);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update members.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Projects" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Catalog for project-type priorities. Assign many employees to a project here, or open an employee under
        Employees and assign many projects there.
      </p>

      {canManage ? (
        <form onSubmit={onCreate} className="mb-10 max-w-2xl space-y-4 border border-border bg-background p-5 shadow-card">
          <Meta>New project</Meta>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="project-name">Name</Label>
              <Input id="project-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="project-code">Code</Label>
              <Input id="project-code" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
          </div>
          <div>
            <Label>Members (optional)</Label>
            <p className="mb-2 text-xs text-muted">You are always added as a member when the project is created.</p>
            <CheckboxIdPicker
              options={people}
              selectedIds={createMemberIds}
              onChange={setCreateMemberIds}
              emptyLabel="No active employees to assign yet."
            />
          </div>
          <Button type="submit" disabled={saving}>
            Save project
          </Button>
        </form>
      ) : (
        <p className="mb-8 text-sm text-muted">You can view projects. Creating them needs projects.manage.</p>
      )}

      {isLoading ? <p className="text-sm text-muted">Loading projects…</p> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          {
            id: 'members',
            header: 'Members',
            cell: (row) => {
              const count = row.memberCount ?? row.members?.length ?? 0;
              if (count === 0) return '—';
              const names = (row.members ?? []).slice(0, 3).map((member) => member.fullName);
              const more = count > names.length ? ` +${count - names.length}` : '';
              return `${names.join(', ')}${more}`;
            },
          },
          { id: 'status', header: 'Status', cell: (row) => row.status },
          {
            id: 'actions',
            header: '',
            cell: (row) =>
              canManage ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId((current) => (current === row.id ? null : row.id))}
                >
                  {editingId === row.id ? 'Close' : 'Assign people'}
                </Button>
              ) : null,
          },
        ]}
        rows={projects}
        emptyTitle="No projects yet"
        emptyDescription="Add a project here before assigning project priorities."
      />

      {editingId ? (
        <section className="mt-6 max-w-2xl space-y-4 border border-border bg-background p-5 shadow-card">
          <Meta>
            Members · {projects.find((row) => row.id === editingId)?.code ?? 'Project'}
          </Meta>
          <CheckboxIdPicker options={people} selectedIds={editMemberIds} onChange={setEditMemberIds} />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={setMembersState.isLoading}
              onClick={() => {
                const project = projects.find((row) => row.id === editingId);
                if (project) void onSaveMembers(project);
              }}
            >
              {setMembersState.isLoading ? 'Saving…' : 'Save members'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
              Cancel
            </Button>
            <Link href="/cso/work/employees" className="self-center text-sm text-muted underline-offset-2 hover:underline">
              Open Employees
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
