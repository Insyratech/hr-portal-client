import { redirect } from 'next/navigation';

/** CSO home is Team week — Overview was removed as a duplicate of the sidebar. */
export default function CsoHomePage() {
  redirect('/cso/work');
}
