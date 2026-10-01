'use client';

import { useEffect, useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useGetMonthlyWorkReportMonthsQuery,
  useGetMonthlyWorkReportPeopleQuery,
  useGetMonthlyWorkReportQuery,
} from '@/store/api/api';
import type { MonthlyWorkReportDetail, MonthlyWorkReportMonthRow } from '@/types/api';

function ratio(done: number, total: number): string {
  if (total <= 0) return '—';
  return `${done}/${total}`;
}

function timingLabel(timing: 'on_time' | 'last_hour' | 'late' | null): string {
  if (timing === 'late') return 'Late';
  if (timing === 'last_hour') return 'Last hour';
  if (timing === 'on_time') return 'On time';
  return '—';
}

function weekLabel(weekStart: string, weekEnd: string): string {
  return `${weekStart.slice(5)} → ${weekEnd.slice(5)}`;
}

function SummaryStrip({ detail }: { detail: MonthlyWorkReportDetail }) {
  const items = [
    { label: 'Weekly PPT', value: `${detail.ppt.uploaded}/${detail.ppt.expected}`, hint: `${detail.summary.pptPct}%` },
    {
      label: 'Priorities set',
      value: `${detail.weeks.filter((w) => w.prioritiesUpdated).length}/${detail.weeks.length}`,
      hint: `${detail.summary.prioritiesSetPct}%`,
    },
    {
      label: 'Priorities approved',
      value: `${detail.weeks.filter((w) => w.prioritiesApproved).length}/${detail.weeks.length}`,
      hint: `${detail.summary.prioritiesApprovedPct}%`,
    },
    {
      label: 'Daily updates',
      value: ratio(
        detail.weeks.reduce((sum, w) => sum + w.dailySubmitted, 0),
        detail.weeks.reduce((sum, w) => sum + w.dailyRequired, 0),
      ),
      hint: `${detail.summary.dailyPct}%`,
    },
    { label: 'JC uploads', value: String(detail.jc.count), hint: detail.jc.count > 0 ? 'This month' : 'None' },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="border-b border-border pb-3">
          <Meta>{item.label}</Meta>
          <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{item.value}</p>
          <p className="text-xs text-muted">{item.hint}</p>
        </div>
      ))}
    </div>
  );
}

function MonthDetail({ detail }: { detail: MonthlyWorkReportDetail }) {
  return (
    <div className="space-y-8 border-t border-border pt-6">
      <div>
        <Meta className="mb-2">{detail.period}</Meta>
        <h2 className="text-xl font-semibold text-foreground">{detail.employee.fullName}</h2>
        <p className="mt-1 text-sm text-muted">
          {[detail.employee.employeeCode, detail.employee.departmentName].filter(Boolean).join(' · ') || 'Work loop'}
        </p>
      </div>

      <SummaryStrip detail={detail} />

      <section className="space-y-3">
        <Meta>Projects</Meta>
        {detail.projects.length === 0 ? (
          <p className="text-sm text-muted">No active project membership.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.projects.map((project) => (
              <li key={project.projectId} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">
                  {project.name}
                  <span className="ml-2 text-muted">{project.code}</span>
                </span>
                <span className="text-muted">
                  Lead: {project.leadName ?? '—'}
                  {project.isLead ? ' (self)' : ''}
                </span>
                <span className="text-muted">
                  Milestone:{' '}
                  {project.activeMilestone
                    ? `${project.activeMilestone.name}${project.activeMilestone.targetDate ? ` · ${project.activeMilestone.targetDate}` : ''}`
                    : 'None active'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <Meta>Weekly PPT</Meta>
        <DataTable
          columns={[
            { id: 'week', header: 'Week', cell: (row) => weekLabel(row.weekStart, row.weekEnd) },
            { id: 'uploaded', header: 'Uploaded', cell: (row) => (row.uploaded ? 'Yes' : 'No') },
            { id: 'timing', header: 'Timing', cell: (row) => timingLabel(row.timing) },
          ]}
          rows={detail.ppt.weeks.map((row) => ({ ...row, id: row.weekStart }))}
          emptyTitle="No weeks"
          emptyDescription=""
        />
      </section>

      <section className="space-y-3">
        <Meta>JC</Meta>
        {detail.jc.count === 0 ? (
          <p className="text-sm text-muted">No JC upload in this month.</p>
        ) : (
          <DataTable
            columns={[
              { id: 'when', header: 'Uploaded', cell: (row) => row.uploadedAt.slice(0, 10) },
              { id: 'status', header: 'Status', cell: (row) => row.status },
            ]}
            rows={detail.jc.uploads.map((row) => ({ ...row, id: row.id }))}
            emptyTitle="No JC"
            emptyDescription=""
          />
        )}
      </section>

      <section className="space-y-3">
        <Meta>Priorities &amp; daily</Meta>
        <DataTable
          columns={[
            { id: 'week', header: 'Week', cell: (row) => weekLabel(row.weekStart, row.weekEnd) },
            {
              id: 'priorities',
              header: 'Priorities',
              cell: (row) =>
                row.prioritiesUpdated
                  ? `${row.approvedCount}/${row.priorityCount} approved`
                  : row.expectsPrioritiesForMilestone
                    ? 'Missing'
                    : 'None',
            },
            {
              id: 'milestone',
              header: 'Milestone link',
              cell: (row) => (row.milestoneLinked ? 'Yes' : row.expectsPrioritiesForMilestone ? 'Needed' : '—'),
            },
            {
              id: 'daily',
              header: 'Daily',
              cell: (row) =>
                row.prioritiesApproved
                  ? `${ratio(row.dailySubmitted, row.dailyRequired)}${row.dailyOk ? '' : ' · gaps'}`
                  : '—',
            },
          ]}
          rows={detail.weeks.map((row) => ({ ...row, id: row.weekStart }))}
          emptyTitle="No weeks"
          emptyDescription=""
        />
      </section>

      {detail.weeks.some((week) => week.priorities.length > 0) ? (
        <section className="space-y-3">
          <Meta>Priority titles</Meta>
          <ul className="space-y-2 text-sm">
            {detail.weeks.flatMap((week) =>
              week.priorities.map((priority) => (
                <li key={priority.id} className="flex flex-wrap gap-x-3 gap-y-1">
                  <span className="text-muted">{week.weekStart.slice(5)}</span>
                  <span className="font-medium text-foreground">{priority.title}</span>
                  <span className="text-muted">
                    {priority.type} · {priority.approvalStatus}
                  </span>
                </li>
              )),
            )}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function MonthlyWorkReportPage() {
  const peopleQuery = useGetMonthlyWorkReportPeopleQuery();
  const employees = peopleQuery.data?.data.employees ?? [];
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(employees[0].employeeId);
    }
  }, [employeeId, employees]);

  useEffect(() => {
    setOpenPeriod(null);
  }, [employeeId]);

  const monthsQuery = useGetMonthlyWorkReportMonthsQuery(
    { employeeId: employeeId ?? '' },
    { skip: !employeeId },
  );
  const detailQuery = useGetMonthlyWorkReportQuery(
    { employeeId: employeeId ?? '', month: openPeriod ?? '' },
    { skip: !employeeId || !openPeriod },
  );

  const selected = useMemo(
    () => employees.find((row) => row.employeeId === employeeId) ?? null,
    [employees, employeeId],
  );

  const monthRows = monthsQuery.data?.data.months ?? [];

  return (
    <>
      <PageHeader kicker="People" title="Monthly report" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Select an employee, open a month, and review weekly PPT, JC, milestones, priorities, and daily updates — enough
        to judge contribution without a long scroll.
      </p>

      {peopleQuery.isLoading ? <PageLoading compact message="Loading people…" /> : null}
      {peopleQuery.isError ? (
        <StatusMessage tone="danger">{apiErrorMessage(peopleQuery.error, 'Unable to load employees.')}</StatusMessage>
      ) : null}

      {employees.length > 0 ? (
        <div className="mb-8 flex flex-wrap gap-2">
          {employees.map((person) => {
            const active = person.employeeId === employeeId;
            return (
              <button
                key={person.employeeId}
                type="button"
                onClick={() => setEmployeeId(person.employeeId)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'border-emerald-500/70 bg-emerald-500/15 text-foreground'
                    : 'border-border bg-background text-foreground hover:bg-surface',
                )}
              >
                {person.fullName}
              </button>
            );
          })}
        </div>
      ) : null}

      {!peopleQuery.isLoading && employees.length === 0 ? (
        <p className="text-sm text-muted">No work-loop employees to report on.</p>
      ) : null}

      {employeeId && selected ? (
        <div className="space-y-6">
          <div>
            <Meta className="mb-1">Selected</Meta>
            <p className="text-sm text-foreground">
              {selected.fullName}
              {selected.departmentName ? ` · ${selected.departmentName}` : ''}
            </p>
          </div>

          {monthsQuery.isLoading ? <PageLoading compact message="Loading months…" /> : null}
          {monthsQuery.isError ? (
            <StatusMessage tone="danger">{apiErrorMessage(monthsQuery.error, 'Unable to load months.')}</StatusMessage>
          ) : null}

          {!monthsQuery.isLoading && !monthsQuery.isError ? (
            <DataTable
              columns={[
                { id: 'period', header: 'Month', cell: (row: MonthlyWorkReportMonthRow) => row.period },
                {
                  id: 'ppt',
                  header: 'PPT',
                  cell: (row) => ratio(row.pptUploaded, row.pptExpected),
                },
                {
                  id: 'priorities',
                  header: 'Priorities',
                  cell: (row) => `${row.weeksWithApproved}/${row.weeksWithPriorities} · ${row.weeksTotal}w`,
                },
                {
                  id: 'daily',
                  header: 'Daily',
                  cell: (row) => ratio(row.dailySubmitted, row.dailyRequired),
                },
                { id: 'jc', header: 'JC', cell: (row) => String(row.jcUploads) },
                {
                  id: 'projects',
                  header: 'Projects',
                  cell: (row) => (row.projects.length > 0 ? row.projects.join(', ') : '—'),
                },
                {
                  id: 'open',
                  header: '',
                  cell: (row) => (
                    <Button
                      type="button"
                      variant={openPeriod === row.period ? 'primary' : 'outline'}
                      onClick={() => setOpenPeriod((current) => (current === row.period ? null : row.period))}
                    >
                      {openPeriod === row.period ? 'Close' : 'Open'}
                    </Button>
                  ),
                },
              ]}
              rows={monthRows.map((row) => ({ ...row, id: row.period }))}
              emptyTitle="No months"
              emptyDescription="Month history appears after work activity exists."
            />
          ) : null}

          {openPeriod ? (
            detailQuery.isLoading ? (
              <PageLoading compact message="Loading month…" />
            ) : detailQuery.isError ? (
              <StatusMessage tone="danger">
                {apiErrorMessage(detailQuery.error, 'Unable to load this month.')}
              </StatusMessage>
            ) : detailQuery.data?.data ? (
              <MonthDetail detail={detailQuery.data.data} />
            ) : null
          ) : (
            <p className="text-sm text-muted">Open a month to see the consolidated report.</p>
          )}
        </div>
      ) : null}
    </>
  );
}
