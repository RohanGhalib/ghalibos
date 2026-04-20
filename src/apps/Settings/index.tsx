import { useSystemStore } from '../../store/useSystemStore';
import { useThemeStore, THEMES } from '../../store/useThemeStore';
import { useVFSStore } from '../../store/useVFSStore';
import {
  Battery,
  BatteryCharging,
  Wifi,
  Monitor,
  Cloud,
  Shield,
} from 'lucide-react';

function formatBytes(b: number): string {
  return `${(b / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatUptime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Settings() {
  const { battery, wifi, systemInfo } = useSystemStore();
  const { activeTheme, setTheme } = useThemeStore();
  const { isOnline, pendingOps } = useVFSStore();

  const BattIcon = battery.isCharging ? BatteryCharging : Battery;
  const memPercent = Math.round((systemInfo.memUsed / systemInfo.memTotal) * 100);

  return (
    <div className="h-full overflow-y-auto text-text text-sm p-4 space-y-6">
      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Monitor size={12} /> System
        </h2>
        <div className="glass rounded-xl divide-y divide-border/20">
          <Row label="Hostname" value={systemInfo.hostname} />
          <Row label="Architecture" value={systemInfo.arch} />
          <Row label="Uptime" value={formatUptime(systemInfo.uptime)} />
          <Row label="CPU Usage">
            <ProgressBar value={systemInfo.cpuUsage} color="accent" />
          </Row>
          <Row label={`Memory (${formatBytes(systemInfo.memUsed)} / ${formatBytes(systemInfo.memTotal)})`}>
            <ProgressBar value={memPercent} color={memPercent > 80 ? 'red' : 'accent'} />
          </Row>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <BattIcon size={12} /> Power
        </h2>
        <div className="glass rounded-xl divide-y divide-border/20">
          <Row label="Battery Level">
            <ProgressBar
              value={battery.level}
              color={battery.level > 50 ? 'green' : battery.level > 20 ? 'yellow' : 'red'}
            />
          </Row>
          <Row label="Status" value={battery.isCharging ? 'Charging ⚡' : 'On Battery'} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Wifi size={12} /> Network
        </h2>
        <div className="glass rounded-xl divide-y divide-border/20">
          <Row label="Status" value={wifi.connected ? `Connected (${wifi.ssid})` : 'Disconnected'} />
          {wifi.connected && (
            <Row label="Signal Strength">
              <ProgressBar value={wifi.strength} color="accent" />
            </Row>
          )}
          <Row label="Online" value={isOnline ? '✓ Yes' : '✗ No'} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Cloud size={12} /> Cloud VFS
        </h2>
        <div className="glass rounded-xl divide-y divide-border/20">
          <Row label="Drive Status" value={isOnline ? 'Synced' : 'Offline Mode'} />
          <Row label="Pending Ops" value={String(pendingOps.length)} />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Monitor size={12} /> Appearance
        </h2>
        <div className="glass rounded-xl p-4">
          <p className="text-text-muted text-xs mb-3">OS Theme</p>
          <div className="flex gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`
                  flex flex-col items-center gap-2 p-2 rounded-xl transition-all
                  ${activeTheme === theme.id ? 'ring-2 ring-accent scale-105' : 'opacity-70 hover:opacity-100'}
                `}
              >
                <div
                  className="w-14 h-10 rounded-lg border border-border/30"
                  style={{ background: theme.preview }}
                />
                <span className="text-xs text-text">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={12} /> Security
        </h2>
        <div className="glass rounded-xl divide-y divide-border/20">
          <Row label="AI Sandbox" value="WASM / iframe (allow-scripts only)" />
          <Row label="PWA Installs" value="Manifest + bridge.js model" />
          <Row label="XSS Mitigation" value="Strict CSP enforced" />
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-4">
      <span className="text-text-muted shrink-0">{label}</span>
      {value ? <span className="text-text font-medium text-right">{value}</span> : children}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  const colorClass = {
    accent: 'bg-accent',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }[color] ?? 'bg-accent';

  return (
    <div className="flex items-center gap-2">
      <div className="w-32 h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-text">{value}%</span>
    </div>
  );
}
