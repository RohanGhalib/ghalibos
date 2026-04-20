import { VFSNode } from '../types/vfs';

/**
 * Mock Google Drive API list.
 */
export async function mockDriveList(): Promise<VFSNode[]> {
  await new Promise((r) => setTimeout(r, 400));

  return [
    {
      id: 'drive-synced-1',
      name: 'Synced from Drive.txt',
      type: 'file',
      source: 'drive',
      parentId: 'cloud-docs',
      size: 1024,
      mimeType: 'text/plain',
      modifiedAt: Date.now(),
      driveId: 'drive-synced-1',
    },
  ];
}

/**
 * Create a file on Google Drive.
 */
export async function driveCreateFile(
  name: string,
  parentDriveId: string,
  content: Blob
): Promise<string> {
  await new Promise((r) => setTimeout(r, 300));
  console.info('[DriveAPI] createFile', { name, parentDriveId, size: content.size });
  return `drive-new-${Date.now()}`;
}

/**
 * Delete a file from Google Drive.
 */
export async function driveDeleteFile(driveId: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 200));
  console.info('[DriveAPI] deleteFile', { driveId });
}
