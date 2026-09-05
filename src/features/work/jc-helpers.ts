import { getSupabaseBrowserClient } from '@/lib/supabase';
import type { ApiSuccess, JcPptUploadSession } from '@/types/api';

type CreateUpload = (arg: {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}) => { unwrap: () => Promise<ApiSuccess<JcPptUploadSession>> };

export async function uploadJcPpt(
  createUpload: CreateUpload,
  file: File,
): Promise<JcPptUploadSession> {
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

export function downloadBase64File(fileName: string, contentType: string, contentBase64: string) {
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: contentType || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function jcStatusTone(status: string): 'approved' | 'pending' | 'rejected' {
  if (status === 'downloaded' || status === 'emailed' || status === 'deleted') return 'approved';
  if (status === 'with_gm') return 'pending';
  return 'pending';
}

export function jcStatusLabel(status: string): string {
  if (status === 'uploaded') return 'With CSO';
  if (status === 'with_gm') return 'With GM';
  if (status === 'downloaded') return 'Downloaded';
  if (status === 'emailed') return 'Emailed';
  if (status === 'deleted') return 'Deleted';
  return status;
}

export function formatJcWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
