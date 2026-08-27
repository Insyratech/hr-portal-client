'use client';

import { useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { DataTable, type DataTableColumn } from '@/components/dashboard/data-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { Meta } from '@/components/layout/meta';
import { PageHeader } from '@/components/layout/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetCompaniesQuery, useGetReportsOverviewQuery } from '@/store/api/api';

type NamedCount = { id: string; name: string; count: number };

const NAME_COUNT_COLUMNS: DataTableColumn<NamedCount>[] = [
  { id: 'name', header: 'Name', cell: (row) => row.name },
  { id: 'count', header: 'Count', cell: (row) => String(row.count) },
];

export function ReportsOverviewPage({ kicker }: { kicker: string }) {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [companyId, setCompanyId] = useState('');
  const { data: companiesData } = useGetCompaniesQuery();
  const { data, isLoading, isError } = useGetReportsOverviewQuery({
    period,
    companyId: companyId || undefined,
  });
  const report = data?.data;

  if (isLoading && !report) {
    return (
      <>
        <PageHeader kicker={kicker} title="Analytics" />
        <PageLoading compact message="Loading reports…" />
      </>
    );
  }

  if (isError || !report) {
    return (
      <>
        <PageHeader kicker={kicker} title="Analytics" />
        <p className="text-sm text-muted">Unable to load reports. Confirm you have reports.view.</p>
      </>
    );
  }

  const leaveTypeRows = report.leave.byType.map((row) => ({
    id: row.name,
    name: row.name,
    count: row.used,
  }));
  const deptRows = report.employees.byDepartment.map((row) => ({
    id: row.name,
    name: row.name,
    count: row.count,
  }));
  const grievanceRows = report.grievances.byCategory.map((row) => ({
    id: row.category,
    name: row.category,
    count: row.count,
  }));
  const attendanceRows = report.attendance.byStatus.map((row) => ({
    id: row.status,
    name: row.status,
    count: row.count,
  }));

  return (
    <>
      <PageHeader kicker={kicker} title="Analytics" />
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="max-w-xs">
          <Label htmlFor="report-period">Month</Label>
          <Input
            id="report-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        </div>
        <div className="max-w-xs">
          <Label htmlFor="report-company">Company</Label>
          <select
            id="report-company"
            className="h-10 w-full border border-border bg-background px-3 text-sm"
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
      <Meta className="mb-4">
        Leave period {report.period} · Attendance {report.attendanceRange.from} → {report.attendanceRange.to}
        {report.attendance.published ? '' : ' · Month not confirmed yet'}
      </Meta>

      <Meta className="mb-3">Employees</Meta>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard value={String(report.employees.total)} label="Total" icon="users" />
        <StatCard value={String(report.employees.active)} label="Active" icon="badge" />
        <StatCard value={String(report.employees.inactive)} label="Inactive" icon="audit" />
        <StatCard value={String(report.employees.byDepartment.length)} label="Departments" icon="building" />
      </div>

      <Meta className="mb-3">Leave (ledger)</Meta>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
        <StatCard value={String(report.leave.used)} label="Days used" icon="leave" />
        <StatCard value={String(report.leave.allocated)} label="Allocated" icon="file" />
        <StatCard value={`${Math.round(report.leave.utilizationRate * 100)}%`} label="Utilization" icon="grid" />
        <StatCard value={String(report.leave.pendingApprovals)} label="Pending approvals" icon="bell" />
      </div>

      <Meta className="mb-3">Attendance (confirmed import)</Meta>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5 lg:gap-6">
        <StatCard value={String(report.attendance.present)} label="Present" icon="users" />
        <StatCard value={String(report.attendance.late)} label="Late" icon="clock" />
        <StatCard value={String(report.attendance.absent)} label="Absent" icon="audit" />
        <StatCard value={String(report.attendance.lop)} label="LOP" icon="file" />
        <StatCard value={String(report.attendance.missingPunches)} label="Miss punch" icon="calendar" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-2">
        <StatCard value={String(report.attendance.onLeave)} label="On leave" />
        <StatCard value={String(report.attendance.halfDay)} label="Half day" />
      </div>

      <Meta className="mb-3">Grievances</Meta>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard value={String(report.grievances.open)} label="Open" />
        <StatCard value={String(report.grievances.resolved)} label="Resolved / closed" />
        <StatCard
          value={
            report.grievances.averageResolutionHours == null
              ? '—'
              : `${report.grievances.averageResolutionHours}h`
          }
          label="Avg resolution"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Meta className="mb-3">Employees by department</Meta>
          <DataTable
            columns={NAME_COUNT_COLUMNS}
            rows={deptRows}
            emptyTitle="No employees"
            emptyDescription="Headcount by department will appear here."
          />
        </div>
        <div>
          <Meta className="mb-3">Leave used by type</Meta>
          <DataTable
            columns={NAME_COUNT_COLUMNS}
            rows={leaveTypeRows}
            emptyTitle="No leave usage"
            emptyDescription="Ledger usage by leave type will appear here."
          />
        </div>
        <div>
          <Meta className="mb-3">Attendance by status</Meta>
          <DataTable
            columns={NAME_COUNT_COLUMNS}
            rows={attendanceRows}
            emptyTitle="No attendance rows"
            emptyDescription="Statuses from the confirmed import for this month."
          />
        </div>
        <div>
          <Meta className="mb-3">Grievances by category</Meta>
          <DataTable
            columns={NAME_COUNT_COLUMNS}
            rows={grievanceRows}
            emptyTitle="No grievances"
            emptyDescription="Category distribution will appear here."
          />
        </div>
      </div>
    </>
  );
}
