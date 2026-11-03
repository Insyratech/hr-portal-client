'use client';

import { useParams } from 'next/navigation';
import { HrInvoiceViewPage } from '@/features/hr-invoices/invoice-view-page';

export default function Page() {
  const params = useParams<{ id: string }>();
  return <HrInvoiceViewPage invoiceId={params.id} />;
}
