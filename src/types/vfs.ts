export type VFSNodeType = 'file' | 'folder';
export type VFSSource = 'local' | 'drive' | 'usb';

export interface VFSNode {
  id: string;
  name: string;
  type: VFSNodeType;
  source: VFSSource;
  parentId: string | null;
  size?: number;        // bytes
  mimeType?: string;
  modifiedAt: number;   // unix ms
  children?: string[];  // child IDs (for folders)
  driveId?: string;     // Google Drive file ID
  localPath?: string;
  isOfflineCached?: boolean;
}

export interface PendingOperation {
  id: string;
  type: 'create' | 'rename' | 'delete' | 'move';
  nodeId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}
