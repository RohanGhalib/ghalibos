import { useDesktopStore } from '../store/useDesktopStore';
import { AppId } from '../types/window';
import { FolderOpen, Settings, Sparkles, Terminal } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  FolderOpen: <FolderOpen size={32} />,
  Settings: <Settings size={32} />,
  Sparkles: <Sparkles size={32} />,
  Terminal: <Terminal size={32} />,
};

export default function AppLauncher() {
  const { appDefinitions, openApp } = useDesktopStore();

  return (
    <div className="absolute inset-x-0 bottom-16 flex justify-center z-[501] animate-slide-up pointer-events-auto">
      <div className="glass-strong rounded-2xl p-6 w-[480px] shadow-2xl">
        <h2 className="text-text text-sm font-semibold mb-4 opacity-60 uppercase tracking-widest">
          Applications
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {appDefinitions.map((app) => (
            <button
              key={app.id}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/20 transition-colors group"
              onClick={() => openApp(app.id as AppId)}
            >
              <span className="text-accent group-hover:scale-110 transition-transform">
                {ICON_MAP[app.icon]}
              </span>
              <span className="text-text text-xs font-medium">{app.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
