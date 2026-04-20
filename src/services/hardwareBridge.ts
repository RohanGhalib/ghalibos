import { BatteryStatus, WiFiStatus, SystemInfo } from '../types/system';

const BASE = 'http://localhost:3001/api';

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) return fallback;
    return res.json() as Promise<T>;
  } catch {
    return fallback;
  }
}

export const fetchBattery = (): Promise<BatteryStatus> =>
  safeFetch(`${BASE}/battery`, { level: 78, isCharging: true, timeRemaining: null });

export const fetchWifi = (): Promise<WiFiStatus> =>
  safeFetch(`${BASE}/wifi`, { connected: true, ssid: 'GhalibNet-5G', strength: 82, isOnline: navigator.onLine });

export const fetchSystemInfo = (): Promise<SystemInfo> =>
  safeFetch(`${BASE}/system-info`, {
    hostname: 'ghalibos-pi5',
    arch: 'arm64',
    cpuUsage: 12,
    memUsed: 1.8 * 1024 * 1024 * 1024,
    memTotal: 8 * 1024 * 1024 * 1024,
    uptime: 3600,
  });
