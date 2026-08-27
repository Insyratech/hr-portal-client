import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ApiSuccess, CompanyLogoUpload } from '@/types/api';

type CreateLogo = (arg: {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => { unwrap: () => Promise<ApiSuccess<CompanyLogoUpload>> };

export async function uploadCompanyLogo(createLogo: CreateLogo, companyId: string, file: File): Promise<void> {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Logo must be 2MB or smaller.');
  }
  const session = await createLogo({
    id: companyId,
    fileName: file.name,
    contentType: file.type || 'image/jpeg',
    sizeBytes: file.size,
  }).unwrap();
  const { error } = await getSupabaseBrowserClient()
    .storage.from('company-logos')
    .uploadToSignedUrl(session.data.path, session.data.token, file);
  if (error) {
    throw error;
  }
}
