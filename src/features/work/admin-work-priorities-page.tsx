'use client';

import { PageLoading } from '@/components/ui/page-loading';
import { Suspense, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MyWeekBoard } from '@/features/work/my-week-board';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import {
  useApproveAllWorkPrioritiesMutation,
  useGetDepartmentsQuery,
  useGetEmployeesQuery,
  useGetWorkPrioritiesApprovedQuery,
  useGetWorkPrioritiesQueueQuery,
  useGetWorkWeekQuery,
} from '@/store/api/api';
import type { WorkPrioritiesApprovedItem, WorkPrioritiesQueueItem } from '@/types/api';

const selectClass =
  'h-10 w-full rounded border border-border bg-background px-3 text-sm text-foreground shadow-card outline-none focus:border-foreground';

type QueueRow = WorkPrioritiesQueueItem & { id: string };
type ApprovedRow = WorkPrioritiesApprovedItem & { id: string };

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function filterByDesk<T extends { departmentId: string | null; employeeId: string }>(
  items: T[],
  departmentId: string,
  employeeId: string,
): T[] {
  let next = items;
  if (departmentId) next = next.filter((row) => row.departmentId === departmentId);
  if (employeeId) next = next.filter((row) => row.employeeId === employeeId);
  return next;
}

function PrioritiesDesk({ canApprove }: { canApprove: boolean }) {
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('employeeId') ?? '';
  const [weekDate, setWeekDate] = useState(todayIso);
  const [departmentId, setDepartmentId] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  const weekArg = { date: weekDate };
  const { data: queueData, isLoading: queueLoading } = useGetWorkPrioritiesQueueQuery(weekArg);
  const { data: approvedData, isLoading: approvedLoading } = useGetWorkPrioritiesApprovedQuery(weekArg);
  const queue = queueData?.data;
  const approved = approvedData?.data;
  const week = approved?.week ?? queue?.week ?? null;

  const [approveAll, approveAllState] = useApproveAllWorkPrioritiesMutation();
  const { data: weekData } = useGetWorkWeekQuery(
    selectedId ? { employeeId: selectedId, date: weekDate } : undefined,
    { skip: !selectedId || !canApprove },
  );
  const { data: departments } = useGetDepartmentsQuery();
  const { data: employeeData } = useGetEmployeesQuery();

  const queueRows = useMemo(
    () =>
      filterByDesk(
        (queue?.items ?? []).map((item) => ({ ...item, id: item.employeeId })),
        departmentId,
        employeeId,
      ),
    [queue?.items, departmentId, employeeId],
  );

  const approvedRows = useMemo(
    () =>
      filterByDesk(
        (approved?.items ?? []).map((item) => ({ ...item, id: item.employeeId })),
        departmentId,
        employeeId,
      ),
    [approved?.items, departmentId, employeeId],
  );

  const selectedFromQueue = useMemo(
    () => (queue?.items ?? []).find((item) => item.employeeId === selectedId) ?? null,
    [queue?.items, selectedId],
  );
  const selectedFromApproved = useMemo(
    () => (approved?.items ?? []).find((item) => item.employeeId === selectedId) ?? null,
    [approved?.items, selectedId],
  );

  const selectedName = useMemo(() => {
    if (selectedFromQueue?.employeeName) return selectedFromQueue.employeeName;
    if (selectedFromApproved?.employeeName) return selectedFromApproved.employeeName;
    return (employeeData?.data ?? []).find((person) => person.id === selectedId)?.fullName ?? null;
  }, [selectedFromQueue?.employeeName, selectedFromApproved?.employeeName, employeeData?.data, selectedId]);

  const awaitingCount = useMemo(() => {
    if (!canApprove || !weekData?.data) return selectedFromQueue?.submittedCount ?? 0;
    return weekData.data.priorities.filter(
      (row) =>
        row.status !== 'CANCELLED' &&
        row.status !== 'CARRIED_FORWARD' &&
        row.approvalStatus === 'SUBMITTED',
    ).length;
  }, [canApprove, weekData?.data, selectedFromQueue?.submittedCount]);

  const sheetTitle = selectedName ?? 'Employee priorities';
  const weekLabel = week ? `${week.start} → ${week.end}` : null;
  const filterHint = Boolean(departmentId || employeeId);

  function openEmployee(nextId: string) {
    router.replace(`${pathname}?employeeId=${encodeURIComponent(nextId)}`);
  }

  function closeSheet() {
    router.replace(pathname);
  }

  function goPrevWeek() {
    if (!week) {
      setWeekDate((current) => addDaysIso(current, -7));
      return;
    }
    setWeekDate(addDaysIso(week.start, -1));
  }

  function goNextWeek() {
    if (!week) {
      setWeekDate((current) => addDaysIso(current, 7));
      return;
    }
    setWeekDate(addDaysIso(week.end, 1));
  }

  async function onApproveAll() {
    if (!selectedId) return;
    try {
      const result = await approveAll({ employeeId: selectedId, date: weekDate }).unwrap();
      const count = result.data.approved.length;
      toast.success(count === 1 ? 'Approved 1 priority.' : `Approved ${count} priorities.`);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not approve remaining priorities.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Priorities" />
      <p className="mb-6 max-w-2xl text-sm text-muted">
        {canApprove
          ? 'Review submissions for the selected week, or browse who already has approved priorities. Open a row for the full plan.'
          : 'See who is waiting for CSO review and who already has approved priorities for the selected week. Only CSO can approve.'}
      </p>

      <div className="mb-6 space-y-4 rounded border border-border bg-background p-5 shadow-card">
        <Meta>Planning week</Meta>
        <p className="text-sm text-muted">
          Pick any date in the week you want. Both tables below use that week.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[11rem]">
            <Label htmlFor="priorities-week-date">Date in week</Label>
            <Input
              id="priorities-week-date"
              type="date"
              value={weekDate}
              onChange={(event) => setWeekDate(event.target.value || todayIso())}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={goPrevWeek}>
            Previous week
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goNextWeek}>
            Next week
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setWeekDate(todayIso())}>
            This week
          </Button>
        </div>
        {weekLabel ? (
          <p className="text-sm">
            Showing <span className="font-medium">{weekLabel}</span>
          </p>
        ) : null}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 sm:max-w-2xl">
        <div>
          <Label htmlFor="priorities-queue-dept">Department</Label>
          <select
            id="priorities-queue-dept"
            className={selectClass}
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
          >
            <option value="">All departments</option>
            {(departments?.data ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="priorities-queue-emp">Employee</Label>
          <select
            id="priorities-queue-emp"
            className={selectClass}
            value={employeeId}
            onChange={(event) => setEmployeeId(event.target.value)}
          >
            <option value="">All employees</option>
            {(employeeData?.data ?? []).map((person) => (
              <option key={person.id} value={person.id}>
                {person.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="mb-10 space-y-4">
        <div>
          <Meta>Awaiting review</Meta>
          <p className="mt-1 text-sm text-muted">
            {queue ? `${queueRows.length} waiting` : '…'}
            {weekLabel ? ` · ${weekLabel}` : null}
          </p>
        </div>
        {queueLoading ? <PageLoading compact message="Loading review queue…" /> : null}
        {!queueLoading ? (
          <DataTable
            columns={[
              { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
              { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
              { id: 'work', header: 'Work goals', cell: (row) => String(row.workGoalCount) },
              { id: 'skill', header: 'Skills', cell: (row) => String(row.skillCount) },
              {
                id: 'week',
                header: 'Week',
                cell: (row) => `${row.weekStart} → ${row.weekEnd}`,
              },
              {
                id: 'action',
                header: 'Review',
                cell: (row: QueueRow) => (
                  <Button type="button" size="sm" variant="outline" onClick={() => openEmployee(row.employeeId)}>
                    Review
                  </Button>
                ),
              },
            ]}
            rows={queueRows}
            emptyTitle="No submissions waiting"
            emptyDescription={
              filterHint
                ? 'No one in this filter is waiting for review. Clear the dropdowns or try another week.'
                : 'Employees only appear here after they submit for this week. Draft plans stay with them until they send for review.'
            }
          />
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <Meta>Approved priorities</Meta>
          <p className="mt-1 text-sm text-muted">
            {approved ? `${approvedRows.length} with approved lines` : '…'}
            {weekLabel ? ` · ${weekLabel}` : null}
          </p>
        </div>
        {approvedLoading ? <PageLoading compact message="Loading approved priorities…" /> : null}
        {!approvedLoading ? (
          <DataTable
            columns={[
              { id: 'name', header: 'Employee', cell: (row) => row.employeeName },
              { id: 'dept', header: 'Department', cell: (row) => row.departmentName ?? '—' },
              { id: 'work', header: 'Work goals', cell: (row) => String(row.workGoalCount) },
              { id: 'skill', header: 'Skills', cell: (row) => String(row.skillCount) },
              { id: 'lines', header: 'Approved', cell: (row) => String(row.approvedCount) },
              {
                id: 'week',
                header: 'Week',
                cell: (row) => `${row.weekStart} → ${row.weekEnd}`,
              },
              {
                id: 'action',
                header: 'View',
                cell: (row: ApprovedRow) => (
                  <Button type="button" size="sm" variant="outline" onClick={() => openEmployee(row.employeeId)}>
                    View
                  </Button>
                ),
              },
            ]}
            rows={approvedRows}
            emptyTitle="No approved priorities"
            emptyDescription={
              filterHint
                ? 'No approved plans match this filter for the selected week.'
                : 'When CSO approves a week’s priorities, people appear here. Change the week above to check another period.'
            }
          />
        ) : null}
      </section>

      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent title={sheetTitle.toUpperCase()} className="max-w-2xl">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              {selectedFromQueue?.departmentName || selectedFromApproved?.departmentName ? (
                <p className="text-sm text-muted">
                  {selectedFromQueue?.departmentName ?? selectedFromApproved?.departmentName}
                </p>
              ) : null}
              <Meta className="mt-2">Week</Meta>
              <p className="mt-1 text-sm">{weekLabel ?? '—'}</p>
              {awaitingCount > 0 ? (
                <p className="mt-2 text-sm text-muted">
                  {awaitingCount} line{awaitingCount === 1 ? '' : 's'} awaiting review
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">Nothing awaiting review for this person in this week.</p>
              )}
            </div>
            {canApprove && awaitingCount > 0 ? (
              <Button type="button" disabled={approveAllState.isLoading} onClick={() => void onApproveAll()}>
                {awaitingCount === 1 ? 'Approve line' : `Approve remaining (${awaitingCount})`}
              </Button>
            ) : null}
          </div>
          <MyWeekBoard
            mode="view"
            fixedEmployeeId={selectedId}
            showHeader={false}
            showWeekSummary={false}
            canApprove={canApprove}
            weekDate={weekDate}
            compact
          />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function AdminWorkPrioritiesPage({ canApprove = false }: { canApprove?: boolean }) {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <PrioritiesDesk canApprove={canApprove} />
    </Suspense>
  );
}
