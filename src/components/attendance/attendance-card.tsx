import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';

export function AttendanceCard({
  punchedIn,
  punchedAt,
  duration,
  onPunch,
  disabled = false,
  actionLabel,
}: {
  punchedIn: boolean;
  punchedAt: string | null;
  duration: string | null;
  onPunch: () => void;
  disabled?: boolean;
  actionLabel?: string;
}) {
  return (
    <section className="border border-border bg-background p-6 shadow-card">
      <Meta className="mb-6">Today</Meta>
      <p className="text-2xl font-semibold tracking-tight">
        {punchedIn && punchedAt ? punchedAt : 'Not punched in'}
      </p>
      <p className="mt-2 text-sm text-muted">
        {duration ?? (punchedIn ? 'Work duration pending' : 'Punch in to start your day.')}
      </p>
      <div className="mt-6">
        <Button type="button" onClick={onPunch} disabled={disabled}>
          {actionLabel ?? (punchedIn ? 'Punch out' : 'Punch in')}
        </Button>
      </div>
    </section>
  );
}
