'use client';

import { IconButton } from '@/components/ui/icon-button';

export function EditIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <IconButton icon="pencil" label={label} onClick={onClick} />;
}
