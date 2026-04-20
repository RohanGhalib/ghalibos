const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

app.get('/api/battery', (_req, res) => {
  res.json({
    level: Math.round(70 + Math.random() * 20),
    isCharging: true,
    timeRemaining: null,
  });
});

app.get('/api/wifi', (_req, res) => {
  res.json({
    connected: true,
    ssid: 'GhalibNet-5G',
    strength: Math.round(75 + Math.random() * 20),
    isOnline: true,
  });
});

app.get('/api/usb', (_req, res) => {
  res.json({
    devices: [
      { id: 'sda1', label: 'USB Drive (32GB)', size: 32 * 1024 * 1024 * 1024, mountPoint: '/mnt/usb0' },
    ],
  });
});

app.get('/api/system-info', (_req, res) => {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const cpuUsage = Math.round(5 + Math.random() * 40);

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
