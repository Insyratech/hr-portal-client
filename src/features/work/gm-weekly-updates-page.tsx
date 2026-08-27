'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { useToast } from '@/hooks/use-toast';
import { apiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import {
  useGetWeeklyPptGmSharesQuery,
  useLazyGetWeeklyWorkUpdateDownloadQuery,
} from '@/store/api/api';

function formatSharedAt(iso: string): string {
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

function GmWeeklyUpdatesInner() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const highlightShareId = searchParams.get('shareId');
  const { data, isLoading, isError } = useGetWeeklyPptGmSharesQuery();
  const [fetchDownload] = useLazyGetWeeklyWorkUpdateDownloadQuery();
  const board = data?.data;

  const ordered = useMemo(() => board?.shares ?? [], [board?.shares]);

  useEffect(() => {
    if (!highlightShareId) return;
    const el = document.getElementById(`share-${highlightShareId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [highlightShareId, ordered.length]);

  async function onDownload(updateId: string, shareId: string) {
    try {
      const result = await fetchDownload({ id: updateId, shareId }).unwrap();
      window.open(result.data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not open download.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Work" title="Shared weekly updates" />
      <p className="mb-8 max-w-2xl text-sm text-muted">
        Packages CSO shared with you. Only shared weeks appear here — not the full team archive.
      </p>

      {isLoading ? <p className="text-sm text-muted">Loading…</p> : null}
      {isError ? <p className="text-sm">Unable to load shared weekly updates.</p> : null}

      {board ? (
        <div className="space-y-6">
          {board.count === 0 ? (
            <p className="text-sm text-muted">
              No packages shared yet. When CSO shares a week’s PPTs, they appear here with download links.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted">
                {board.count} shared package{board.count === 1 ? '' : 's'}.
              </p>
              <ul className="space-y-4">
                {ordered.map((share) => {
                  const highlighted = highlightShareId === share.id;
                  return (
                    <li
                      key={share.id}
                      id={`share-${share.id}`}
                      className={cn(
                        'border border-border bg-background p-5 shadow-card',
                        highlighted && 'ring-1 ring-foreground',
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Meta>Week</Meta>
                          <p className="mt-1 text-sm font-medium">
                            {share.weekStart} → {share.weekEnd}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Shared by {share.sharedByName} · {formatSharedAt(share.sharedAt)} IST ·{' '}
                            {share.fileCount} file{share.fileCount === 1 ? '' : 's'}
                          </p>
                        </div>
                      </div>

                      {share.files.length === 0 ? (
                        <p className="mt-4 text-sm text-muted">No files in this package.</p>
                      ) : (
                        <ul className="mt-4 space-y-2">
                          {share.files.map((file) => (
                            <li
                              key={file.updateId}
                              className="flex flex-wrap items-center justify-between gap-3 border border-border bg-surface px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium">{file.employeeName}</p>
                                <p className="text-xs text-muted">{file.systemFileName}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {file.late ? <StatusBadge status="rejected" label="Late" /> : null}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => void onDownload(file.updateId, share.id)}
                                >
                                  Download
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      ) : null}
    </>
  );
}

export function GmWeeklyUpdatesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <GmWeeklyUpdatesInner />
    </Suspense>
  );
}
