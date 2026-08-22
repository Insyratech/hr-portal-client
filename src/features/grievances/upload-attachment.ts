import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ApiSuccess, GrievanceUploadSession } from '@/types/api';

type CreateAttachment = (arg: {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => { unwrap: () => Promise<ApiSuccess<GrievanceUploadSession>> };

export async function uploadGrievanceFile(
  createAttachment: CreateAttachment,
  grievanceId: string,
  file: File,
): Promise<void> {
  const session = await createAttachment({
    id: grievanceId,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }).unwrap();

  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from('grievance-attachments')
    .uploadToSignedUrl(session.data.path, session.data.token, file);
  if (error) {
    throw error;
  }
}
