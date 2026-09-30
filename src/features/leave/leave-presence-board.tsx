'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Meta } from '@/components/layout/meta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  formatLeavePresenceLine,
  groupLeavePresenceByEmployee,
  todayIso,
  type LeavePresencePerson,
} from '@/features/leave/leave-presence';
import { useGetLeavePresenceQuery } from '@/store/api/api';

function PersonList({
  people,
  reviewBase,
  linkReviews,
  emptyTitle,
  emptyDescription,
}: {
  people: LeavePresencePerson[];
  reviewBase: string;
  linkReviews: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (people.length === 0) {
    return (
      <div className="rounded border border-border bg-background px-4 py-10 text-center shadow-card">
        <p className="text-sm font-medium uppercase tracking-wide text-muted">{emptyTitle}</p>
        <p className="mt-2 text-sm text-muted">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded border border-border bg-background shadow-card">
      {people.map((person) => (
        <li key={person.employeeId} className="px-4 py-3">
          <p className="text-sm font-medium">{person.employeeName}</p>
          <ul className="mt-1 space-y-1">
            {person.leaves.map((leave) => (
              <li key={leave.id} className="text-sm text-muted">
                {linkReviews ? (
                  <Link
                    href={`${reviewBase}/${leave.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {formatLeavePresenceLine(leave)}
                  </Link>
                ) : (
                  formatLeavePresenceLine(leave)
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Section({
  title,
  peopleCount,
  loading,
  children,
}: {
  title: string;
  peopleCount: number;
  loading: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <Meta className="mb-4">
        {title} · {loading ? '…' : peopleCount}
      </Meta>
      {children}
    </div>
  );
}

export function LeavePresenceBoard({
  reviewBase,
  linkReviews = true,
  /** When set, hide the date picker and lock the as-of day (overview widgets). */
  fixedAsOf,
  showPast = true,
}: {
  reviewBase: string;
  /** When false, leave lines are plain text (e.g. GM who’s-out view). */
  linkReviews?: boolean;
  fixedAsOf?: string;
  showPast?: boolean;
}) {
  const [asOf, setAsOf] = useState(fixedAsOf ?? todayIso());
  const queryAsOf = fixedAsOf ?? asOf;
  const { data, isLoading, isFetching, isError } = useGetLeavePresenceQuery({ asOf: queryAsOf });
  const board = data?.data;
  const loading = isLoading || isFetching;

  const onLeavePeople = useMemo(
    () => groupLeavePresenceByEmployee(board?.onLeave ?? []),
    [board?.onLeave],
  );
  const upcomingPeople = useMemo(
    () => groupLeavePresenceByEmployee(board?.upcoming ?? []),
    [board?.upcoming],
  );
  const pastPeople = useMemo(
    () => groupLeavePresenceByEmployee(board?.past ?? []),
    [board?.past],
  );

  if (isError) {
    return <p className="mt-10 text-sm">Unable to load who is out.</p>;
  }

  return (
    <div className="mt-10 space-y-10">
      {!fixedAsOf ? (
        <div className="max-w-xs">
          <Label htmlFor="presence-as-of">As of date</Label>
          <Input
            id="presence-as-of"
            type="date"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value || todayIso())}
          />
          <p className="mt-1 text-xs text-muted">
            Who is out on this day, plus approved leave after it and recent past leave.
          </p>
        </div>
      ) : null}

      {loading && !board ? <TableSkeleton columns={1} rows={4} /> : null}

      <Section
        title={queryAsOf === todayIso() ? 'On leave today' : `On leave on ${queryAsOf}`}
        peopleCount={onLeavePeople.length}
        loading={loading}
      >
        <PersonList
          people={onLeavePeople}
          reviewBase={reviewBase}
          linkReviews={linkReviews}
          emptyTitle="Nobody on leave"
          emptyDescription="Approved leave that covers this date appears here, one person per row."
        />
      </Section>

      <Section title="Upcoming approved" peopleCount={upcomingPeople.length} loading={loading}>
        <PersonList
          people={upcomingPeople}
          reviewBase={reviewBase}
          linkReviews={linkReviews}
          emptyTitle="No upcoming approved leave"
          emptyDescription="Approved leave that starts after this date appears here."
        />
      </Section>

      {showPast ? (
        <Section title="Past leave" peopleCount={pastPeople.length} loading={loading}>
          <PersonList
            people={pastPeople}
            reviewBase={reviewBase}
            linkReviews={linkReviews}
            emptyTitle="No recent past leave"
            emptyDescription={
              board?.pastFrom
                ? `Approved leave that ended before this date (from ${board.pastFrom}) appears here.`
                : 'Approved leave that ended before this date appears here.'
            }
          />
        </Section>
      ) : null}
    </div>
  );
}

/** Compact overview strip — locked to today, no past section. */
export function LeavePresenceOverview({
  reviewBase,
  linkReviews = true,
}: {
  reviewBase: string;
  linkReviews?: boolean;
}) {
  return (
    <LeavePresenceBoard
      reviewBase={reviewBase}
      linkReviews={linkReviews}
      fixedAsOf={todayIso()}
      showPast={false}
    />
  );
}
