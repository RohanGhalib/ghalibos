import { create } from 'zustand';
import { VFSNode, PendingOperation, VFSSource } from '../types/vfs';
import { enqueueOperation, drainQueue } from '../services/offlineQueue';
import { mockDriveList } from '../services/driveApi';

const ROOT_ID = 'root';

const INITIAL_NODES: VFSNode[] = [
  {
    id: ROOT_ID,
    name: 'root',
    type: 'folder',
    source: 'drive',
    parentId: null,
    modifiedAt: Date.now(),
    children: ['cloud-docs', 'cloud-media', 'usb-drive-1'],
  },
  {
    id: 'cloud-docs',
    name: 'Documents',
    type: 'folder',
    source: 'drive',
    parentId: ROOT_ID,
    modifiedAt: Date.now() - 3600000,
    children: ['doc-1', 'doc-2'],
  },
  {
    id: 'cloud-media',
    name: 'Media',
    type: 'folder',
    source: 'drive',
    parentId: ROOT_ID,
    modifiedAt: Date.now() - 7200000,
    children: ['img-1'],
  },
  {
    id: 'usb-drive-1',
    name: 'USB Drive (32GB)',
    type: 'folder',
    source: 'usb',
    parentId: ROOT_ID,
    modifiedAt: Date.now() - 600000,
    children: ['usb-file-1'],
  },
  {
    id: 'doc-1',
    name: 'Architecture Notes.md',
    type: 'file',
    source: 'drive',
    parentId: 'cloud-docs',
    size: 4096,
    mimeType: 'text/markdown',
    modifiedAt: Date.now() - 3600000,
    driveId: 'drive-abc-123',
  },
  {
    id: 'doc-2',
    name: 'GhalibOS Roadmap.pdf',
    type: 'file',
    source: 'drive',
    parentId: 'cloud-docs',
    size: 204800,
    mimeType: 'application/pdf',
    modifiedAt: Date.now() - 86400000,
    driveId: 'drive-abc-124',
  },
  {
    id: 'img-1',
    name: 'wallpaper.jpg',
    type: 'file',
    source: 'drive',
    parentId: 'cloud-media',
    size: 5242880,
    mimeType: 'image/jpeg',
    modifiedAt: Date.now() - 172800000,
    driveId: 'drive-abc-125',
  },
  {
    id: 'usb-file-1',
    name: 'backup.tar.gz',
    type: 'file',
    source: 'usb',
    parentId: 'usb-drive-1',
    size: 1073741824,
    mimeType: 'application/gzip',
    modifiedAt: Date.now() - 600000,
  },
];

interface VFSState {
  nodes: Record<string, VFSNode>;
  currentPath: string[];
  isOnline: boolean;
  pendingOps: PendingOperation[];
  isLoading: boolean;

  navigateTo: (nodeId: string) => void;
  navigateUp: () => void;
  navigateToRoot: () => void;
  createFolder: (parentId: string, name: string) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  syncDrive: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  getChildNodes: (nodeId: string) => VFSNode[];
  getCurrentNode: () => VFSNode | null;
  getBreadcrumbs: () => VFSNode[];
}

const buildNodeMap = (nodes: VFSNode[]): Record<string, VFSNode> =>
  Object.fromEntries(nodes.map((n) => [n.id, n]));

export const useVFSStore = create<VFSState>((set, get) => ({
  nodes: buildNodeMap(INITIAL_NODES),
  currentPath: [ROOT_ID],
  isOnline: navigator.onLine,
  pendingOps: [],
  isLoading: false,

  navigateTo: (nodeId) => {
    const node = get().nodes[nodeId];
    if (!node || node.type !== 'folder') return;
    const currentPath = get().currentPath;
    const idx = currentPath.indexOf(nodeId);
    if (idx !== -1) {
      set({ currentPath: currentPath.slice(0, idx + 1) });
    } else {
      set({ currentPath: [...currentPath, nodeId] });
    }
  },

  navigateUp: () => {
    const path = get().currentPath;
    if (path.length > 1) {
      set({ currentPath: path.slice(0, -1) });
    }
  },

  navigateToRoot: () => set({ currentPath: [ROOT_ID] }),

  createFolder: async (parentId, name) => {
    const id = `folder-${Date.now()}`;
    const newNode: VFSNode = {
      id,
      name,
      type: 'folder',
      source: get().isOnline ? 'drive' : 'local',
      parentId,
      modifiedAt: Date.now(),
      children: [],
    };

    set((s) => {
      const parent = s.nodes[parentId];
      if (!parent) return s;
      return {
        nodes: {
          ...s.nodes,
          [id]: newNode,
          [parentId]: {
            ...parent,
            children: [...(parent.children ?? []), id],
          },
        },
      };
    });

    if (!get().isOnline) {
      const op: PendingOperation = {
        id: `op-${Date.now()}`,
        type: 'create',
        nodeId: id,
        payload: { name, parentId, type: 'folder' },
        timestamp: Date.now(),
      };
      await enqueueOperation(op);
      set((s) => ({ pendingOps: [...s.pendingOps, op] }));
    }
  },

  deleteNode: async (nodeId) => {
    set((s) => {
      const node = s.nodes[nodeId];
      if (!node) return s;
      const newNodes = { ...s.nodes };
      if (node.parentId && newNodes[node.parentId]) {
        newNodes[node.parentId] = {
          ...newNodes[node.parentId],
          children: (newNodes[node.parentId].children ?? []).filter(
            (c) => c !== nodeId
          ),
        };
      }
      delete newNodes[nodeId];
      return { nodes: newNodes };
    });

    if (!get().isOnline) {
      const op: PendingOperation = {
        id: `op-${Date.now()}`,
        type: 'delete',
        nodeId,
        payload: {},
        timestamp: Date.now(),
      };
      await enqueueOperation(op);
      set((s) => ({ pendingOps: [...s.pendingOps, op] }));
    }
  },

  syncDrive: async () => {
    if (!get().isOnline) return;
    set({ isLoading: true });
    try {
      const driveNodes = await mockDriveList();
      const sourceVal: VFSSource = 'drive';
      set((s) => {
        const merged = { ...s.nodes };
        driveNodes.forEach((n) => {
          merged[n.id] = { ...n, source: sourceVal };
        });
        return { nodes: merged };
      });
      const drained = await drainQueue();
      if (drained.length > 0) {
        set({ pendingOps: [] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setOnlineStatus: (online) => {
    set({ isOnline: online });
    if (online) get().syncDrive();
  },

  getChildNodes: (nodeId) => {
    const { nodes } = get();
    const node = nodes[nodeId];
    if (!node || !node.children) return [];
    return node.children.map((id) => nodes[id]).filter(Boolean) as VFSNode[];
  },

  getCurrentNode: () => {
    const { nodes, currentPath } = get();
    const id = currentPath[currentPath.length - 1];
    return nodes[id] ?? null;
  },

  getBreadcrumbs: () => {
    const { nodes, currentPath } = get();
    return currentPath.map((id) => nodes[id]).filter(Boolean) as VFSNode[];
  },
}));
