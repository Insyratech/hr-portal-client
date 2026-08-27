import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ApiSuccess, WeeklyWorkUpdateUploadSession } from '@/types/api';

type CreateUpload = (arg: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => { unwrap: () => Promise<ApiSuccess<WeeklyWorkUpdateUploadSession>> };

export async function uploadWeeklyWorkUpdate(
  createUpload: CreateUpload,
  file: File,
): Promise<WeeklyWorkUpdateUploadSession> {
  const session = await createUpload({
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }).unwrap();

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(session.data.bucket)
    .uploadToSignedUrl(session.data.path, session.data.token, file);
  if (error) {
    throw error;
  }
  return session.data;
}
