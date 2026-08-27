'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { Meta } from '@/components/layout/meta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
  useGetWorkAnalyticsQuery,
} from '@/store/api/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function monthsAgo(count: number) {
  const [year, month] = monthNow().split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 - (count - 1), 1));
  return date.toISOString().slice(0, 7);
}

export function WorkAnalyticsPanel({
  employeeBasePath,
  fixedEmployeeId,
}: {
  employeeBasePath?: string;
  fixedEmployeeId?: string;
}) {
  const teamMode = !fixedEmployeeId;
  const [from, setFrom] = useState(() => monthsAgo(6));
  const [to, setTo] = useState(() => monthNow());
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const filters = useMemo(
    () => ({
      from,
      to,
      ...(teamMode && departmentId ? { departmentId } : {}),
      ...(fixedEmployeeId ? { employeeId: fixedEmployeeId } : employeeId ? { employeeId } : {}),
    }),
    [from, to, departmentId, employeeId, fixedEmployeeId, teamMode],
  );

  const { data, isLoading } = useGetWorkAnalyticsQuery(filters);
  const { data: departments } = useGetDepartmentsQuery(undefined, { skip: !teamMode });
  const { data: employees } = useGetEmployeesQuery(undefined, { skip: !teamMode });
  const analytics = data?.data;

  return (
    <section className="space-y-6">
      {!fixedEmployeeId ? (
        <p className="max-w-2xl text-sm text-muted">
          Filters apply to the whole team. Unplanned share is context, not a penalty. Leave and holidays are excluded
          from update compliance.
        </p>
      ) : (
        <div>
          <Meta>Trends</Meta>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Reliability, execution, adaptability, and development — indicators only, never a score.
          </p>
        </div>
      )}

      <div className={`grid gap-4 sm:grid-cols-2 ${teamMode ? 'lg:grid-cols-4' : ''}`}>
        <div>
          <Label htmlFor="work-analytics-from">From</Label>
          <Input
            id="work-analytics-from"
            type="month"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="work-analytics-to">To</Label>
          <Input id="work-analytics-to" type="month" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
        {teamMode ? (
          <>
            <div>
              <Label htmlFor="work-analytics-dept">Department</Label>
              <select
                id="work-analytics-dept"
                className={selectClass}
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
              >
                <option value="">All</option>
                {(departments?.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="work-analytics-emp">Employee</Label>
              <select
                id="work-analytics-emp"
                className={selectClass}
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">All</option>
                {(employees?.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fullName}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : null}
      </div>

      {isLoading ? <p className="text-sm text-muted">Loading insights…</p> : null}
      {!analytics ? null : (
        <>
          <p className="text-sm text-muted">{analytics.note}</p>

          <Meta>Reliability</Meta>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard value={`${analytics.reliability.compliancePct}%`} label="Update compliance" />
            <StatCard value={`${analytics.reliability.weeksWithPlanPct}%`} label="Weeks with a plan" />
            <StatCard
              value={`${analytics.reliability.submittedDays}/${analytics.reliability.requiredDays}`}
              label="Days submitted"
            />
            <StatCard
              value={`${analytics.reliability.weeksWithPlan}/${analytics.reliability.weeksTotal}`}
              label="Planned weeks"
            />
          </div>

          <Meta>Execution</Meta>
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={String(analytics.execution.completed)} label="Completed" />
            <StatCard value={String(analytics.execution.carriedForward)} label="Carried forward" />
            <StatCard value={String(analytics.execution.blocked)} label="Blocked" />
          </div>

          <Meta>Adaptability</Meta>
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={`${analytics.adaptability.unplannedSharePct}%`} label="Unplanned share" />
            <StatCard value={String(analytics.adaptability.plannedEntries)} label="Planned entries" />
            <StatCard value={String(analytics.adaptability.unplannedEntries)} label="Unplanned entries" />
          </div>

          <Meta>Development</Meta>
          <div className="grid grid-cols-3 gap-4">
            <StatCard value={String(analytics.development.skillEntries)} label="Skill entries" />
            <StatCard
              value={String(analytics.development.skillPrioritiesCompleted)}
              label="Skill goals done"
            />
            <StatCard
              value={String(analytics.development.skillPrioritiesTotal)}
              label="Skill goals set"
            />
          </div>

          <section className="border border-border bg-background p-5 shadow-card">
            <Meta>Trends by month</Meta>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 font-medium">Updates</th>
                    <th className="pb-2 font-medium">Plans</th>
                    <th className="pb-2 font-medium">Done</th>
                    <th className="pb-2 font-medium">Carried</th>
                    <th className="pb-2 font-medium">Blocked</th>
                    <th className="pb-2 font-medium">Unplanned</th>
                    <th className="pb-2 font-medium">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.trends.map((row) => (
                    <tr key={row.month} className="border-t border-border">
                      <td className="py-2">{row.month}</td>
                      <td className="py-2">{row.compliancePct}%</td>
                      <td className="py-2">{row.weeksWithPlanPct}%</td>
                      <td className="py-2">{row.completed}</td>
                      <td className="py-2">{row.carriedForward}</td>
                      <td className="py-2">{row.blocked}</td>
                      <td className="py-2">{row.unplannedSharePct}%</td>
                      <td className="py-2">
                        {row.skillPrioritiesCompleted}/{row.skillPrioritiesTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {teamMode ? (
            <section className="space-y-3">
              <Meta>Needs attention · {analytics.attentionMonth}</Meta>
              <p className="text-sm text-muted">
                Labels from fixed rules (missing updates, no plan, blockers, heavy carry). Alphabetical —
                not a ranking.
              </p>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: 'Employee',
                    cell: (row) =>
                      employeeBasePath ? (
                        <Link href={`${employeeBasePath}/${row.id}?tab=work`} className="hover:underline">
                          {row.employeeName}
                        </Link>
                      ) : (
                        row.employeeName
                      ),
                  },
                  { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
                  {
                    id: 'labels',
                    header: 'Labels',
                    cell: (row) => (
                      <ul className="space-y-1">
                        {row.labels.map((label) => (
                          <li key={label.code}>
                            <span className="font-medium">{label.label}</span>
                            <span className="text-muted"> — {label.detail}</span>
                          </li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
                rows={analytics.needsAttention.map((row) => ({
                  id: row.employeeId,
                  employeeName: row.employeeName,
                  departmentName: row.departmentName,
                  labels: row.labels,
                }))}
                emptyTitle="Nothing flagged"
                emptyDescription="No attention labels for this month’s rules."
              />
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
