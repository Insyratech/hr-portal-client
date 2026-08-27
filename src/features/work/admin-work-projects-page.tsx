'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoading } from '@/components/ui/page-loading';
import { CheckboxIdPicker } from '@/features/work/checkbox-id-picker';
import { ProjectStatusUpdateList } from '@/features/work/project-status-updates';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useCreateWorkProjectMutation,
  useGetEmployeesQuery,
  useGetProjectStatusUpdatesQuery,
  useGetWorkProjectsQuery,
  useSetProjectMembersMutation,
  useSetWorkProjectStatusMutation,
} from '@/store/api/api';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import type { WorkProject } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function ProjectUpdatesDialog({
  project,
  open,
  onOpenChange,
}: {
  project: WorkProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError } = useGetProjectStatusUpdatesQuery(project?.id ?? '', {
    skip: !open || !project?.id,
  });
  const updates = data?.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogTitle>Status updates · {project?.code ?? 'Project'}</DialogTitle>
        <DialogDescription>
          {project
            ? `Read-only history for ${project.name}. Only the current lead can post.`
            : 'Read-only project status history.'}
        </DialogDescription>
        <div className="mt-6">
          {isLoading ? <PageLoading compact message="Loading updates…" /> : null}
          {isError ? <PageLoading compact message="Could not load status updates." /> : null}
          {!isLoading && !isError ? (
            <ProjectStatusUpdateList
              updates={updates}
              emptyLabel="No status updates from the project lead yet."
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminWorkProjectsPage() {
  const toast = useToast();
  const pathname = usePathname();
  const canManage = useAppSelector((state) =>
    state.permissions.permissions.includes(PERMISSIONS.PROJECTS_MANAGE),
  );
  const canViewUpdates = useAppSelector((state) => {
    const perms = state.permissions.permissions;
    const roles = state.auth.user?.roles ?? [];
    return perms.includes(PERMISSIONS.PROJECTS_MANAGE) || roles.includes('SUPER_ADMIN');
  });
  const { data, isLoading, refetch } = useGetWorkProjectsQuery();
  const { data: employees } = useGetEmployeesQuery({ status: 'active' }, { skip: !canManage });
  const [createProject, { isLoading: saving }] = useCreateWorkProjectMutation();
  const [setMembers, setMembersState] = useSetProjectMembersMutation();
  const [setStatus, setStatusState] = useSetWorkProjectStatusMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [createMemberIds, setCreateMemberIds] = useState<string[]>([]);
  const [createLeadId, setCreateLeadId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemberIds, setEditMemberIds] = useState<string[]>([]);
  const [editLeadId, setEditLeadId] = useState('');
  const [updatesProjectId, setUpdatesProjectId] = useState<string | null>(null);

  const projects = useMemo(() => data?.data ?? [], [data?.data]);
  const editingProject = useMemo(
    () => projects.find((row) => row.id === editingId) ?? null,
    [projects, editingId],
  );
  const updatesProject = useMemo(
    () => projects.find((row) => row.id === updatesProjectId) ?? null,
    [projects, updatesProjectId],
  );
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

  const createLeadOptions = useMemo(() => {
    const selected = new Set(createMemberIds);
    if (createLeadId) selected.add(createLeadId);
    const fromMembers = people.filter((person) => selected.has(person.id));
    return fromMembers.length > 0 ? fromMembers : people;
  }, [people, createMemberIds, createLeadId]);

  const editLeadOptions = useMemo(() => {
    const selected = new Set(editMemberIds);
    if (editLeadId) selected.add(editLeadId);
    return people.filter((person) => selected.has(person.id));
  }, [people, editMemberIds, editLeadId]);

  const employeesHref = pathname.startsWith('/super-admin')
    ? '/super-admin/employees'
    : '/cso/work/employees';

  useEffect(() => {
    if (!editingId) return;
    const project = projects.find((row) => row.id === editingId);
    if (!project) return;
    setEditMemberIds((project.members ?? []).map((member) => member.employeeId));
    setEditLeadId(project.leadEmployeeId ?? '');
  }, [editingId, projects]);

  function resetCreateForm() {
    setName('');
    setCode('');
    setCreateMemberIds([]);
    setCreateLeadId('');
  }

  function closeCreate() {
    setCreateOpen(false);
    resetCreateForm();
  }

  function closeMembers() {
    setEditingId(null);
    setEditLeadId('');
  }

  function onCreateMembersChange(ids: string[]) {
    setCreateMemberIds(ids);
    if (createLeadId && !ids.includes(createLeadId)) {
      setCreateLeadId('');
    }
  }

  function onEditMembersChange(ids: string[]) {
    setEditMemberIds(ids);
    if (editLeadId && !ids.includes(editLeadId)) {
      setEditLeadId('');
    }
  }

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!createLeadId) {
      toast.warning('Choose a project lead.');
      return;
    }
    try {
      const memberIds = [...new Set([...createMemberIds, createLeadId])];
      await createProject({
        name,
        code,
        leadEmployeeId: createLeadId,
        employeeIds: memberIds,
      }).unwrap();
      resetCreateForm();
      setCreateOpen(false);
      toast.success('Project saved with a project lead.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create the project.'));
    }
  }

  async function onSaveMembers(project: WorkProject) {
    if (!editLeadId) {
      toast.warning('Choose a project lead. Every project needs exactly one lead.');
      return;
    }
    if (!editMemberIds.includes(editLeadId)) {
      toast.warning('The project lead must also be a member. Choose a new lead before removing the current one.');
      return;
    }
    try {
      await setMembers({
        projectId: project.id,
        employeeIds: [...new Set([...editMemberIds, editLeadId])],
        leadEmployeeId: editLeadId,
      }).unwrap();
      toast.success('Members and project lead updated.');
      setEditingId(null);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update members.'));
    }
  }

  async function onToggleStatus(project: WorkProject) {
    const next = project.status === 'active' ? 'inactive' : 'active';
    try {
      await setStatus({ projectId: project.id, status: next }).unwrap();
      toast.success(next === 'active' ? 'Project reactivated.' : 'Project marked inactive.');
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not update project status.'));
    }
  }

  return (
    <>
      <PageHeader
        kicker="Work"
        title="Projects"
        actions={
          canManage ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Add project
            </Button>
          ) : null
        }
      />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Each project needs exactly one lead (set by CSO). Inactive projects stay in this list for history but disappear
        from leave pickers and My projects. Leads post status updates on their desk; open Updates here to read them.
      </p>

      {!canManage ? (
        <p className="mb-8 text-sm text-muted">You can view projects. Creating them needs projects.manage.</p>
      ) : null}

      {isLoading ? <PageLoading compact message="Loading projects…" /> : null}
      <DataTable
        columns={[
          { id: 'code', header: 'Code', cell: (row) => row.code },
          { id: 'name', header: 'Name', cell: (row) => row.name },
          {
            id: 'lead',
            header: 'Lead',
            cell: (row) => row.leadName ?? '—',
          },
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
            cell: (row) => (
              <div className="flex flex-wrap justify-end gap-2">
                {canViewUpdates ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setUpdatesProjectId(row.id)}
                  >
                    Updates
                  </Button>
                ) : null}
                {canManage ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={setStatusState.isLoading}
                      onClick={() => void onToggleStatus(row)}
                    >
                      {row.status === 'active' ? 'Mark inactive' : 'Reactivate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={row.status !== 'active'}
                      onClick={() => setEditingId(row.id)}
                    >
                      Assign people
                    </Button>
                  </>
                ) : null}
              </div>
            ),
          },
        ]}
        rows={projects}
        emptyTitle="No projects yet"
        emptyDescription="Add a project here before assigning project priorities."
      />

      <ProjectUpdatesDialog
        project={updatesProject}
        open={Boolean(updatesProjectId)}
        onOpenChange={(open) => {
          if (!open) setUpdatesProjectId(null);
        }}
      />

      <Dialog
        open={createOpen && canManage}
        onOpenChange={(open) => {
          if (!open) closeCreate();
          else setCreateOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            Pick a required project lead. The lead is always a member. You are also added as a member when you create
            the project.
          </DialogDescription>
          <form onSubmit={onCreate} className="mt-6 space-y-4">
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
              <Label>Members</Label>
              <p className="mb-2 text-xs text-muted">Optional extras. The lead is included automatically.</p>
              <CheckboxIdPicker
                options={people}
                selectedIds={createMemberIds}
                onChange={onCreateMembersChange}
                emptyLabel="No active employees to assign yet."
              />
            </div>
            <div>
              <Label htmlFor="project-lead">Project lead</Label>
              <select
                id="project-lead"
                className={selectClass}
                value={createLeadId}
                onChange={(event) => {
                  const next = event.target.value;
                  setCreateLeadId(next);
                  if (next && !createMemberIds.includes(next)) {
                    setCreateMemberIds((prev) => [...prev, next]);
                  }
                }}
                required
              >
                <option value="">Choose lead</option>
                {createLeadOptions.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.label}
                    {person.hint ? ` · ${person.hint}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeCreate}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingId) && canManage}
        onOpenChange={(open) => {
          if (!open) closeMembers();
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>Members · {editingProject?.code ?? 'Project'}</DialogTitle>
          <DialogDescription>
            {editingProject
              ? `Update who belongs on ${editingProject.name}. Every project needs exactly one lead.`
              : 'Update members and project lead.'}
          </DialogDescription>
          {editingProject ? (
            <div className="mt-6 space-y-4">
              <div>
                <Label>Members</Label>
                <CheckboxIdPicker options={people} selectedIds={editMemberIds} onChange={onEditMembersChange} />
              </div>
              <div>
                <Label htmlFor="edit-project-lead">Project lead</Label>
                <select
                  id="edit-project-lead"
                  className={selectClass}
                  value={editLeadId}
                  onChange={(event) => {
                    const next = event.target.value;
                    setEditLeadId(next);
                    if (next && !editMemberIds.includes(next)) {
                      setEditMemberIds((prev) => [...prev, next]);
                    }
                  }}
                  required
                >
                  <option value="">Choose lead</option>
                  {(editLeadOptions.length > 0 ? editLeadOptions : people).map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.label}
                      {person.hint ? ` · ${person.hint}` : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted">
                  To remove the current lead from members, choose a different lead first. Changing the lead moves any
                  pending leave approvals to the new lead.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={employeesHref}
                  className="text-sm text-muted underline-offset-2 hover:text-foreground hover:underline"
                >
                  Open Employees
                </Link>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={closeMembers}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={setMembersState.isLoading}
                    onClick={() => void onSaveMembers(editingProject)}
                  >
                    {setMembersState.isLoading ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
