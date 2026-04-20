import { Grid3X3 } from 'lucide-react';
import { useDesktopStore } from '../store/useDesktopStore';
import SystemTray from './SystemTray';

export default function Taskbar() {
  const { windows, focusWindow, minimizeWindow, toggleLauncher } = useDesktopStore();

  return (
    <div className="glass-strong h-10 flex items-center px-3 gap-2 shrink-0">
      <button
        onClick={toggleLauncher}
        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent/20 text-accent transition-colors"
        title="App Launcher"
      >
        <Grid3X3 size={16} />
      </button>

      <div className="w-px h-5 bg-border/50 mx-1" />

      <div className="flex gap-1 flex-1 overflow-x-auto">
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => {
              if (win.isMinimized) {
                useDesktopStore.setState((s) => ({
                  windows: s.windows.map((w) =>
                    w.id === win.id ? { ...w, isMinimized: false } : w
                  ),
                }));
                focusWindow(win.id);
              } else if (win.isFocused) {
                minimizeWindow(win.id);
              } else {
                focusWindow(win.id);
              }
            }}
            className={`
              px-3 py-1 rounded-md text-xs font-medium max-w-[160px] truncate transition-colors
              ${win.isFocused && !win.isMinimized
                ? 'bg-accent/30 text-text'
                : 'text-text-muted hover:bg-surface-2/60 hover:text-text'
              }
              ${win.isMinimized ? 'opacity-50' : ''}
            `}
          >
            {win.title}
          </button>
        ))}
      </div>

      <SystemTray />
    </div>
  );
}
