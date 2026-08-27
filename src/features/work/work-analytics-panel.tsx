'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
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
import type { WorkAttentionLabel } from '@/types/api';

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
  employeeHref,
  fixedEmployeeId,
}: {
  employeeBasePath?: string;
  /** Prefer over employeeBasePath when linking into CSO priorities / team week. */
  employeeHref?: (employeeId: string, labels: WorkAttentionLabel[]) => string;
  fixedEmployeeId?: string;
}) {
  const teamMode = !fixedEmployeeId;
  const [from, setFrom] = useState(() => monthsAgo(6));
  const [to, setTo] = useState(() => monthNow());
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showMonthTable, setShowMonthTable] = useState(teamMode);

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

  function hrefFor(employeeId: string, labels: WorkAttentionLabel[]): string | null {
    if (employeeHref) return employeeHref(employeeId, labels);
    if (employeeBasePath) return `${employeeBasePath}/${employeeId}?tab=work`;
    return null;
  }

  return (
    <section className="space-y-6">
      {teamMode ? (
        <p className="max-w-2xl text-sm text-muted">
          Filters apply to the whole team. Unplanned share is context, not a penalty. Leave and holidays are excluded
          from update compliance.
        </p>
      ) : (
        <p className="max-w-2xl text-sm text-muted">
          Indicators for context, not a score. Unplanned work is context, not a penalty. Leave and holidays are excluded
          from update compliance.
        </p>
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

      {isLoading ? <PageLoading compact message="Loading insights…" /> : null}
      {!analytics ? null : (
        <>
          {teamMode ? <p className="text-sm text-muted">{analytics.note}</p> : null}

          {teamMode ? (
            <>
              <Meta>Reliability</Meta>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard compact value={`${analytics.reliability.compliancePct}%`} label="Update compliance" />
                <StatCard compact value={`${analytics.reliability.weeksWithPlanPct}%`} label="Weeks with a plan" />
                <StatCard
                  compact
                  value={`${analytics.reliability.submittedDays}/${analytics.reliability.requiredDays}`}
                  label="Days submitted"
                />
                <StatCard
                  compact
                  value={`${analytics.reliability.weeksWithPlan}/${analytics.reliability.weeksTotal}`}
                  label="Planned weeks"
                />
              </div>

              <Meta>Execution</Meta>
              <div className="grid grid-cols-3 gap-3">
                <StatCard compact value={String(analytics.execution.completed)} label="Completed" />
                <StatCard compact value={String(analytics.execution.carriedForward)} label="Carried forward" />
                <StatCard compact value={String(analytics.execution.blocked)} label="Blocked" />
              </div>

              <Meta>Adaptability</Meta>
              <div className="grid grid-cols-3 gap-3">
                <StatCard compact value={`${analytics.adaptability.unplannedSharePct}%`} label="Unplanned share" />
                <StatCard compact value={String(analytics.adaptability.plannedEntries)} label="Planned entries" />
                <StatCard compact value={String(analytics.adaptability.unplannedEntries)} label="Unplanned entries" />
              </div>

              <Meta>Development</Meta>
              <div className="grid grid-cols-3 gap-3">
                <StatCard compact value={String(analytics.development.skillEntries)} label="Skill entries" />
                <StatCard
                  compact
                  value={String(analytics.development.skillPrioritiesCompleted)}
                  label="Skill goals done"
                />
                <StatCard
                  compact
                  value={String(analytics.development.skillPrioritiesTotal)}
                  label="Skill goals set"
                />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard compact value={`${analytics.reliability.compliancePct}%`} label="Update compliance" />
              <StatCard compact value={`${analytics.reliability.weeksWithPlanPct}%`} label="Weeks with a plan" />
              <StatCard
                compact
                value={`${analytics.reliability.submittedDays}/${analytics.reliability.requiredDays}`}
                label="Days submitted"
              />
              <StatCard compact value={String(analytics.execution.completed)} label="Completed priorities" />
              <StatCard compact value={String(analytics.execution.carriedForward)} label="Carried forward" />
              <StatCard compact value={String(analytics.execution.blocked)} label="Blocked" />
              <StatCard compact value={`${analytics.adaptability.unplannedSharePct}%`} label="Unplanned share" />
              <StatCard
                compact
                value={`${analytics.development.skillPrioritiesCompleted}/${analytics.development.skillPrioritiesTotal}`}
                label="Skill goals done"
              />
            </div>
          )}

          <section className="border border-border bg-background p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Meta>Trends by month</Meta>
              {!teamMode ? (
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.16em] text-muted hover:text-foreground"
                  onClick={() => setShowMonthTable((open) => !open)}
                  aria-expanded={showMonthTable}
                >
                  {showMonthTable ? 'Hide table' : 'Show table'}
                </button>
              ) : null}
            </div>
            {showMonthTable ? (
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
            ) : (
              <p className="mt-3 text-sm text-muted">Open the table when you need month-by-month detail.</p>
            )}
          </section>

          {teamMode ? (
            <section className="space-y-3">
              <Meta>Needs attention · {analytics.attentionMonth}</Meta>
              <p className="text-sm text-muted">
                Labels from fixed rules (missing updates, no plan, blockers, heavy carry). Alphabetical — not a
                ranking. Open a name to jump to Team week or Priorities.
              </p>
              <DataTable
                columns={[
                  {
                    id: 'name',
                    header: 'Employee',
                    cell: (row) => {
                      const href = hrefFor(row.id, row.labels);
                      return href ? (
                        <Link href={href} className="hover:underline">
                          {row.employeeName}
                        </Link>
                      ) : (
                        row.employeeName
                      );
                    },
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
