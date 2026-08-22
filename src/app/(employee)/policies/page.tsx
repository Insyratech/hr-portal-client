'use client';

import { useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { StatusMessage } from '@/components/ui/status-message';
import { apiErrorMessage } from '@/lib/api-error';
import { useAcknowledgePolicyMutation, useGetPoliciesQuery, useGetPolicyQuery } from '@/store/api/api';

export default function PoliciesPage() {
  const { data, isLoading } = useGetPoliciesQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: detailData } = useGetPolicyQuery(selectedId ?? '', { skip: !selectedId });
  const [acknowledge, { isLoading: acknowledging }] = useAcknowledgePolicyMutation();
  const [error, setError] = useState<string | null>(null);
  const detail = detailData?.data;

  async function onAcknowledge(): Promise<void> {
    if (!selectedId) return;
    setError(null);
    try {
      await acknowledge(selectedId).unwrap();
    } catch (cause) {
      setError(apiErrorMessage(cause, 'Unable to acknowledge policy.'));
    }
  }

  return (
    <>
      <PageHeader kicker="Policies" title="HR policies" />
      <DataTable
        columns={[
          { id: 'title', header: 'Title', cell: (row) => row.title },
          {
            id: 'version',
            header: 'Version',
            cell: (row) => row.currentVersion?.versionLabel ?? '—',
          },
          {
            id: 'effective',
            header: 'Effective',
            cell: (row) => row.currentVersion?.effectiveDate ?? '—',
          },
          {
            id: 'ack',
            header: 'Acknowledgement',
            cell: (row) =>
              !row.currentVersion?.acknowledgementRequired
                ? 'Not required'
                : row.acknowledged
                  ? 'Accepted'
                  : 'Pending',
          },
          {
            id: 'read',
            header: 'Read',
            cell: (row) => (
              <Button type="button" size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                Read policy
              </Button>
            ),
          },
        ]}
        rows={data?.data ?? []}
        emptyTitle={isLoading ? 'Loading' : 'No policies'}
        emptyDescription="Published policies appear here after Super Admin publishes them."
      />

      {detail ? (
        <section className="mt-10 max-w-2xl space-y-4 border border-border p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">
            {detail.title} · v{detail.currentVersion?.versionLabel ?? '—'}
          </p>
          <p className="text-sm text-muted">Effective {detail.currentVersion?.effectiveDate ?? '—'}</p>
          <p className="whitespace-pre-line text-sm">{detail.content}</p>
          {error ? <StatusMessage tone="danger">{error}</StatusMessage> : null}
          {detail.currentVersion?.acknowledgementRequired && !detail.acknowledged ? (
            <Button type="button" disabled={acknowledging} onClick={() => void onAcknowledge()}>
              Acknowledge
            </Button>
          ) : null}
          {detail.acknowledged ? (
            <StatusMessage tone="success">{`Accepted ${detail.acknowledgedAt ?? ''}`}</StatusMessage>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
