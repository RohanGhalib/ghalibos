const express = require('express');
const cors = require('cors');
const os = require('os');
const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const CPU_SAMPLE_INTERVAL_MS = 150;
const LINUX_WIRELESS_MAX_LINK_QUALITY = 70;

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readCpuSnapshot() {
  return os.cpus().map((cpu) => {
    const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
    return { idle: cpu.times.idle, total };
  });
}

async function getCpuUsagePercent() {
  const start = readCpuSnapshot();
  await sleep(CPU_SAMPLE_INTERVAL_MS);
  const end = readCpuSnapshot();

  let totalDelta = 0;
  let idleDelta = 0;

  for (let i = 0; i < Math.min(start.length, end.length); i += 1) {
    totalDelta += end[i].total - start[i].total;
    idleDelta += end[i].idle - start[i].idle;
  }

  if (totalDelta <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((totalDelta - idleDelta) / totalDelta) * 100)));
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readText(filePath) {
  return (await fs.readFile(filePath, 'utf8')).trim();
}

async function getLinuxBatteryStatus() {
  const basePath = '/sys/class/power_supply';
  if (!(await fileExists(basePath))) return null;

  const entries = await fs.readdir(basePath);
  for (const entry of entries) {
    const entryPath = path.join(basePath, entry);
    const typePath = path.join(entryPath, 'type');
    const type = (await fileExists(typePath)) ? await readText(typePath) : '';
    if (type.toLowerCase() !== 'battery' && !entry.toUpperCase().startsWith('BAT')) continue;

    const capacityPath = path.join(entryPath, 'capacity');
    const statusPath = path.join(entryPath, 'status');

    if (!(await fileExists(capacityPath))) continue;
    const level = Number.parseInt(await readText(capacityPath), 10);
    if (!Number.isFinite(level)) continue;

    const status = (await fileExists(statusPath)) ? (await readText(statusPath)).toLowerCase() : '';
    const isCharging = status.includes('charging');

    let timeRemaining = null;
    const energyNowPath = path.join(entryPath, 'energy_now');
    const powerNowPath = path.join(entryPath, 'power_now');
    const chargeNowPath = path.join(entryPath, 'charge_now');
    const currentNowPath = path.join(entryPath, 'current_now');

    try {
      if ((await fileExists(energyNowPath)) && (await fileExists(powerNowPath))) {
        const energyNow = Number.parseFloat(await readText(energyNowPath));
        const powerNow = Number.parseFloat(await readText(powerNowPath));
        if (Number.isFinite(energyNow) && Number.isFinite(powerNow) && powerNow > 0) {
          timeRemaining = Math.max(0, Math.round((energyNow / powerNow) * 60));
        }
      } else if ((await fileExists(chargeNowPath)) && (await fileExists(currentNowPath))) {
        const chargeNow = Number.parseFloat(await readText(chargeNowPath));
        const currentNow = Number.parseFloat(await readText(currentNowPath));
        if (Number.isFinite(chargeNow) && Number.isFinite(currentNow) && currentNow > 0) {
          timeRemaining = Math.max(0, Math.round((chargeNow / currentNow) * 60));
        }
      }
    } catch {
      timeRemaining = null;
    }

    return { level, isCharging, timeRemaining };
  }

  return null;
}

async function getMacBatteryStatus() {
  try {
    const { stdout } = await execFileAsync('pmset', ['-g', 'batt']);
    const levelMatch = stdout.match(/(\d+)%/);
    if (!levelMatch) return null;
    const level = Number.parseInt(levelMatch[1], 10);
    const lower = stdout.toLowerCase();
    const isCharging = lower.includes('charging') || lower.includes('charged');
    return { level, isCharging, timeRemaining: null };
  } catch {
    return null;
  }
}

async function getBatteryStatus() {
  const linux = await getLinuxBatteryStatus().catch(() => null);
  if (linux) return linux;
  const mac = await getMacBatteryStatus().catch(() => null);
  if (mac) return mac;
  return { level: 0, isCharging: false, timeRemaining: null };
}

function parseLinuxWirelessStrength(raw) {
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const ifaceLine = lines.find((line) => line.includes(':'));
  if (!ifaceLine) return null;
  const colonIndex = ifaceLine.indexOf(':');
  if (colonIndex < 0) return null;

  const ifaceName = ifaceLine.slice(0, colonIndex).trim();
  const rawMetrics = ifaceLine.slice(colonIndex + 1).trim();
  if (!ifaceName || !rawMetrics) return null;

  const metricsParts = rawMetrics.split(/\s+/).filter(Boolean);
  if (metricsParts.length === 0) return null;
  const rawLinkQuality = metricsParts[0];
  const linkQuality = Number.parseFloat(rawLinkQuality);
  if (!Number.isFinite(linkQuality)) return null;
  return Math.max(
    0,
    Math.min(100, Math.round((linkQuality / LINUX_WIRELESS_MAX_LINK_QUALITY) * 100))
  );
}

async function hasDefaultRoute() {
  try {
    const { stdout } = await execFileAsync('ip', ['route']);
    return stdout.split('\n').some((line) => line.startsWith('default '));
  } catch {
    return Object.values(os.networkInterfaces())
      .flat()
      .some((iface) => iface && !iface.internal);
  }
}

async function getWifiStatus() {
  let connected = false;
  let ssid = null;
  let strength = 0;

  try {
    const { stdout } = await execFileAsync('nmcli', ['-t', '-f', 'ACTIVE,SSID,SIGNAL', 'dev', 'wifi']);
    const activeLine = stdout
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.startsWith('yes:'));
    if (activeLine) {
      const parts = activeLine.split(':');
      connected = true;
      ssid = parts[1] ? parts[1] : null;
      const signal = Number.parseInt(parts[2] || '0', 10);
      strength = Number.isFinite(signal) ? Math.max(0, Math.min(100, signal)) : 0;
    }
  } catch {
    try {
      const { stdout: iwgetidOut } = await execFileAsync('iwgetid', ['-r']);
      const maybeSsid = iwgetidOut.trim();
      if (maybeSsid) {
        connected = true;
        ssid = maybeSsid;
      }
      const wirelessOut = await readText('/proc/net/wireless');
      const parsedStrength = parseLinuxWirelessStrength(wirelessOut);
      if (parsedStrength !== null) strength = parsedStrength;
    } catch {
      connected = false;
      ssid = null;
      strength = 0;
    }
  }

  const isOnline = await hasDefaultRoute();
  return { connected, ssid, strength, isOnline };
}

app.get('/api/battery', async (_req, res) => {
  const battery = await getBatteryStatus();
  res.json(battery);
});

app.get('/api/wifi', async (_req, res) => {
  const wifi = await getWifiStatus();
  res.json(wifi);
});

app.get('/api/usb', (_req, res) => {
  res.json({
    devices: [
      { id: 'sda1', label: 'USB Drive (32GB)', size: 32 * 1024 * 1024 * 1024, mountPoint: '/mnt/usb0' },
    ],
  });
});

app.get('/api/system-info', async (_req, res) => {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const cpuUsage = await getCpuUsagePercent();

  res.json({
    hostname: os.hostname(),
    arch: os.arch(),
    cpuUsage,
    memUsed: memTotal - memFree,
    memTotal,
    uptime: os.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`[GhalibOS Hardware Bridge] Listening on http://localhost:${PORT}`);
  console.log('Endpoints: /api/battery  /api/wifi  /api/usb  /api/system-info');
});
