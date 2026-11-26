import { redirect } from 'next/navigation';

/** Station QRs retired — usage goes through the three Usage areas. */
export default function Page() {
  redirect('/inventory/central-qrs');
}
