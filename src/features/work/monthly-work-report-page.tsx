'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/page-loading';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useGetMonthlyWorkReportPeopleQuery,
  useGetMonthlyWorkReportPeriodsQuery,
  useGetMonthlyWorkReportQuery,
} from '@/store/api/api';
import type { MonthlyWorkReportDetail } from '@/types/api';

function timingLabel(timing: 'on_time' | 'last_hour' | 'late' | null): string {
  if (timing === 'late') return 'late';
  if (timing === 'last_hour') return 'last hour';
  if (timing === 'on_time') return 'on time';
  return 'missing';
}

function weekRange(weekStart: string, weekEnd: string): string {
  return `${weekStart.slice(5)}–${weekEnd.slice(5)}`;
}

function ratio(done: number, total: number): string {
  if (total <= 0) return '—';
  return `${done}/${total}`;
}

/** Index: pick a month to open. */
export function MonthlyWorkReportIndex({ baseHref }: { baseHref: string }) {
  const periodsQuery = useGetMonthlyWorkReportPeriodsQuery({ months: 12 });
  const months = periodsQuery.data?.data.months ?? [];

  return (
    <>
      <PageHeader kicker="People" title="Monthly report" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Open a month, then choose an employee to review weekly PPT, projects, and — when a milestone is active —
        priorities and daily updates.
      </p>

      {periodsQuery.isLoading ? <PageLoading compact message="Loading months…" /> : null}
      {periodsQuery.isError ? (
        <StatusMessage tone="danger">{apiErrorMessage(periodsQuery.error, 'Unable to load months.')}</StatusMessage>
      ) : null}

      {!periodsQuery.isLoading && !periodsQuery.isError ? (
        <DataTable
          columns={[
            { id: 'month', header: 'Month', cell: (row) => row.label },
            { id: 'period', header: 'Period', cell: (row) => row.period },
            { id: 'weeks', header: 'Weeks', cell: (row) => String(row.weekCount) },
            {
              id: 'open',
              header: '',
              cell: (row) => (
                <Link href={`${baseHref}/${row.period}`} className="text-sm text-muted hover:text-foreground">
                  Open
                </Link>
              ),
            },
          ]}
          rows={months.map((row) => ({ ...row, id: row.period }))}
          emptyTitle="No months"
          emptyDescription="Months appear once the portal calendar is available."
        />
      ) : null}
    </>
  );
}

function EmployeeReport({ detail }: { detail: MonthlyWorkReportDetail }) {
  const showMilestoneWork = detail.summary.hasActiveMilestone;
  const showJc = detail.jc.count > 0;
  const missingPpt = detail.ppt.weeks.filter((week) => !week.uploaded);
  const uploadedPpt = detail.ppt.weeks.filter((week) => week.uploaded);
  const redFlags = detail.pptRedFlags ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{detail.employee.fullName}</h2>
        <p className="mt-1 text-sm text-muted">
          {[detail.employee.employeeCode, detail.employee.departmentName].filter(Boolean).join(' · ') || 'Work loop'}
        </p>
      </div>

      {redFlags.length > 0 ? (
        <section className="space-y-2 border border-red-500/40 bg-red-500/5 p-4">
          <Meta>RED FLAG — late PPT concerns</Meta>
          <p className="text-sm text-foreground">
            {redFlags.length} pending or rejected late-upload concern
            {redFlags.length === 1 ? '' : 's'} — consider during month-end salary and attendance.
          </p>
          <ul className="space-y-2 text-sm">
            {redFlags.map((flag) => (
              <li key={flag.id}>
                <span className="font-medium text-red-700 dark:text-red-400">
                  {flag.status === 'rejected' ? 'Rejected' : 'Pending'} ·{' '}
                  {flag.kind === 'jc' ? 'JC' : 'Weekly'} PPT
                </span>
                <span className="text-muted">
                  {' '}
                  · {weekRange(flag.weekStart, flag.weekEnd)}
                </span>
                <span className="mt-0.5 block text-muted">{flag.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-2">
        <Meta>Projects</Meta>
        {detail.projects.length === 0 ? (
          <p className="text-sm text-muted">No active project.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.projects.map((project) => (
              <li key={project.projectId}>
                <span className="font-medium text-foreground">{project.name}</span>
                <span className="text-muted"> · {project.code}</span>
                <span className="mt-0.5 block text-muted">
                  Lead {project.leadName ?? '—'}
                  {project.isLead ? ' (self)' : ''}
                  {' · '}
                  {project.activeMilestone
                    ? `Active milestone: ${project.activeMilestone.name}`
                    : 'No active milestone'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <Meta>Weekly PPT</Meta>
        <p className="text-sm text-foreground">
          {detail.ppt.uploaded} of {detail.ppt.expected} weeks uploaded
          {detail.ppt.expected > 0 ? ` (${detail.ppt.pct}%)` : ''}
        </p>
        {uploadedPpt.length > 0 ? (
          <p className="text-sm text-muted">
            Uploaded:{' '}
            {uploadedPpt
              .map((week) => `${weekRange(week.weekStart, week.weekEnd)} (${timingLabel(week.timing)})`)
              .join('; ')}
          </p>
        ) : null}
        {missingPpt.length > 0 ? (
          <p className="text-sm text-muted">
            Missing: {missingPpt.map((week) => weekRange(week.weekStart, week.weekEnd)).join(', ')}
          </p>
        ) : (
          <p className="text-sm text-muted">All weeks covered.</p>
        )}
      </section>

      {showJc ? (
        <section className="space-y-2">
          <Meta>JC</Meta>
          <ul className="space-y-2 text-sm">
            {detail.jc.uploads.map((upload) => (
              <li key={upload.id} className="text-foreground">
                <span>
                  {upload.uploadedAt.slice(0, 10)}
                  <span className="text-muted"> · {upload.status}</span>
                  {upload.late || upload.timing === 'late' ? (
                    <span className="text-muted"> · late</span>
                  ) : null}
                </span>
                {upload.paperTitle ? (
                  <span className="mt-0.5 block text-muted">
                    {upload.paperTitle}
                    {upload.doiUrl ? (
                      <>
                        {' · '}
                        <a
                          href={upload.doiUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-foreground"
                        >
                          DOI / link
                        </a>
                      </>
                    ) : null}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showMilestoneWork ? (
        <section className="space-y-3">
          <Meta>Priorities &amp; daily</Meta>
          <p className="text-sm text-muted">Shown because this person has an active project milestone.</p>
          <ul className="space-y-3 text-sm">
            {detail.weeks.map((week) => {
              const daily =
                week.prioritiesApproved && week.dailyRequired > 0
                  ? ` · daily ${ratio(week.dailySubmitted, week.dailyRequired)}${week.dailyOk ? '' : ' (gaps)'}`
                  : week.prioritiesApproved
                    ? ' · daily not required'
                    : '';
              return (
                <li key={week.weekStart} className="border-b border-border pb-3">
                  <p className="font-medium text-foreground">{weekRange(week.weekStart, week.weekEnd)}</p>
                  <p className="mt-1 text-muted">
                    {week.prioritiesUpdated
                      ? `${week.approvedCount}/${week.priorityCount} priorities approved`
                      : 'No priorities set'}
                    {week.milestoneLinked ? ' · linked to milestone' : ''}
                    {daily}
                  </p>
                  {week.priorities.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {week.priorities.map((priority) => (
                        <li key={priority.id}>
                          <span className="text-foreground">{priority.title}</span>
                          <span className="text-muted">
                            {' '}
                            · {priority.type} · {priority.approvalStatus}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="space-y-2">
          <Meta>Priorities &amp; daily</Meta>
          <p className="text-sm text-muted">
            Hidden — no active milestone on this person’s projects, so weekly priorities are not expected.
          </p>
        </section>
      )}
    </div>
  );
}

/** Month page: pick an employee, then see that person’s consolidated report. */
export function MonthlyWorkReportMonthPage({
  baseHref,
  period,
}: {
  baseHref: string;
  period: string;
}) {
  const peopleQuery = useGetMonthlyWorkReportPeopleQuery();
  const employees = peopleQuery.data?.data.employees ?? [];
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const detailQuery = useGetMonthlyWorkReportQuery(
    { employeeId: employeeId ?? '', month: period },
    { skip: !employeeId },
  );

  const label = (() => {
    if (!/^\d{4}-\d{2}$/.test(period)) return period;
    const [year, mon] = period.split('-').map(Number);
    return new Date(Date.UTC(year, mon - 1, 1)).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  })();

  return (
    <>
      <PageHeader kicker="Monthly report" title={label} />
      <p className="mb-6">
        <Link href={baseHref} className="text-sm text-muted hover:text-foreground">
          Back to months
        </Link>
      </p>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Choose an employee to open their consolidated report for this month.
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

      {!employeeId ? (
        <p className="text-sm text-muted">Select an employee to view the report.</p>
      ) : detailQuery.isLoading ? (
        <PageLoading compact message="Loading report…" />
      ) : detailQuery.isError ? (
        <StatusMessage tone="danger">{apiErrorMessage(detailQuery.error, 'Unable to load this report.')}</StatusMessage>
      ) : detailQuery.data?.data ? (
        <EmployeeReport detail={detailQuery.data.data} />
      ) : null}

      {employeeId ? (
        <div className="mt-8">
          <Button type="button" variant="outline" onClick={() => setEmployeeId(null)}>
            Clear selection
          </Button>
        </div>
      ) : null}
    </>
  );
}
