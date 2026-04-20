import { useState, useRef, useEffect } from 'react';
import { useVFSStore } from '../../store/useVFSStore';
import { useSystemStore } from '../../store/useSystemStore';

interface TermLine {
  type: 'input' | 'output' | 'error';
  text: string;
}

const BANNER = [
  '  ██████╗ ██╗  ██╗ █████╗ ██╗     ██╗██████╗  ██████╗ ███████╗',
  ' ██╔════╝ ██║  ██║██╔══██╗██║     ██║██╔══██╗██╔═══██╗██╔════╝',
  ' ██║  ███╗███████║███████║██║     ██║██████╔╝██║   ██║███████╗',
  ' ██║   ██║██╔══██║██╔══██║██║     ██║██╔══██╗██║   ██║╚════██║',
  ' ╚██████╔╝██║  ██║██║  ██║███████╗██║██████╔╝╚██████╔╝███████║',
  '  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝╚═════╝  ╚═════╝ ╚══════╝',
  '',
  '  Web-Native OS Shell v0.1.0 — ARM64 / Wayland / React',
  '  Type "help" for available commands.',
  '',
];

export default function Terminal() {
  const [lines, setLines] = useState<TermLine[]>(
    BANNER.map((t) => ({ type: 'output' as const, text: t }))
  );
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { nodes, currentPath, navigateTo, navigateUp } = useVFSStore();
  const { systemInfo, battery, wifi } = useSystemStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [lines]);

  const pwd = () => {
    const parts = currentPath.map((id) => {
      const n = nodes[id];
      return n?.name === 'root' ? '~' : n?.name ?? id;
    });
    return parts.join('/');
  };

  const prompt = `ghalibos@${systemInfo.hostname}:${pwd()} $ `;

  const processCommand = (cmd: string): string[] => {
    const [base, ...args] = cmd.trim().split(/\s+/);
    switch (base) {
      case 'help':
        return [
          'Available commands:',
          '  help          — Show this message',
          '  ls            — List files in current directory',
          '  cd <name>     — Change directory',
          '  pwd           — Print working directory',
          '  uname         — System information',
          '  free          — Memory usage',
          '  battery       — Battery status',
          '  wifi          — Network status',
          '  clear         — Clear terminal',
          '  echo <text>   — Echo text',
        ];
      case 'ls': {
        const id = currentPath[currentPath.length - 1];
        const node = nodes[id];
        if (!node?.children) return ['(empty)'];
        return node.children.map((cid) => {
          const c = nodes[cid];
          if (!c) return cid;
          return c.type === 'folder' ? `📁 ${c.name}/` : `📄 ${c.name}`;
        });
      }
      case 'pwd':
        return [pwd()];
      case 'cd': {
        const target = args[0];
        if (!target || target === '~') {
          useVFSStore.getState().navigateToRoot();
          return [];
        }
        if (target === '..') {
          navigateUp();
          return [];
        }
        const id = currentPath[currentPath.length - 1];
        const node = nodes[id];
        const child = (node?.children ?? []).map((cid) => nodes[cid]).find(
          (c) => c?.name === target && c.type === 'folder'
        );
        if (child) {
          navigateTo(child.id);
          return [];
        }
        return [`cd: ${target}: No such directory`];
      }
      case 'uname':
        return [
          `GhalibOS v0.1.0 ${systemInfo.arch} — ${systemInfo.hostname}`,
          `Uptime: ${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m`,
          `Kernel: Linux 6.x (Wayland / wlroots)`,
        ];
      case 'free':
        return [
          `Memory: ${(systemInfo.memUsed / 1e9).toFixed(1)}GB / ${(systemInfo.memTotal / 1e9).toFixed(1)}GB`,
          `Usage:  ${Math.round((systemInfo.memUsed / systemInfo.memTotal) * 100)}%`,
        ];
      case 'battery':
        return [
          `Level:  ${battery.level}%`,
          `Status: ${battery.isCharging ? 'Charging ⚡' : 'On Battery'}`,
        ];
      case 'wifi':
        return [
          `Status: ${wifi.connected ? 'Connected' : 'Disconnected'}`,
          wifi.ssid ? `SSID:   ${wifi.ssid}` : '',
          `Signal: ${wifi.strength}%`,
        ].filter(Boolean) as string[];
      case 'echo':
        return [args.join(' ')];
      case 'clear':
        setLines([]);
        return [];
      case '':
        return [];
      default:
        return [`${base}: command not found (this is a web-native OS — no native binaries)`];
    }
  };

  const submit = () => {
    const cmd = inputVal;
    setInputVal('');
    setHistoryIdx(-1);

    const newLines: TermLine[] = [{ type: 'input', text: `${prompt}${cmd}` }];
    const output = processCommand(cmd);
    output.forEach((t) => newLines.push({ type: 'output', text: t }));
    setLines((l) => [...l, ...newLines]);
    if (cmd.trim()) setHistory((h) => [cmd, ...h.slice(0, 49)]);
  };

  return (
    <div
      className="flex flex-col h-full bg-black/80 font-mono text-sm cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`
              whitespace-pre text-xs leading-5
              ${line.type === 'input' ? 'text-green-400' : ''}
              ${line.type === 'output' ? 'text-gray-300' : ''}
              ${line.type === 'error' ? 'text-red-400' : ''}
            `}
          >
            {line.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center px-3 py-2 border-t border-gray-800 shrink-0">
        <span className="text-green-400 text-xs whitespace-nowrap mr-1">{prompt}</span>
        <input
          ref={inputRef}
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
            if (e.key === 'ArrowUp') {
              const idx = Math.min(historyIdx + 1, history.length - 1);
              setHistoryIdx(idx);
              setInputVal(history[idx] ?? '');
            }
            if (e.key === 'ArrowDown') {
              const idx = Math.max(historyIdx - 1, -1);
              setHistoryIdx(idx);
              setInputVal(idx === -1 ? '' : history[idx] ?? '');
            }
          }}
          className="flex-1 bg-transparent outline-none text-green-400 text-xs caret-green-400"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
