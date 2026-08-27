'use client';

import { PageHeader } from '@/components/layout/page-header';
import { PageLoading } from '@/components/ui/page-loading';
import { Meta } from '@/components/layout/meta';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetEmployeeQuery, useGetMeQuery } from '@/store/api/api';

export default function SuperAdminProfilePage() {
  const { data: me } = useGetMeQuery();
  const employeeId = me?.data.employeeId ?? '';
  const { data } = useGetEmployeeQuery(employeeId, { skip: !employeeId });
  const employee = data?.data;

  if (!employee) {
    return (
      <>
        <PageHeader kicker="Account" title="Profile" />
        <PageLoading compact message="Loading your profile…" />
      </>
    );
  }

  return (
    <>
      <PageHeader kicker="Account" title="Profile" />
      <p className="mb-6 max-w-xl text-sm text-muted">
        Super Admin oversees accounts, access roles, policies, and system settings. Change your password from System →
        Password. Day-to-day employee tools (leave, attendance, work) are for staff roles only.
      </p>
      <div className="max-w-xl space-y-5">
        <div>
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" value={employee.fullName} disabled readOnly />
        </div>
        <div>
          <Label htmlFor="email">Login email</Label>
          <Input id="email" value={employee.email} disabled readOnly />
        </div>
        <div>
          <Label htmlFor="notificationEmail">Notification email</Label>
          <Input id="notificationEmail" value={employee.notificationEmail || employee.email} disabled readOnly />
          <Meta className="mt-1">Leave and other update mail is sent here.</Meta>
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={employee.phone ?? ''} disabled readOnly />
        </div>
      </div>
    </>
  );
}
