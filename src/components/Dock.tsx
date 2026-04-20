import { useDesktopStore } from '../store/useDesktopStore';
import { AppId } from '../types/window';
import { FolderOpen, Settings, Sparkles, Terminal } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  FolderOpen: <FolderOpen size={24} />,
  Settings: <Settings size={24} />,
  Sparkles: <Sparkles size={24} />,
  Terminal: <Terminal size={24} />,
};

export default function Dock() {
  const { appDefinitions, windows, openApp } = useDesktopStore();

  return (
    <div className="flex justify-center pb-1 pointer-events-none">
      <div className="glass rounded-2xl px-3 py-2 flex gap-2 pointer-events-auto shadow-xl mb-1">
        {appDefinitions.map((app) => {
          const isOpen = windows.some((w) => w.appId === app.id && !w.isMinimized);
          const isActive = windows.some((w) => w.appId === app.id && w.isFocused);
          return (
            <button
              key={app.id}
              title={app.label}
              onClick={() => openApp(app.id as AppId)}
              className={`
                relative flex items-center justify-center w-12 h-12 rounded-xl
                transition-all duration-150 hover:scale-110 active:scale-95
                ${isActive ? 'bg-accent/30' : 'hover:bg-surface-2/60'}
              `}
            >
              <span className="text-text">{ICON_MAP[app.icon]}</span>
              {isOpen && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
