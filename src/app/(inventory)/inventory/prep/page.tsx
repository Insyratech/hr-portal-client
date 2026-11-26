import { redirect } from 'next/navigation';

/** Prep sessions retired — lab-made reagents use usage area → work type (Lab recipes). */
export default function Page() {
  redirect('/inventory/lab-recipes');
}
