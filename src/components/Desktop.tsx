import { useEffect } from 'react';
import { useDesktopStore } from '../store/useDesktopStore';
import { useSystemStore } from '../store/useSystemStore';
import { useThemeStore } from '../store/useThemeStore';
import { useVFSStore } from '../store/useVFSStore';
import Taskbar from './Taskbar';
import AppWindow from './AppWindow';
import Dock from './Dock';
import AppLauncher from './AppLauncher';

export default function Desktop() {
  const windows = useDesktopStore((s) => s.windows);
  const startPolling = useSystemStore((s) => s.startPolling);
  const stopPolling = useSystemStore((s) => s.stopPolling);
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const setOnlineStatus = useVFSStore((s) => s.setOnlineStatus);
  const isLauncherOpen = useDesktopStore((s) => s.isLauncherOpen);
  const toggleLauncher = useDesktopStore((s) => s.toggleLauncher);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      activeTheme === 'dark' ? '' : activeTheme
    );
  }, [activeTheme]);

  useEffect(() => {
    const onOnline = () => setOnlineStatus(true);
    const onOffline = () => setOnlineStatus(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnlineStatus]);

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden select-none"
      style={{ background: 'var(--wallpaper)' }}
    >
      <div className="flex-1 relative">
        {windows
          .filter((w) => !w.isMinimized)
          .map((win) => (
            <AppWindow key={win.id} window={win} />
          ))}

        {isLauncherOpen && (
          <div
            className="absolute inset-0 z-[500]"
            onClick={toggleLauncher}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <AppLauncher />
            </div>
          </div>
        )}
      </div>

      <Dock />
      <Taskbar />
    </div>
  );
}
