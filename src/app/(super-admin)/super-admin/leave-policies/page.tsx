import { redirect } from 'next/navigation';

export default function LeavePoliciesRedirectPage() {
  redirect('/super-admin/leave-types');
}
