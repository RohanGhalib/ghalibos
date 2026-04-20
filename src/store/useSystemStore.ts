import { create } from 'zustand';
import { BatteryStatus, WiFiStatus, SystemInfo } from '../types/system';
import { fetchBattery, fetchWifi, fetchSystemInfo } from '../services/hardwareBridge';

interface SystemState {
  battery: BatteryStatus;
  wifi: WiFiStatus;
  systemInfo: SystemInfo;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
}

const DEFAULT_BATTERY: BatteryStatus = { level: 78, isCharging: true, timeRemaining: null };
const DEFAULT_WIFI: WiFiStatus = { connected: true, ssid: 'GhalibNet-5G', strength: 82, isOnline: true };
const DEFAULT_SYS: SystemInfo = {
  hostname: 'ghalibos-pi5',
  arch: 'arm64',
  cpuUsage: 12,
  memUsed: 1.8 * 1024 * 1024 * 1024,
  memTotal: 8 * 1024 * 1024 * 1024,
  uptime: 3600,
};

let pollInterval: ReturnType<typeof setInterval> | null = null;

export const useSystemStore = create<SystemState>((set) => ({
  battery: DEFAULT_BATTERY,
  wifi: DEFAULT_WIFI,
  systemInfo: DEFAULT_SYS,
  isPolling: false,

  startPolling: () => {
    if (pollInterval) return;
    set({ isPolling: true });

    const poll = async () => {
      const [battery, wifi, systemInfo] = await Promise.all([
        fetchBattery().catch(() => DEFAULT_BATTERY),
        fetchWifi().catch(() => DEFAULT_WIFI),
        fetchSystemInfo().catch(() => DEFAULT_SYS),
      ]);
      set({ battery, wifi, systemInfo });
    };

    poll();
    pollInterval = setInterval(poll, 5000);
  },

  stopPolling: () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    set({ isPolling: false });
  },
}));
