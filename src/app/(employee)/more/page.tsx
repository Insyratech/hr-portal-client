import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Icon, type IconName } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

const MORE_LINKS: readonly { href: string; label: string; icon: IconName }[] = [
  { href: '/leave', label: 'Leave', icon: 'leave' },
  { href: '/work/history', label: 'Work history', icon: 'calendar' },
  { href: '/payslips', label: 'Payslips', icon: 'file' },
  { href: '/grievance', label: 'Grievance', icon: 'shield' },
  { href: '/policies', label: 'Policies', icon: 'file' },
  { href: '/more/profile', label: 'Profile details', icon: 'user' },
  { href: '/more/password', label: 'Change password', icon: 'settings' },
];

export default function MorePage() {
  return (
    <div className="space-y-8">
      <PageHeader kicker="More" title="More" />
      <p className="max-w-md text-sm text-muted">Shortcuts you use less often — leave, documents, and account.</p>
      <ul className="grid max-w-md grid-cols-1 gap-1 sm:max-w-xl sm:grid-cols-2">
        {MORE_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded px-3 py-2.5 text-sm text-foreground transition-colors',
                'hover:bg-surface',
              )}
            >
              <Icon name={item.icon} className="h-4 w-4 shrink-0 text-muted" />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
