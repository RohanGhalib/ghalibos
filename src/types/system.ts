export interface BatteryStatus {
  level: number;      // 0-100
  isCharging: boolean;
  timeRemaining: number | null; // minutes
}

export interface WiFiStatus {
  connected: boolean;
  ssid: string | null;
  strength: number;   // 0-100
  isOnline: boolean;
}

export interface USBDevice {
  id: string;
  label: string;
  size: number;       // bytes
  mountPoint: string;
}

export interface SystemInfo {
  hostname: string;
  arch: string;
  cpuUsage: number;   // 0-100
  memUsed: number;    // bytes
  memTotal: number;   // bytes
  uptime: number;     // seconds
}
