import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
