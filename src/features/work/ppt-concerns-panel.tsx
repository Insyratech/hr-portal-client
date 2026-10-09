'use client';

import { useMemo, useState } from 'react';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { PageLoading } from '@/components/ui/page-loading';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { PptUploadConcern } from '@/types/api';
import {
  useCreatePptConcernMutation,
  useGetMyPptConcernsQuery,
  useGetPptConcernsDeskQuery,
  useReviewPptConcernMutation,
} from '@/store/api/api';

function concernStatusTone(status: PptUploadConcern['status']): 'approved' | 'pending' | 'rejected' {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

function concernStatusLabel(status: PptUploadConcern['status']): string {
  if (status === 'approved') return 'Approved — late upload open';
  if (status === 'rejected') return 'Rejected — RED FLAG';
  return 'Pending CSO review — RED FLAG';
}

function kindLabel(kind: PptUploadConcern['kind']): string {
  return kind === 'jc' ? 'JC PPT' : 'Weekly PPT';
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Employee: raise a late-upload concern after Sunday 11:59 pm IST. */
export function PptRaiseConcernPanel({
  kind,
  weekStart,
}: {
  kind: 'weekly' | 'jc';
  weekStart?: string;
}) {
  const toast = useToast();
  const { data, isLoading, refetch } = useGetMyPptConcernsQuery();
  const [createConcern, createState] = useCreatePptConcernMutation();
  const [reason, setReason] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const mine = useMemo(
    () => (data?.data ?? []).filter((row) => row.kind === kind),
    [data?.data, kind],
  );
  const openForWeek = mine.find(
    (row) =>
      (!weekStart || row.weekStart === weekStart) &&
      (row.status === 'pending' || (row.status === 'approved' && !row.lateUploadUsed)),
  );

  async function onSubmit() {
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      toast.error('Describe the issue in at least 10 characters.');
      return;
    }
    try {
      const result = await createConcern({
        kind,
        weekStart,
        reason: trimmed,
        screenshotFileName: screenshot?.name,
        screenshotContentType: screenshot?.type || undefined,
        screenshotSizeBytes: screenshot?.size,
      }).unwrap();

      const upload = result.data.screenshotUpload;
      if (upload && screenshot) {
        const supabase = getSupabaseBrowserClient();
        const { error } = await supabase.storage
          .from(upload.bucket)
          .uploadToSignedUrl(upload.path, upload.token, screenshot);
        if (error) {
          toast.error('Concern saved, but screenshot upload failed. You can still wait for CSO review.');
        } else {
          toast.success('Concern submitted with screenshot. Waiting for CSO review.');
        }
      } else {
        toast.success('Concern submitted. Waiting for CSO review.');
      }
      setReason('');
      setScreenshot(null);
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not submit the concern.'));
    }
  }

  return (
    <section className="border border-border bg-background p-5 shadow-card">
      <Meta>Missed the window? Raise a concern</Meta>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        After Sunday 11:59 pm IST, upload is locked until CSO approves a one-time late reopen for this week. Pending or
        rejected concerns show as a RED FLAG on the General Manager monthly report.
      </p>

      {isLoading ? <PageLoading compact message="Loading concerns…" /> : null}

      {openForWeek ? (
        <div className="mt-4 space-y-2 text-sm">
          <StatusBadge
            status={concernStatusTone(openForWeek.status)}
            label={concernStatusLabel(openForWeek.status)}
          />
          <p className="text-muted">
            Week {openForWeek.weekStart} → {openForWeek.weekEnd}
            {openForWeek.status === 'approved' && !openForWeek.lateUploadUsed
              ? ' — you may upload once now (marked late).'
              : ''}
          </p>
          <p className="text-foreground">{openForWeek.reason}</p>
          {openForWeek.reviewNote ? (
            <p className="text-xs text-muted">CSO note: {openForWeek.reviewNote}</p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <Label htmlFor={`ppt-concern-reason-${kind}`}>What went wrong?</Label>
            <textarea
              id={`ppt-concern-reason-${kind}`}
              className="mt-1 min-h-[96px] w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground shadow-card outline-none placeholder:text-muted focus:border-foreground"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain why the PPT was not uploaded in the Saturday 2:00 pm – Sunday 11:59 pm IST window."
              maxLength={4000}
            />
          </div>
          <div>
            <Label htmlFor={`ppt-concern-shot-${kind}`}>Screenshot (optional, max 5 MB)</Label>
            <Input
              id={`ppt-concern-shot-${kind}`}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="mt-1"
              onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={createState.isLoading}
            onClick={() => void onSubmit()}
          >
            {createState.isLoading ? 'Submitting…' : 'Submit concern to CSO'}
          </Button>
        </div>
      )}

      {mine.length > 0 ? (
        <ul className="mt-6 space-y-2 border-t border-border pt-4">
          {mine.slice(0, 8).map((row) => (
            <li key={row.id} className="text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={concernStatusTone(row.status)} label={row.status} />
                <span className="text-muted">
                  {row.weekStart} → {row.weekEnd} · {formatWhen(row.createdAt)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** CSO: approve (reopen one late upload) or reject (RED FLAG). */
export function PptConcernsReviewDesk({ kindFilter }: { kindFilter?: 'weekly' | 'jc' }) {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetPptConcernsDeskQuery({ status: 'pending' });
  const [review, reviewState] = useReviewPptConcernMutation();
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    return kindFilter ? all.filter((row) => row.kind === kindFilter) : all;
  }, [data?.data, kindFilter]);

  async function onReview(id: string, status: 'approved' | 'rejected') {
    setBusyId(id);
    try {
      await review({ id, status, reviewNote: noteById[id]?.trim() || undefined }).unwrap();
      toast.success(
        status === 'approved'
          ? 'Approved — employee may upload once late for that week.'
          : 'Rejected — remains a RED FLAG on the monthly report.',
      );
      await refetch();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not review the concern.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-3">
      <Meta>Late upload concerns</Meta>
      <p className="max-w-2xl text-sm text-muted">
        Approve to reopen one late upload for that Tue–Mon week (marked late). Reject or leave pending → RED FLAG on
        the General Manager monthly report for salary/attendance review.
      </p>

      {isLoading ? <PageLoading compact message="Loading concerns…" /> : null}
      {isError ? <p className="text-sm">Unable to load concerns.</p> : null}

      {!isLoading && rows.length === 0 ? (
        <p className="text-sm text-muted">No pending concerns{kindFilter ? ` for ${kindLabel(kindFilter)}` : ''}.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="border border-border bg-background px-4 py-3 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {row.employeeName ?? 'Employee'} · {kindLabel(row.kind)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Week {row.weekStart} → {row.weekEnd} · {formatWhen(row.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-foreground">{row.reason}</p>
                  {row.screenshotUrl ? (
                    <a
                      href={row.screenshotUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-muted underline hover:text-foreground"
                    >
                      View screenshot{row.screenshotFileName ? ` (${row.screenshotFileName})` : ''}
                    </a>
                  ) : null}
                  <div className="mt-3 max-w-md">
                    <Label htmlFor={`review-note-${row.id}`}>Note (optional)</Label>
                    <Input
                      id={`review-note-${row.id}`}
                      className="mt-1"
                      value={noteById[row.id] ?? ''}
                      onChange={(event) =>
                        setNoteById((prev) => ({ ...prev, [row.id]: event.target.value }))
                      }
                      placeholder="Visible to the employee"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewState.isLoading && busyId === row.id}
                    onClick={() => void onReview(row.id, 'approved')}
                  >
                    Approve reopen
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reviewState.isLoading && busyId === row.id}
                    onClick={() => void onReview(row.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
