import { useState } from 'react';
import {
  FolderOpen,
  Folder,
  FileText,
  Image,
  Archive,
  Cloud,
  Usb,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Home,
} from 'lucide-react';
import { useVFSStore } from '../../store/useVFSStore';
import { VFSNode } from '../../types/vfs';

function FileIcon({ node }: { node: VFSNode }) {
  if (node.type === 'folder') {
    if (node.source === 'drive') return <Cloud size={18} className="text-blue-400" />;
    if (node.source === 'usb') return <Usb size={18} className="text-yellow-400" />;
    return <Folder size={18} className="text-text-muted" />;
  }
  if (node.mimeType?.startsWith('image/')) return <Image size={18} className="text-purple-400" />;
  if (node.mimeType?.includes('pdf') || node.mimeType?.includes('text'))
    return <FileText size={18} className="text-text-muted" />;
  if (node.mimeType?.includes('zip') || node.mimeType?.includes('gzip'))
    return <Archive size={18} className="text-orange-400" />;
  return <FileText size={18} className="text-text-muted" />;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function FileExplorer() {
  const {
    getChildNodes,
    getCurrentNode,
    getBreadcrumbs,
    navigateTo,
    navigateUp,
    navigateToRoot,
    createFolder,
    deleteNode,
    syncDrive,
    isOnline,
    pendingOps,
    isLoading,
  } = useVFSStore();

  const [selected, setSelected] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const currentNode = getCurrentNode();
  const breadcrumbs = getBreadcrumbs();
  const children = currentNode ? getChildNodes(currentNode.id) : [];

  const handleCreate = async () => {
    if (!currentNode || !newFolderName.trim()) return;
    await createFolder(currentNode.id, newFolderName.trim());
    setIsCreating(false);
    setNewFolderName('');
  };

  return (
    <div className="flex flex-col h-full text-text text-sm">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-surface/40 shrink-0">
        <button onClick={navigateToRoot} className="p-1.5 rounded hover:bg-surface-2/60 text-text-muted hover:text-text transition-colors" title="Home">
          <Home size={14} />
        </button>
        <button onClick={navigateUp} className="p-1.5 rounded hover:bg-surface-2/60 text-text-muted hover:text-text transition-colors" title="Up">
          <ChevronRight size={14} className="rotate-180" />
        </button>

        <div className="flex items-center gap-1 flex-1 overflow-x-auto">
          {breadcrumbs.map((node, i) => (
            <span key={node.id} className="flex items-center gap-1 text-xs">
              {i > 0 && <ChevronRight size={10} className="text-text-muted" />}
              <button
                onClick={() => navigateTo(node.id)}
                className="hover:text-accent transition-colors truncate max-w-[120px]"
              >
                {node.name === 'root' ? '~' : node.name}
              </button>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {pendingOps.length > 0 && (
            <span className="text-xs text-yellow-400 mr-1">{pendingOps.length} pending</span>
          )}
          {!isOnline && (
            <span className="text-xs text-orange-400 mr-1">Offline</span>
          )}
          <button
            onClick={syncDrive}
            disabled={!isOnline || isLoading}
            className="p-1.5 rounded hover:bg-surface-2/60 text-text-muted hover:text-text transition-colors disabled:opacity-40"
            title="Sync Drive"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setSelected(null); setIsCreating(true); }}
            className="p-1.5 rounded hover:bg-surface-2/60 text-text-muted hover:text-text transition-colors"
            title="New Folder"
          >
            <Plus size={14} />
          </button>
          {selected && (
            <button
              onClick={() => { deleteNode(selected); setSelected(null); }}
              className="p-1.5 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isCreating && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-accent/10 animate-fade-in">
            <Folder size={16} className="text-accent shrink-0" />
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(''); }
              }}
              placeholder="Folder name…"
              className="flex-1 bg-transparent outline-none text-text text-sm"
            />
            <button onClick={handleCreate} className="text-xs text-accent hover:underline">Create</button>
            <button onClick={() => { setIsCreating(false); setNewFolderName(''); }} className="text-xs text-text-muted hover:underline">Cancel</button>
          </div>
        )}

        {children.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center h-full text-text-muted gap-2">
            <FolderOpen size={40} className="opacity-30" />
            <p className="text-sm">Empty folder</p>
          </div>
        )}

        <table className="w-full">
          <thead className="sticky top-0 bg-surface/90">
            <tr className="text-text-muted text-xs border-b border-border/20">
              <th className="text-left py-1.5 px-3 font-medium">Name</th>
              <th className="text-left py-1.5 px-3 font-medium hidden sm:table-cell">Source</th>
              <th className="text-right py-1.5 px-3 font-medium hidden sm:table-cell">Size</th>
              <th className="text-right py-1.5 px-3 font-medium hidden md:table-cell">Modified</th>
            </tr>
          </thead>
          <tbody>
            {children.map((node) => (
              <tr
                key={node.id}
                onClick={() => setSelected(node.id === selected ? null : node.id)}
                onDoubleClick={() => node.type === 'folder' && navigateTo(node.id)}
                className={`
                  cursor-pointer transition-colors border-b border-border/10
                  ${selected === node.id ? 'bg-accent/20' : 'hover:bg-surface-2/40'}
                `}
              >
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <FileIcon node={node} />
                    <span className="truncate max-w-[200px]">{node.name}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-text-muted capitalize hidden sm:table-cell">
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${node.source === 'drive' ? 'bg-blue-500/10 text-blue-400' : ''}
                    ${node.source === 'usb' ? 'bg-yellow-500/10 text-yellow-400' : ''}
                    ${node.source === 'local' ? 'bg-gray-500/10 text-gray-400' : ''}
                  `}>
                    {node.source}
                  </span>
                </td>
                <td className="py-2 px-3 text-text-muted text-right hidden sm:table-cell">
                  {node.type === 'folder' ? '—' : formatSize(node.size)}
                </td>
                <td className="py-2 px-3 text-text-muted text-right text-xs hidden md:table-cell">
                  {new Date(node.modifiedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
