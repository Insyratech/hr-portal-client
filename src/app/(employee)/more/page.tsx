import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';

const MORE_LINKS = [
  { href: '/work/history', label: 'Work history' },
  { href: '/payslips', label: 'Payslips' },
  { href: '/grievance', label: 'Grievance' },
  { href: '/policies', label: 'Policies' },
  { href: '/more/password', label: 'Change password' },
];

export default function MorePage() {
  return (
    <>
      <PageHeader kicker="More" title="More" />
      <ul className="border border-border bg-background shadow-card">
        {MORE_LINKS.map((item) => (
          <li key={item.href} className="border-b border-border last:border-b-0">
            <Link href={item.href} className="block px-4 py-4 hover:bg-surface">
              <Meta>{item.label}</Meta>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
