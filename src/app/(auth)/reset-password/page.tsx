import { Suspense } from 'react';
import { PageLoading } from '@/components/ui/page-loading';
import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoading compact message="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
