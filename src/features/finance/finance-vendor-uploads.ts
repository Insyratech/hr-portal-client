import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ApiSuccess, FinanceSignedUpload, FinanceVendorDocumentType } from '@/types/api';

type CreateLogo = (arg: {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => { unwrap: () => Promise<ApiSuccess<FinanceSignedUpload>> };

type CreateDoc = (arg: {
  id: string;
  documentType: FinanceVendorDocumentType;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => {
  unwrap: () => Promise<ApiSuccess<FinanceSignedUpload & { documentType: FinanceVendorDocumentType }>>;
};

export async function uploadFinanceOrgLogo(createLogo: CreateLogo, profileId: string, file: File): Promise<void> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo must be 2MB or smaller.');
  }
  const session = await createLogo({
    id: profileId,
    fileName: file.name,
    contentType: file.type || 'image/png',
    sizeBytes: file.size,
  }).unwrap();
  const { error } = await getSupabaseBrowserClient()
    .storage.from(session.data.bucket || 'finance-org-logos')
    .uploadToSignedUrl(session.data.path, session.data.token, file);
  if (error) throw error;
}

export async function uploadFinanceVendorDocument(
  createDoc: CreateDoc,
  vendorId: string,
  documentType: FinanceVendorDocumentType,
  file: File,
): Promise<void> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Document must be 10MB or smaller.');
  }
  const session = await createDoc({
    id: vendorId,
    documentType,
    fileName: file.name,
    contentType: file.type || 'application/pdf',
    sizeBytes: file.size,
  }).unwrap();
  const { error } = await getSupabaseBrowserClient()
    .storage.from(session.data.bucket || 'finance-vendor-docs')
    .uploadToSignedUrl(session.data.path, session.data.token, file);
  if (error) throw error;
}
