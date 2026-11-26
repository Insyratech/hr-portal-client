import { redirect } from 'next/navigation';

/** Prep sessions retired — use Lab recipes / room QR work types. */
export default function Page() {
  redirect('/inventory/lab-recipes');
}
