'use client';

import Link from 'next/link';
import { PageLoading } from '@/components/ui/page-loading';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
import type { WorkBoard } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

type TodayFilter = 'expected' | 'MISSING' | 'COMPLETED' | 'ON_LEAVE' | 'blockers' | null;

type PersonRow = WorkBoard['people'][number];

function TeamWeekBoard({
  employeeBasePath,
  employeeHref,
}: {
  employeeBasePath?: string;
  employeeHref?: (employeeId: string) => string;
}) {
  const searchParams = useSearchParams();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState(() => searchParams.get('employeeId') ?? '');
  const [todayFilter, setTodayFilter] = useState<TodayFilter>(() => {
    const today = searchParams.get('today');
    if (today === 'pending') return 'MISSING';
    if (today === 'submitted') return 'COMPLETED';
    if (today === 'leave') return 'ON_LEAVE';
    if (today === 'expected') return 'expected';
    if (today === 'blockers') return 'blockers';
    return null;
  });

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

  const blockerEmployeeIds = useMemo(
    () => new Set((board?.openBlockers ?? []).map((item) => item.employeeId)),
    [board?.openBlockers],
  );

  const peopleRows = useMemo(() => {
    const people = board?.people ?? [];
    if (!todayFilter) return people;
    if (todayFilter === 'expected') {
      return people.filter((row) => row.todayStatus === 'MISSING' || row.todayStatus === 'COMPLETED');
    }
    if (todayFilter === 'blockers') {
      return people.filter((row) => blockerEmployeeIds.has(row.id));
    }
    return people.filter((row) => row.todayStatus === todayFilter);
  }, [board?.people, todayFilter, blockerEmployeeIds]);

  function hrefFor(id: string): string | null {
    if (employeeHref) return employeeHref(id);
    if (employeeBasePath) return `${employeeBasePath}/${id}?tab=work`;
    return null;
  }

  function toggleTodayFilter(next: Exclude<TodayFilter, null>) {
    setTodayFilter((prev) => (prev === next ? null : next));
  }

  const filterHint =
    todayFilter === 'MISSING'
      ? 'Showing people with a pending daily update.'
      : todayFilter === 'COMPLETED'
        ? 'Showing people who submitted today’s update.'
        : todayFilter === 'ON_LEAVE'
          ? 'Showing people on leave today.'
          : todayFilter === 'expected'
            ? 'Showing people expected to update today.'
            : todayFilter === 'blockers'
              ? 'Showing people with an open blocker.'
              : null;

  return (
    <>
      <PageHeader kicker="Work" title="Team week" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Who was expected to update today, priority approval, weekly PPT status, and who still has a pending update.
        Open a name for that person’s week. Tap a KPI to filter the table.
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

      {isLoading ? <PageLoading compact message="Loading the board…" /> : null}
      {board ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              compact
              value={String(board.today.expected)}
              label="Expected today"
              active={todayFilter === 'expected'}
              onClick={() => toggleTodayFilter('expected')}
            />
            <StatCard
              compact
              value={String(board.today.submitted)}
              label="Submitted"
              active={todayFilter === 'COMPLETED'}
              onClick={() => toggleTodayFilter('COMPLETED')}
            />
            <StatCard
              compact
              value={String(board.today.missing)}
              label="Pending"
              active={todayFilter === 'MISSING'}
              onClick={() => toggleTodayFilter('MISSING')}
            />
            <StatCard
              compact
              value={String(board.today.onLeave)}
              label="On leave"
              active={todayFilter === 'ON_LEAVE'}
              onClick={() => toggleTodayFilter('ON_LEAVE')}
            />
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard compact value={`${board.weekCompletionPct}%`} label="Week completion" />
            <StatCard compact value={String(board.unplannedVolume)} label="Unplanned items" />
            <StatCard
              compact
              value={String(board.openBlockers.length)}
              label="Open blockers"
              active={todayFilter === 'blockers'}
              onClick={
                board.openBlockers.length > 0 ? () => toggleTodayFilter('blockers') : undefined
              }
            />
          </div>
          {filterHint ? (
            <p className="mb-4 text-sm text-muted">
              {filterHint}{' '}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-foreground"
                onClick={() => setTodayFilter(null)}
              >
                Clear filter
              </button>
            </p>
          ) : null}
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
                cell: (row: PersonRow) => {
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
              { id: 'dept', header: 'Department', cell: (row: PersonRow) => row.departmentName ?? '—' },
              { id: 'today', header: 'Today', cell: (row: PersonRow) => row.todayLabel },
              { id: 'approval', header: 'Priorities', cell: (row: PersonRow) => row.approvalLabel },
              { id: 'ppt', header: 'Weekly PPT', cell: (row: PersonRow) => row.pptLabel },
              {
                id: 'week',
                header: 'Week done',
                cell: (row: PersonRow) => `${row.weekCompletionPct}%`,
              },
            ]}
            rows={peopleRows}
            emptyTitle={todayFilter ? 'No people match this filter' : 'No people in the work loop'}
            emptyDescription={
              todayFilter
                ? 'Clear the KPI filter or try another day or department.'
                : 'SA, HR, GM, and Finance are excluded. Try another department or date.'
            }
          />
        </>
      ) : null}
    </>
  );
}

export function AdminTeamWeek({
  employeeBasePath,
  employeeHref,
}: {
  employeeBasePath?: string;
  /** Prefer over employeeBasePath when linking into CSO priorities or similar. */
  employeeHref?: (employeeId: string) => string;
}) {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <TeamWeekBoard employeeBasePath={employeeBasePath} employeeHref={employeeHref} />
    </Suspense>
  );
}
