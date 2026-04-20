import { Battery, BatteryCharging, Wifi, WifiOff } from 'lucide-react';
import { useSystemStore } from '../store/useSystemStore';
import { useVFSStore } from '../store/useVFSStore';
import { useState, useEffect } from 'react';

export default function SystemTray() {
  const battery = useSystemStore((s) => s.battery);
  const wifi = useSystemStore((s) => s.wifi);
  const pendingOps = useVFSStore((s) => s.pendingOps);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const BattIcon = battery.isCharging ? BatteryCharging : Battery;
  const battColor =
    battery.level > 50 ? 'text-green-400' : battery.level > 20 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="flex items-center gap-3 text-text-muted text-xs">
      {pendingOps.length > 0 && (
        <span className="text-yellow-400 font-medium" title={`${pendingOps.length} ops pending sync`}>
          ↑{pendingOps.length}
        </span>
      )}

      <span title={wifi.connected ? `${wifi.ssid} (${wifi.strength}%)` : 'Disconnected'}>
        {wifi.connected ? (
          <Wifi size={14} className="text-text-muted" />
        ) : (
          <WifiOff size={14} className="text-red-400" />
        )}
      </span>

      <span className={`flex items-center gap-1 ${battColor}`} title={`${battery.level}%`}>
        <BattIcon size={14} />
        <span>{battery.level}%</span>
      </span>

      <div className="flex flex-col items-end leading-tight">
        <span className="text-text font-medium">{timeStr}</span>
        <span className="text-[10px]">{dateStr}</span>
      </div>
    </div>
  );
}
