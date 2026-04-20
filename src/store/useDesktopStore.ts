import { create } from 'zustand';
import { AppWindow, AppId, AppDefinition } from '../types/window';

const APP_DEFINITIONS: AppDefinition[] = [
  { id: 'file-explorer', label: 'Files', icon: 'FolderOpen', defaultSize: { width: 800, height: 560 } },
  { id: 'settings', label: 'Settings', icon: 'Settings', defaultSize: { width: 680, height: 500 } },
  { id: 'ai-studio', label: 'AI Studio', icon: 'Sparkles', defaultSize: { width: 800, height: 620 } },
  { id: 'terminal', label: 'Terminal', icon: 'Terminal', defaultSize: { width: 700, height: 460 } },
];

let zCounter = 100;

interface DesktopState {
  windows: AppWindow[];
  appDefinitions: AppDefinition[];
  isLauncherOpen: boolean;
  openApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  toggleLauncher: () => void;
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  appDefinitions: APP_DEFINITIONS,
  isLauncherOpen: false,

  openApp: (appId) => {
    const def = APP_DEFINITIONS.find((d) => d.id === appId);
    if (!def) return;

    // Bring existing window to front if already open
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === existing.id ? { ...w, isMinimized: false } : w
        ),
      }));
      return;
    }

    const id = `${appId}-${Date.now()}`;
    const newWindow: AppWindow = {
      id,
      appId,
      title: def.label,
      x: 60 + get().windows.length * 24,
      y: 40 + get().windows.length * 24,
      width: def.defaultSize.width,
      height: def.defaultSize.height,
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      zIndex: ++zCounter,
    };

    set((s) => ({
      windows: [
        ...s.windows.map((w) => ({ ...w, isFocused: false })),
        newWindow,
      ],
      isLauncherOpen: false,
    }));
  },

  closeWindow: (id) =>
    set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => ({
        ...w,
        isFocused: w.id === id,
        zIndex: w.id === id ? ++zCounter : w.zIndex,
      })),
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w
      ),
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
      ),
    })),

  updateWindowPosition: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  updateWindowSize: (id, width, height) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, width, height } : w)),
    })),

  toggleLauncher: () =>
    set((s) => ({ isLauncherOpen: !s.isLauncherOpen })),
}));
