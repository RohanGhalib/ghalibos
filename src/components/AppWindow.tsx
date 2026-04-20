import { Rnd } from 'react-rnd';
import { Maximize2, Square } from 'lucide-react';
import { useDesktopStore } from '../store/useDesktopStore';
import { AppWindow as AppWindowType } from '../types/window';
import FileExplorer from '../apps/FileExplorer';
import SettingsApp from '../apps/Settings';
import AIStudio from '../apps/AIStudio';
import TerminalApp from '../apps/Terminal';

interface Props {
  window: AppWindowType;
}

export default function AppWindow({ window: win }: Props) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, updateWindowPosition, updateWindowSize } =
    useDesktopStore();

  const renderApp = () => {
    switch (win.appId) {
      case 'file-explorer': return <FileExplorer />;
      case 'settings': return <SettingsApp />;
      case 'ai-studio': return <AIStudio />;
      case 'terminal': return <TerminalApp />;
      default: return <div className="p-4 text-text">Unknown App</div>;
    }
  };

  if (win.isMaximized) {
    return (
      <div
        className="absolute inset-0 flex flex-col glass-strong animate-fade-in"
        style={{ zIndex: win.zIndex }}
        onMouseDown={() => focusWindow(win.id)}
      >
        <WindowTitleBar win={win} onClose={() => closeWindow(win.id)} onMinimize={() => minimizeWindow(win.id)} onMaximize={() => maximizeWindow(win.id)} />
        <div className="flex-1 overflow-hidden">{renderApp()}</div>
      </div>
    );
  }

  return (
    <Rnd
      style={{ zIndex: win.zIndex }}
      size={{ width: win.width, height: win.height }}
      position={{ x: win.x, y: win.y }}
      minWidth={320}
      minHeight={240}
      dragHandleClassName="window-drag-handle"
      onDragStop={(_e, d) => updateWindowPosition(win.id, d.x, d.y)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        updateWindowSize(win.id, ref.offsetWidth, ref.offsetHeight);
        updateWindowPosition(win.id, pos.x, pos.y);
      }}
      onMouseDown={() => focusWindow(win.id)}
      bounds="parent"
    >
      <div
        className={`
          flex flex-col w-full h-full rounded-xl overflow-hidden glass-strong shadow-2xl
          animate-fade-in border
          ${win.isFocused ? 'border-accent/30' : 'border-border/30'}
        `}
      >
        <WindowTitleBar win={win} onClose={() => closeWindow(win.id)} onMinimize={() => minimizeWindow(win.id)} onMaximize={() => maximizeWindow(win.id)} />
        <div className="flex-1 overflow-hidden">{renderApp()}</div>
      </div>
    </Rnd>
  );
}

function WindowTitleBar({
  win,
  onClose,
  onMinimize,
  onMaximize,
}: {
  win: AppWindowType;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  return (
    <div className="window-drag-handle flex items-center px-3 h-9 bg-surface-2/80 shrink-0 cursor-grab active:cursor-grabbing">
      <div className="flex gap-1.5 mr-3">
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
          title="Close"
        />
        <button
          onClick={onMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
          title="Minimize"
        />
        <button
          onClick={onMaximize}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
          title="Maximize"
        />
      </div>

      <span className="flex-1 text-center text-text-muted text-xs font-medium truncate">
        {win.title}
      </span>

      <button onClick={onMaximize} className="text-text-muted hover:text-text transition-colors ml-2">
        {win.isMaximized ? <Square size={12} /> : <Maximize2 size={12} />}
      </button>
    </div>
  );
}
