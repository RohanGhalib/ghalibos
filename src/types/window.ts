export type AppId = 'file-explorer' | 'settings' | 'ai-studio' | 'terminal';

export interface AppWindow {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  zIndex: number;
}

export interface AppDefinition {
  id: AppId;
  label: string;
  icon: string; // lucide icon name
  defaultSize: { width: number; height: number };
}
