'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
  useGetWorkBoardQuery,
} from '@/store/api/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

export function AdminTeamWeek({
  employeeBasePath,
  employeeHref,
}: {
  employeeBasePath?: string;
  /** Prefer over employeeBasePath when linking into CSO priorities or similar. */
  employeeHref?: (employeeId: string) => string;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const filters = useMemo(
    () => ({
      date,
      ...(departmentId ? { departmentId } : {}),
      ...(employeeId ? { employeeId } : {}),
    }),
    [date, departmentId, employeeId],
  );

  const { data, isLoading } = useGetWorkBoardQuery(filters);
  const { data: departments } = useGetDepartmentsQuery();
  const { data: employees } = useGetEmployeesQuery();
  const board = data?.data;

  function hrefFor(id: string): string | null {
    if (employeeHref) return employeeHref(id);
    if (employeeBasePath) return `${employeeBasePath}/${id}?tab=work`;
    return null;
  }

  return (
    <>
      <PageHeader kicker="Work" title="Team week" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Who was expected to update today, priority approval, weekly PPT status, and who is still missing. Open a
        name for that person’s week.
      </p>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="work-date">Day</Label>
          <Input id="work-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="work-dept">Department</Label>
          <select
            id="work-dept"
            className={selectClass}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
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
          <Label htmlFor="work-emp">Employee</Label>
          <select
            id="work-emp"
            className={selectClass}
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">All</option>
            {(employees?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? <p className="mb-6 text-sm text-muted">Loading the board…</p> : null}
      {board ? (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard value={String(board.today.expected)} label="Expected today" />
            <StatCard value={String(board.today.submitted)} label="Submitted" />
            <StatCard value={String(board.today.missing)} label="Missing" />
            <StatCard value={String(board.today.onLeave)} label="On leave" />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard value={`${board.weekCompletionPct}%`} label="Week completion" />
            <StatCard value={String(board.unplannedVolume)} label="Unplanned items" />
            <StatCard value={String(board.openBlockers.length)} label="Open blockers" />
          </div>
          {board.openBlockers.length > 0 ? (
            <section className="mb-8 border border-border bg-background p-5 shadow-card">
              <Meta>Open blockers</Meta>
              <ul className="mt-3 space-y-2 text-sm">
                {board.openBlockers.map((item) => {
                  const href = hrefFor(item.employeeId);
                  return (
                    <li key={item.id}>
                      {href ? (
                        <Link href={href} className="hover:underline">
                          {item.employeeName}
                        </Link>
                      ) : (
                        <span>{item.employeeName}</span>
                      )}
                      {' · '}
                      {item.description}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
          <DataTable
            columns={[
              {
                id: 'name',
                header: 'Employee',
                cell: (row) => {
                  const href = hrefFor(row.id);
                  return href ? (
                    <Link href={href} className="hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  );
                },
              },
              { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
              { id: 'today', header: 'Today', cell: (row) => row.todayLabel },
              { id: 'approval', header: 'Priorities', cell: (row) => row.approvalLabel },
              { id: 'ppt', header: 'Weekly PPT', cell: (row) => row.pptLabel },
              { id: 'week', header: 'Week done', cell: (row) => `${row.weekCompletionPct}%` },
            ]}
            rows={board.people}
            emptyTitle="No people in the work loop"
            emptyDescription="SA, HR, GM, and Finance are excluded. Try another department or date."
          />
        </>
      ) : null}
    </>
  );
}
