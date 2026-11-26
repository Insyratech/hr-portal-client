'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/components/dashboard/data-table';
import { PageHeader } from '@/components/layout/page-header';
import { Meta } from '@/components/layout/meta';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DelayedLoadingOverlay } from '@/components/ui/delayed-loading-overlay';
import { apiErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { PERMISSIONS } from '@/types/permissions';
import {
  useCreateInventorySopFolderMutation,
  useDeleteInventorySopFileMutation,
  useDeleteInventorySopFolderMutation,
  useGetInventorySopFilesQuery,
  useGetInventorySopFoldersQuery,
  useLazyGetInventorySopPdfQuery,
  useUpdateInventorySopFileMutation,
  useUpdateInventorySopFolderMutation,
  useUploadInventorySopFileMutation,
} from '@/store/api/api';
import type { InventorySopFile, InventorySopFolder } from '@/types/api';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function openPdfPreview(contentBase64: string, fileName: string) {
  const binary = atob(contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function InventorySopsPage() {
  const toast = useToast();
  const permissions = useAppSelector((state) => state.permissions.permissions);
  const canManage =
    permissions.includes(PERMISSIONS.INVENTORY_SOPS_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LAB_MANAGE) ||
    permissions.includes(PERMISSIONS.INVENTORY_LOTS_MANAGE);

  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const currentFolderId = folderStack.length ? folderStack[folderStack.length - 1]!.id : null;

  const { data: foldersData, isLoading: loadingFolders } = useGetInventorySopFoldersQuery(
    currentFolderId ? { parentId: currentFolderId } : undefined,
    { skip: !canManage },
  );
  const { data: filesData, isLoading: loadingFiles } = useGetInventorySopFilesQuery(
    currentFolderId ?? undefined,
    { skip: !canManage || !currentFolderId },
  );

  const [createFolder, { isLoading: creatingFolder }] = useCreateInventorySopFolderMutation();
  const [updateFolder, { isLoading: updatingFolder }] = useUpdateInventorySopFolderMutation();
  const [deleteFolder, { isLoading: deletingFolder }] = useDeleteInventorySopFolderMutation();
  const [uploadFile, { isLoading: uploading }] = useUploadInventorySopFileMutation();
  const [updateFile, { isLoading: updatingFile }] = useUpdateInventorySopFileMutation();
  const [deleteFile, { isLoading: deletingFile }] = useDeleteInventorySopFileMutation();
  const [fetchPdf, { isFetching: loadingPdf }] = useLazyGetInventorySopPdfQuery();

  const [folderOpen, setFolderOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renameFolder, setRenameFolder] = useState<InventorySopFolder | null>(null);
  const [renameFile, setRenameFile] = useState<InventorySopFile | null>(null);

  const folders = foldersData?.data ?? [];
  const files = filesData?.data ?? [];
  const busy =
    loadingFolders ||
    loadingFiles ||
    creatingFolder ||
    updatingFolder ||
    deletingFolder ||
    uploading ||
    updatingFile ||
    deletingFile ||
    loadingPdf;

  const breadcrumb = useMemo(() => {
    const parts = [{ id: null as string | null, name: 'SOPs' }, ...folderStack];
    return parts;
  }, [folderStack]);

  async function onCreateFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await createFolder({
        name: String(form.get('name') ?? '').trim(),
        parentId: currentFolderId,
      }).unwrap();
      setFolderOpen(false);
      toast.success('Folder created.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to create folder.'));
    }
  }

  async function onRenameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renameFolder) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateFolder({
        id: renameFolder.id,
        body: { name: String(form.get('name') ?? '').trim() },
      }).unwrap();
      setRenameFolder(null);
      toast.success('Folder renamed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to rename folder.'));
    }
  }

  async function onDeleteFolder(folder: InventorySopFolder) {
    if (!window.confirm(`Delete folder “${folder.name}”? It must be empty.`)) return;
    try {
      await deleteFolder(folder.id).unwrap();
      toast.success('Folder deleted.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to delete folder.'));
    }
  }

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentFolderId) {
      toast.error('Open a folder before uploading.');
      return;
    }
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    if (!(file instanceof File) || file.size === 0) {
      toast.error('Choose a PDF file.');
      return;
    }
    if (!/\.pdf$/i.test(file.name) || file.type !== 'application/pdf') {
      toast.error('Upload a PDF only. Export Word/Docs to PDF first.');
      return;
    }
    try {
      const contentBase64 = await fileToBase64(file);
      await uploadFile({
        folderId: currentFolderId,
        title: String(form.get('title') ?? '').trim() || undefined,
        fileName: file.name,
        contentBase64,
      }).unwrap();
      setUploadOpen(false);
      toast.success('SOP uploaded (PDF compressed with zstd).');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to upload SOP.'));
    }
  }

  async function onRenameFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renameFile) return;
    const form = new FormData(event.currentTarget);
    try {
      await updateFile({
        id: renameFile.id,
        body: { title: String(form.get('title') ?? '').trim() },
      }).unwrap();
      setRenameFile(null);
      toast.success('SOP renamed.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to rename SOP.'));
    }
  }

  async function onDeleteFile(file: InventorySopFile) {
    if (!window.confirm(`Delete SOP “${file.title}”?`)) return;
    try {
      await deleteFile(file.id).unwrap();
      toast.success('SOP deleted.');
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to delete SOP.'));
    }
  }

  async function onPreview(file: InventorySopFile) {
    try {
      const result = await fetchPdf(file.id).unwrap();
      openPdfPreview(result.data.contentBase64, result.data.fileName);
    } catch (cause) {
      toast.error(apiErrorMessage(cause, 'Unable to open SOP preview.'));
    }
  }

  if (!canManage) {
    return (
      <>
        <PageHeader kicker="Stock" title="SOPs" />
        <p className="text-sm text-muted">You need SOP or lab manage permission.</p>
      </>
    );
  }

  return (
    <>
      <DelayedLoadingOverlay active={busy} />
      <PageHeader
        kicker="Stock"
        title="SOPs"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setFolderOpen(true)}>
              New folder
            </Button>
            <Button
              type="button"
              disabled={!currentFolderId}
              onClick={() => setUploadOpen(true)}
            >
              Upload PDF
            </Button>
          </div>
        }
      />
      <p className="mb-4 max-w-2xl text-sm text-muted">
        Organized like Drive. Upload PDF only — Word/Docs must be exported to PDF first. Files are
        stored zstd-compressed.
      </p>

      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        {breadcrumb.map((crumb, index) => (
          <span key={`${crumb.id ?? 'root'}-${crumb.name}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-muted">/</span> : null}
            <button
              type="button"
              className="underline-offset-2 hover:underline"
              onClick={() => {
                if (crumb.id === null) setFolderStack([]);
                else {
                  const at = folderStack.findIndex((row) => row.id === crumb.id);
                  if (at >= 0) setFolderStack(folderStack.slice(0, at + 1));
                }
              }}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </nav>

      <section className="mb-8">
        <Meta>Folders</Meta>
        <div className="mt-3">
          <DataTable
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (row) => (
                  <button
                    type="button"
                    className="underline-offset-2 hover:underline"
                    onClick={() => setFolderStack((stack) => [...stack, { id: row.id, name: row.name }])}
                  >
                    {row.name}
                  </button>
                ),
              },
              {
                id: 'counts',
                header: 'Contents',
                cell: (row) =>
                  `${row.childCount} folder${row.childCount === 1 ? '' : 's'} · ${row.fileCount} file${
                    row.fileCount === 1 ? '' : 's'
                  }`,
              },
              { id: 'status', header: 'Status', cell: (row) => row.status },
              {
                id: 'actions',
                header: '',
                cell: (row) => (
                  <div className="flex justify-end gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setRenameFolder(row)}>
                      Rename
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void onDeleteFolder(row)}>
                      Delete
                    </Button>
                  </div>
                ),
              },
            ]}
            rows={folders}
            loading={loadingFolders}
            emptyTitle={currentFolderId ? 'No subfolders' : 'No SOP folders'}
            emptyDescription={
              currentFolderId
                ? 'Create a subfolder or upload PDFs into this folder.'
                : 'Root folders are seeded from the Drive layout. You can add more.'
            }
          />
        </div>
      </section>

      {currentFolderId ? (
        <section>
          <Meta>Files</Meta>
          <div className="mt-3">
            <DataTable
              columns={[
                { id: 'title', header: 'Title', cell: (row) => row.title },
                { id: 'file', header: 'File', cell: (row) => row.originalFileName },
                {
                  id: 'size',
                  header: 'Size',
                  cell: (row) =>
                    `${formatBytes(row.originalSizeBytes)} → ${formatBytes(row.compressedSizeBytes)} zstd`,
                },
                {
                  id: 'actions',
                  header: '',
                  cell: (row) => (
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => void onPreview(row)}>
                        Preview
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setRenameFile(row)}>
                        Rename
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => void onDeleteFile(row)}>
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
              rows={files}
              loading={loadingFiles}
              emptyTitle="No PDFs in this folder"
              emptyDescription="Upload a PDF SOP for lab staff to preview from Inside lab recipes."
            />
          </div>
        </section>
      ) : (
        <p className="text-sm text-muted">Open a folder to manage PDF SOPs inside it.</p>
      )}

      <Dialog open={folderOpen} onOpenChange={setFolderOpen}>
        <DialogContent>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            {currentFolderId ? 'Creates a subfolder here.' : 'Creates a root SOP folder.'}
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onCreateFolder}>
            <div>
              <Label htmlFor="folder-name">Name</Label>
              <Input id="folder-name" name="name" required placeholder="e.g. Reagents SOPs" />
            </div>
            <Button type="submit" disabled={creatingFolder}>
              Create folder
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameFolder)} onOpenChange={(open) => !open && setRenameFolder(null)}>
        <DialogContent>
          <DialogTitle>Rename folder</DialogTitle>
          <form className="mt-4 space-y-4" onSubmit={onRenameFolder}>
            <div>
              <Label htmlFor="rename-folder">Name</Label>
              <Input
                id="rename-folder"
                name="name"
                required
                defaultValue={renameFolder?.name ?? ''}
              />
            </div>
            <Button type="submit" disabled={updatingFolder}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogTitle>Upload SOP PDF</DialogTitle>
          <DialogDescription>
            PDF only. The file is compressed with zstd before storage.
          </DialogDescription>
          <form className="mt-4 space-y-4" onSubmit={onUpload}>
            <div>
              <Label htmlFor="sop-title">Title (optional)</Label>
              <Input id="sop-title" name="title" placeholder="Defaults to file name" />
            </div>
            <div>
              <Label htmlFor="sop-file">PDF file</Label>
              <Input id="sop-file" name="file" type="file" accept="application/pdf,.pdf" required />
            </div>
            <Button type="submit" disabled={uploading}>
              Upload
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(renameFile)} onOpenChange={(open) => !open && setRenameFile(null)}>
        <DialogContent>
          <DialogTitle>Rename SOP</DialogTitle>
          <form className="mt-4 space-y-4" onSubmit={onRenameFile}>
            <div>
              <Label htmlFor="rename-file">Title</Label>
              <Input id="rename-file" name="title" required defaultValue={renameFile?.title ?? ''} />
            </div>
            <Button type="submit" disabled={updatingFile}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
