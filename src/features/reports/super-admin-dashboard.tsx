'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable } from '@/components/dashboard/data-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { Meta } from '@/components/layout/meta';
import { PageHeader } from '@/components/layout/page-header';
import { PageLoading } from '@/components/ui/page-loading';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from '@/components/theme-provider';
import { CHART, CHART_SERIES, chartTooltipStyle } from '@/features/reports/chart-theme';
import {
  useGetCompaniesQuery,
  useGetEmployeesQuery,
  useGetReportsOverviewQuery,
} from '@/store/api/api';
import { cn } from '@/lib/utils';

type Panel =
  | 'projects'
  | 'people'
  | 'leavePending'
  | 'leaveStatus'
  | 'permissions'
  | 'edits'
  | 'shifts'
  | 'grievances'
  | null;

type ProjectFilter = 'all' | 'active' | 'inactive' | 'milestone';

function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded border border-border bg-background p-4 shadow-card sm:p-5', className)}>
      <Meta>{title}</Meta>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-4 h-56 w-full min-w-0 sm:h-64">{children}</div>
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded border border-dashed border-border px-4 text-center text-sm text-muted">
      {message}
    </div>
  );
}

function projectStatusTone(status: string): 'approved' | 'pending' | 'rejected' {
  if (status === 'active') return 'approved';
  if (status === 'inactive') return 'rejected';
  return 'pending';
}

function approvalLabel(status: string): string {
  switch (status) {
    case 'SUBMITTED':
      return 'Submitted';
    case 'APPROVED':
      return 'Approved';
    case 'RESUBMIT_REQUESTED':
      return 'Resubmit';
    case 'DRAFT':
      return 'Draft';
    default:
      return status;
  }
}

function queueTone(status: string): 'approved' | 'pending' | 'rejected' {
  const value = status.toUpperCase();
  if (value === 'APPROVED' || value === 'RESOLVED' || value === 'CLOSED' || value === 'ACTIVE') {
    return 'approved';
  }
  if (value === 'REJECTED' || value === 'CANCELLED') return 'rejected';
  return 'pending';
}

export function SuperAdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const tooltip = chartTooltipStyle(isDark);
  const axisStroke = isDark ? '#737373' : '#a3a3a3';
  const gridStroke = isDark ? '#262626' : '#e5e5e5';

  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [companyId, setCompanyId] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');

  const { data: companiesData } = useGetCompaniesQuery();
  const { data, isLoading, isError, error, isFetching } = useGetReportsOverviewQuery(
    {
      period,
      companyId: companyId || undefined,
    },
    { refetchOnMountOrArgChange: true },
  );
  const { data: employeesData, isLoading: peopleLoading } = useGetEmployeesQuery(undefined, {
    skip: panel !== 'people',
  });
  const report = data?.data;

  const projectItems = useMemo(() => {
    const items = report?.projects.items ?? [];
    if (projectFilter === 'active') return items.filter((row) => row.status === 'active');
    if (projectFilter === 'inactive') return items.filter((row) => row.status === 'inactive');
    if (projectFilter === 'milestone') return items.filter((row) => Boolean(row.activeMilestoneName));
    return items;
  }, [report?.projects.items, projectFilter]);

  const projectStatusChart = useMemo(() => {
    const byStatus = report?.projects.byStatus ?? [];
    if (byStatus.length > 0) {
      return byStatus.map((row) => ({
        name: row.status === 'active' ? 'Active' : 'Inactive',
        value: row.count,
        fill: row.status === 'active' ? CHART.teal : CHART.slate,
      }));
    }
    const rows: { name: string; value: number; fill: string }[] = [];
    const active = report?.projects.active ?? 0;
    const inactive = report?.projects.inactive ?? 0;
    if (active > 0) rows.push({ name: 'Active', value: active, fill: CHART.teal });
    if (inactive > 0) rows.push({ name: 'Inactive', value: inactive, fill: CHART.slate });
    return rows;
  }, [report?.projects.active, report?.projects.inactive, report?.projects.byStatus]);

  const prioritiesChart = useMemo(
    () =>
      (report?.work.prioritiesByApproval ?? []).map((row, index) => ({
        name: approvalLabel(row.status),
        count: row.count,
        fill: CHART_SERIES[index % CHART_SERIES.length],
      })),
    [report?.work.prioritiesByApproval],
  );

  const leaveTypeChart = useMemo(
    () =>
      (report?.leave.byType ?? [])
        .filter((row) => row.used > 0 || row.allocated > 0)
        .map((row) => ({
          name: row.name,
          used: row.used,
          available: row.available,
        })),
    [report?.leave.byType],
  );

  const attendancePie = useMemo(
    () =>
      (report?.attendance.byStatus ?? []).map((row, index) => ({
        name: row.status.replaceAll('_', ' '),
        value: row.count,
        fill: CHART_SERIES[index % CHART_SERIES.length],
      })),
    [report?.attendance.byStatus],
  );

  const permissionPie = useMemo(
    () =>
      (report?.permissions.byStatus ?? []).map((row) => ({
        name: row.status,
        value: row.count,
        fill:
          row.status === 'APPROVED' ? CHART.emerald : row.status === 'PENDING' ? CHART.amber : CHART.rose,
      })),
    [report?.permissions.byStatus],
  );

  const peopleRows = useMemo(() => {
    const rows = employeesData?.data ?? [];
    return companyId ? rows.filter((row) => row.companyId === companyId) : rows;
  }, [employeesData?.data, companyId]);

  const openProjects = (filter: ProjectFilter = 'all') => {
    setProjectFilter(filter);
    setPanel('projects');
  };

  if (isLoading && !report) {
    return (
      <>
        <PageHeader kicker="Super admin" title="Overview" />
        <PageLoading compact message="Loading organisation dashboard…" />
      </>
    );
  }

  if (isError || !report) {
    const detail =
      error && typeof error === 'object' && 'data' in error
        ? String((error as { data?: { message?: string } }).data?.message ?? '')
        : '';
    return (
      <>
        <PageHeader kicker="Super admin" title="Overview" />
        <p className="text-sm text-muted">
          Unable to load the organisation dashboard
          {detail ? `: ${detail}` : '. Try refreshing, or open Full analytics after the API is healthy.'}
        </p>
      </>
    );
  }

  const queues = report.queues;
  const leaveStatus = report.leave.employeeStatus ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <PageHeader kicker="Super admin" title="Overview" />
          <p className="mt-2 text-sm text-muted">
            Projects, priorities, and action queues for {report.period}. Click any card for a detail table.
            {isFetching ? ' Refreshing…' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <Label htmlFor="sa-dash-period">Month</Label>
            <Input
              id="sa-dash-period"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-[11rem]"
            />
          </div>
          <div>
            <Label htmlFor="sa-dash-company">Company</Label>
            <select
              id="sa-dash-company"
              className="h-10 w-[14rem] rounded border border-border bg-background px-3 text-sm text-foreground"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
            >
              <option value="">All companies</option>
              {(companiesData?.data ?? []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <section>
        <Meta className="mb-3">Projects &amp; work</Meta>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <StatCard
            compact
            value={String(report.projects.active)}
            label="Active projects"
            icon="building"
            active={panel === 'projects' && projectFilter === 'active'}
            onClick={() => openProjects('active')}
          />
          <StatCard
            compact
            value={String(report.projects.inactive)}
            label="Inactive projects"
            icon="building"
            active={panel === 'projects' && projectFilter === 'inactive'}
            onClick={() => openProjects('inactive')}
          />
          <StatCard
            compact
            value={String(report.projects.withActiveMilestone)}
            label="With active milestone"
            icon="grid"
            active={panel === 'projects' && projectFilter === 'milestone'}
            onClick={() => openProjects('milestone')}
          />
          <StatCard
            compact
            value={String(report.work.prioritiesPendingApproval)}
            label="Priorities to review"
            icon="grid"
            onClick={() => router.push('/super-admin/work/priorities')}
          />
          <StatCard
            compact
            value={String(report.work.dailyUpdatesThisWeek)}
            label="Updates this week"
            icon="calendar"
            onClick={() => router.push('/super-admin/work')}
          />
          <StatCard
            compact
            value={String(report.projects.statusUpdatesThisPeriod)}
            label="Project notes (month)"
            icon="file"
            onClick={() => router.push('/super-admin/work/projects')}
          />
        </div>
      </section>

      <section>
        <Meta className="mb-3">Action queues</Meta>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            compact
            value={String(queues.pendingLeaves)}
            label="Leave pending"
            icon="leave"
            active={panel === 'leavePending'}
            onClick={() => setPanel('leavePending')}
          />
          <StatCard
            compact
            value={String(queues.pendingPermissions)}
            label="Permissions pending"
            icon="clock"
            active={panel === 'permissions'}
            onClick={() => setPanel('permissions')}
          />
          <StatCard
            compact
            value={String(queues.pendingEditRequests)}
            label="Edit unlocks"
            icon="audit"
            active={panel === 'edits'}
            onClick={() => setPanel('edits')}
          />
          <StatCard
            compact
            value={String(queues.pendingShiftChanges)}
            label="Shift changes"
            icon="clock"
            active={panel === 'shifts'}
            onClick={() => setPanel('shifts')}
          />
          <StatCard
            compact
            value={String(queues.openGrievances)}
            label="Open grievances"
            icon="shield"
            active={panel === 'grievances'}
            onClick={() => setPanel('grievances')}
          />
        </div>
      </section>

      <section>
        <Meta className="mb-3">People &amp; leave</Meta>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            compact
            value={String(report.employees.total)}
            label="People"
            icon="users"
            active={panel === 'people'}
            onClick={() => setPanel('people')}
          />
          <StatCard
            compact
            value={String(report.employees.active)}
            label="Active accounts"
            icon="badge"
            active={panel === 'people'}
            onClick={() => setPanel('people')}
          />
          <StatCard
            compact
            value={`${Math.round(report.leave.utilizationRate * 100)}%`}
            label="Leave used"
            icon="leave"
            active={panel === 'leaveStatus'}
            onClick={() => setPanel('leaveStatus')}
          />
          <StatCard
            compact
            value={String(report.leave.pendingApprovals)}
            label="Leave to approve"
            icon="bell"
            active={panel === 'leavePending'}
            onClick={() => setPanel('leavePending')}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <ChartCard title="Project status" description="Active vs inactive. Open a Projects card for the full table.">
          {projectStatusChart.length === 0 ? (
            <EmptyChart message="No projects yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusChart}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={84}
                  paddingAngle={2}
                >
                  {projectStatusChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltip} formatter={(value: number) => [value, 'Projects']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Priority approvals"
          description="How weekly priorities sit in the approval loop."
          className="xl:col-span-2"
        >
          {prioritiesChart.length === 0 ? (
            <EmptyChart message="No priorities in the system yet." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prioritiesChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <Tooltip {...tooltip} formatter={(value: number) => [value, 'Priorities']} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {prioritiesChart.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Leave by type"
          description={`Ledger for ${report.leave.period} · ${report.leave.pendingApprovals} pending. Click Leave used for per-employee status.`}
        >
          {leaveTypeChart.length === 0 ? (
            <EmptyChart message="No leave ledger rows for this month." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leaveTypeChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke={axisStroke} tick={{ fill: axisStroke, fontSize: 11 }} />
                <Tooltip {...tooltip} />
                <Legend />
                <Bar dataKey="used" name="Used" fill={CHART.amber} radius={[4, 4, 0, 0]} />
                <Bar dataKey="available" name="Available" fill={CHART.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Attendance mix"
          description={
            report.attendance.published
              ? `Confirmed ${report.attendanceRange.from} → ${report.attendanceRange.to}`
              : 'Fills after HR confirms this month’s attendance import.'
          }
        >
          {attendancePie.length === 0 ? (
            <EmptyChart message="No confirmed attendance for this month." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={2}>
                  {attendancePie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltip} formatter={(value: number) => [value, 'Days']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Work permissions"
          description={`${report.permissions.minutesApprovedThisPeriod} minutes approved this month.`}
        >
          {permissionPie.length === 0 ? (
            <EmptyChart message="No permission requests in this month." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={permissionPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={2}>
                  {permissionPie.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip {...tooltip} formatter={(value: number) => [value, 'Requests']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <DetailDialog
        open={panel === 'projects'}
        onOpenChange={(open) => setPanel(open ? 'projects' : null)}
        title="Projects"
        description="Status, lead, members, and active milestone for every project."
        actionLabel="Open project admin"
        onAction={() => router.push('/super-admin/work/projects')}
      >
        <DataTable
          columns={[
            { id: 'name', header: 'Project', cell: (row) => row.name },
            { id: 'code', header: 'Code', cell: (row) => row.code },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={projectStatusTone(row.status)} label={row.status} />,
            },
            { id: 'lead', header: 'Lead', cell: (row) => row.leadName ?? '—' },
            { id: 'members', header: 'Members', cell: (row) => String(row.memberCount) },
            {
              id: 'milestone',
              header: 'Active milestone',
              cell: (row) => row.activeMilestoneName ?? 'None',
            },
          ]}
          rows={projectItems}
          emptyTitle="No projects"
          emptyDescription="Projects created by CSO appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'people'}
        onOpenChange={(open) => setPanel(open ? 'people' : null)}
        title="People"
        description={`Accounts in scope${companyId ? ' for the selected company' : ''}.`}
        actionLabel="Open employees"
        onAction={() => router.push('/super-admin/employees')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.employeeCode },
            { id: 'name', header: 'Name', cell: (row) => row.fullName },
            { id: 'company', header: 'Company', cell: (row) => row.companyName ?? '—' },
            { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => (
                <StatusBadge status={row.status === 'active' ? 'approved' : 'rejected'} label={row.status} />
              ),
            },
            { id: 'roles', header: 'Roles', cell: (row) => row.roleCodes.join(', ') || '—' },
          ]}
          rows={peopleRows}
          loading={peopleLoading}
          emptyTitle="No people"
          emptyDescription="Employee accounts appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'leavePending'}
        onOpenChange={(open) => setPanel(open ? 'leavePending' : null)}
        title="Leave pending"
        description="Applications waiting for approval."
        actionLabel="Open leave queue"
        onAction={() => router.push('/super-admin/leaves')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.employeeCode },
            { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
            { id: 'type', header: 'Type', cell: (row) => row.leaveTypeName },
            {
              id: 'dates',
              header: 'Dates',
              cell: (row) => `${row.startDate} → ${row.endDate}`,
            },
            { id: 'qty', header: 'Days', cell: (row) => String(row.quantity) },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={queueTone(row.status)} label={row.status} />,
            },
          ]}
          rows={queues.leaves ?? []}
          emptyTitle="No pending leave"
          emptyDescription="New leave applications appear here while awaiting approval."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'leaveStatus'}
        onOpenChange={(open) => setPanel(open ? 'leaveStatus' : null)}
        title="Leave status by employee"
        description={`Used vs allocated for ${report.leave.period}.`}
        actionLabel="Open leave board"
        onAction={() => router.push('/super-admin/leaves')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.employeeCode },
            { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
            { id: 'used', header: 'Used', cell: (row) => String(row.used) },
            { id: 'alloc', header: 'Allocated', cell: (row) => String(row.allocated) },
            { id: 'avail', header: 'Available', cell: (row) => String(row.available) },
            {
              id: 'util',
              header: 'Used %',
              cell: (row) => `${Math.round(row.utilizationRate * 100)}%`,
            },
          ]}
          rows={leaveStatus}
          emptyTitle="No leave balances"
          emptyDescription="Employee leave ledgers for this month appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'permissions'}
        onOpenChange={(open) => setPanel(open ? 'permissions' : null)}
        title="Permissions pending"
        description="Work permission requests awaiting HR decision."
        actionLabel="Open permissions"
        onAction={() => router.push('/super-admin/permissions')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.employeeCode },
            { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
            { id: 'date', header: 'Date', cell: (row) => row.permissionDate },
            { id: 'mins', header: 'Minutes', cell: (row) => String(row.minutes) },
            { id: 'slot', header: 'Slot', cell: (row) => row.slot },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={queueTone(row.status)} label={row.status} />,
            },
          ]}
          rows={queues.permissions ?? []}
          emptyTitle="No pending permissions"
          emptyDescription="New work permission requests appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'edits'}
        onOpenChange={(open) => setPanel(open ? 'edits' : null)}
        title="Edit unlocks"
        description="Directory edit requests waiting for Super Admin."
        actionLabel="Open edit requests"
        onAction={() => router.push('/super-admin/edit-requests')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.targetCode },
            { id: 'target', header: 'Employee', cell: (row) => row.targetName },
            { id: 'requester', header: 'Requester', cell: (row) => row.requesterName },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason || '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={queueTone(row.status)} label={row.status} />,
            },
          ]}
          rows={queues.editRequests ?? []}
          emptyTitle="No edit unlocks"
          emptyDescription="Pending directory unlock requests appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'shifts'}
        onOpenChange={(open) => setPanel(open ? 'shifts' : null)}
        title="Shift changes"
        description="Pending shift change requests across the organisation."
        actionLabel="Open attendance"
        onAction={() => router.push('/super-admin/attendance')}
      >
        <DataTable
          columns={[
            { id: 'code', header: 'Code', cell: (row) => row.employeeCode },
            { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
            {
              id: 'project',
              header: 'Project',
              cell: (row) => row.projectName ?? '—',
            },
            {
              id: 'dates',
              header: 'Dates',
              cell: (row) => `${row.startDate} → ${row.endDate}`,
            },
            {
              id: 'shift',
              header: 'Shift',
              cell: (row) => `${row.currentShiftName ?? '—'} → ${row.requestedShiftName ?? '—'}`,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={queueTone(row.status)} label={row.status} />,
            },
          ]}
          rows={queues.shiftChanges ?? []}
          emptyTitle="No shift changes"
          emptyDescription="Pending shift change requests appear here."
        />
      </DetailDialog>

      <DetailDialog
        open={panel === 'grievances'}
        onOpenChange={(open) => setPanel(open ? 'grievances' : null)}
        title="Open grievances"
        description="Cases still open, under review, or investigating."
        actionLabel="Open grievances"
        onAction={() => router.push('/super-admin/grievances')}
      >
        <DataTable
          columns={[
            { id: 'subject', header: 'Subject', cell: (row) => row.subject },
            { id: 'category', header: 'Category', cell: (row) => row.category },
            { id: 'employee', header: 'Employee', cell: (row) => row.employeeName ?? '—' },
            {
              id: 'status',
              header: 'Status',
              cell: (row) => <StatusBadge status={queueTone(row.status)} label={row.status} />,
            },
            {
              id: 'created',
              header: 'Opened',
              cell: (row) => row.createdAt.slice(0, 10),
            },
          ]}
          rows={queues.grievances ?? []}
          emptyTitle="No open grievances"
          emptyDescription="Open grievance cases appear here."
        />
      </DetailDialog>
    </div>
  );
}

function DetailDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  actionLabel,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
        <div className="mt-4">{children}</div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              onAction();
            }}
          >
            {actionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
