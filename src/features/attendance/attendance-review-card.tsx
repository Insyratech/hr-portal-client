'use client';

import { useState } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import Link from 'next/link';
import { LeaveJourney } from '@/components/leave/leave-journey';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import type { AttendanceReviewDay } from '@/types/api';
import {
  attendanceDayDetail,
  attendanceDayLopLabel,
  attendanceLopAmountClass,
  attendanceLopClass,
  attendanceStatusBadgeClass,
  attendanceStatusClass,
  attendanceStatusMark,
} from '@/features/attendance/attendance-day-display';
import {
  useDecideAttendanceReviewMutation,
  useGetAttendanceImportCardQuery,
} from '@/store/api/api';

const ACTIONS = [
  { id: 'FULL_LOP' as const, label: 'Full LOP' },
  { id: 'HALF_LOP' as const, label: 'Half LOP' },
  { id: 'NO_LOP' as const, label: 'No LOP' },
  { id: 'EXCLUDE' as const, label: 'Exclude' },
];

function AttendanceStatusLabel({ status }: { status: string }) {
  return (
    <span className={attendanceStatusBadgeClass(status)}>
      <span aria-hidden="true">{attendanceStatusMark(status)}</span>
      {status}
    </span>
  );
}

export function AttendanceReviewCardPage({
  importId,
  employeeId,
  listHref,
  canManage,
}: {
  importId: string;
  employeeId: string;
  listHref: string;
  canManage: boolean;
}) {
  const { data, isLoading, isError, error } = useGetAttendanceImportCardQuery({ id: importId, employeeId });
  const [decide] = useDecideAttendanceReviewMutation();
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const card = data?.data.card;
  const frozen = data?.data.import.status === 'CONFIRMED' || data?.data.import.status === 'REJECTED';

  async function onAction(day: AttendanceReviewDay, action: (typeof ACTIONS)[number]['id']) {
    setBusyId(day.id);
    try {
      await decide({ id: day.id, action }).unwrap();
      toast.success('Saved.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to save this day.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader kicker="Attendance" title={card?.fullName ?? 'Review card'} />
      <p className="mb-8">
        <Link href={`${listHref}/${importId}`} className="text-sm text-muted hover:text-foreground">
          Back to month
        </Link>
      </p>
      {isLoading ? <PageLoading compact message="Loading card…" /> : null}
      {isError ? <StatusMessage tone="danger">{apiErrorMessage(error, 'Unable to load this card.')}</StatusMessage> : null}
      {card ? (
        <div className="max-w-3xl space-y-8">
          <div className="border border-border bg-background p-6 shadow-card">
            <p className="text-sm font-medium">
              {card.employeeCode} · {card.fullName}
            </p>
            <p className="mt-2 text-sm text-muted">
              {card.companyName ?? 'No company'} · {card.shiftName ?? 'No shift'}
            </p>
            <div className="mt-6">
              <LeaveJourney
                steps={[
                  { key: 'parsed', label: 'Parsed', state: 'done' },
                  {
                    key: 'flags',
                    label: card.openFlags ? `${card.openFlags} flagged` : 'Flags clear',
                    state: card.openFlags ? 'current' : 'done',
                  },
                  {
                    key: 'confirm',
                    label: frozen ? 'Month confirmed' : 'Confirm on month page',
                    state: frozen ? 'done' : 'todo',
                  },
                ]}
              />
            </div>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <Meta>Leave taken</Meta>
                <p className="mt-1">
                  {card.leaves.length === 0
                    ? 'None'
                    : card.leaves
                        .map(
                          (item) =>
                            `${item.date} · ${item.typeName} · ${item.paid ? 'paid' : 'unpaid'} · ${item.duration === 'half' ? 'half' : 'full'}`,
                        )
                        .join('; ')}
                </p>
              </div>
              <div>
                <Meta>Permissions</Meta>
                <p className="mt-1">
                  {card.permissions.length === 0
                    ? `None · ${card.remainingLabel}`
                    : `${card.permissions.map((item) => `${item.minutes}m on ${item.date}`).join('; ')} · ${card.remainingLabel}`}
                </p>
              </div>
              <div>
                <Meta>Proposed LOP</Meta>
                <p className={cn('mt-1', attendanceLopAmountClass(card.proposedLop))}>{card.proposedLop}</p>
              </div>
              <div>
                <Meta>Final payable / LOP</Meta>
                <p className={cn('mt-1', attendanceLopAmountClass(card.finalLop))}>
                  {card.payableDays} payable days · {card.finalLop} LOP
                </p>
              </div>
            </dl>
          </div>

          <div className="space-y-3">
            {card.days.map((day) => (
              <div key={day.id} className="border border-border p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {day.attendanceDate} · in {day.actualIn ?? '—'} · out {day.actualOut ?? '—'}
                  </p>
                  <AttendanceStatusLabel status={day.status} />
                </div>
                <p
                  className={cn(
                    'mt-2 text-sm',
                    day.status === 'LATE' || day.status === 'HALF_DAY' || day.status === 'LEAVE'
                      ? attendanceStatusClass(day.status)
                      : 'text-muted',
                  )}
                >
                  {attendanceDayDetail(day, card.shiftName)}
                </p>
                {day.needsHrDecision ? (
                  <p className="mt-2 text-sm">Needs your LOP choice{day.hrAction ? ` · ${day.hrAction}` : ''}.</p>
                ) : (
                  <p className={cn('mt-2 text-sm', attendanceLopClass(day))}>{attendanceDayLopLabel(day)}</p>
                )}
                {canManage &&
                !frozen &&
                (day.needsHrDecision ||
                  day.status === 'ABSENT' ||
                  day.status === 'HALF_DAY' ||
                  day.status === 'LATE' ||
                  day.status === 'MISSING_PUNCH') ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ACTIONS.map((item) => (
                      <Button
                        key={item.id}
                        type="button"
                        size="sm"
                        variant={day.hrAction === item.id ? 'primary' : 'outline'}
                        disabled={busyId === day.id}
                        onClick={() => void onAction(day, item.id)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
