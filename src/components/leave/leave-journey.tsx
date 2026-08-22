import { cn } from '@/lib/utils';
import type { JourneyStep } from '@/features/leave/leave-journey';

function Node({ state, last }: { state: JourneyStep['state']; last: boolean }) {
  const ring =
    state === 'todo'
      ? 'border-border bg-background'
      : state === 'current'
        ? 'border-foreground bg-background'
        : state === 'failed'
          ? 'border-foreground bg-background'
          : 'border-foreground bg-foreground';

  return (
    <span className={cn('flex h-4 w-4 items-center justify-center rounded-full border', ring)}>
      {last && state === 'done' ? (
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5 text-background" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M3 8.5l3.2 3.2L13 4.8" />
        </svg>
      ) : state === 'failed' ? (
        <span className="text-[10px] leading-none text-foreground">×</span>
      ) : state === 'current' ? (
        <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
      ) : state === 'done' ? null : null}
    </span>
  );
}

export function LeaveJourney({ steps }: { steps: JourneyStep[] }) {
  return (
    <ol className="flex w-full items-start">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        const filled = step.state === 'done' || step.state === 'failed';
        return (
          <li key={step.key} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={cn('h-px flex-1', index === 0 ? 'bg-transparent' : filled || step.state === 'current' ? 'bg-foreground' : 'bg-border')} />
              <Node state={step.state} last={last} />
              <div className={cn('h-px flex-1', last ? 'bg-transparent' : filled ? 'bg-foreground' : 'bg-border')} />
            </div>
            <p className="mt-2 px-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted">{step.label}</p>
          </li>
        );
      })}
    </ol>
  );
}
