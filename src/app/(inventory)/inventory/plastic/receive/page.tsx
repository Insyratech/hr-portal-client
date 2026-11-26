import { redirect } from 'next/navigation';

/** Plastic/box receive is part of the unified receive journey. */
export default function Page() {
  redirect('/inventory/receive');
}
