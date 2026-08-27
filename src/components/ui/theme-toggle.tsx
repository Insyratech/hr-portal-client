'use client';

import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

/** Pill switch with sun (light) / moon (dark), placed beside Alerts in the top bar. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      onClick={toggleTheme}
      className={cn(
        'relative inline-flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border border-transparent p-0.5 transition-colors duration-300 ease-out',
        isDark ? 'bg-neutral-200' : 'bg-neutral-900',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-out',
          isDark ? 'translate-x-[1.35rem] bg-neutral-950 text-white' : 'translate-x-0 bg-white text-neutral-950',
        )}
      >
        <Icon name={isDark ? 'moon' : 'sun'} className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
