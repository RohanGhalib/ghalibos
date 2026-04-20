import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, AlertTriangle, Code2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  component?: string;
}

const DEMO_COMPONENTS: Record<string, string> = {
  default: `
<!DOCTYPE html>
<html>
<head>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { 
    font-family: -apple-system, sans-serif; 
    background: #0f172a; 
    color: #e2e8f0; 
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  h2 { font-size: 14px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .card { background: rgba(30,41,59,0.8); border: 1px solid rgba(51,65,85,0.5); border-radius: 12px; padding: 16px; }
  .metric { display: flex; justify-content: space-between; align-items: center; margin: 8px 0; }
  .bar-container { width: 120px; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
  .bar { height: 100%; background: #6366f1; border-radius: 3px; transition: width 0.5s; }
  .value { font-size: 12px; color: #94a3b8; }
  .big { font-size: 28px; font-weight: 700; color: #6366f1; }
</style>
</head>
<body>
<h2>⚡ CPU Monitor Widget</h2>
<div class="card">
  <div class="metric">
    <span>Core 0</span>
    <div style="display:flex;align-items:center;gap:8px">
      <div class="bar-container"><div class="bar" id="c0" style="width:34%"></div></div>
      <span class="value" id="c0v">34%</span>
    </div>
  </div>
  <div class="metric">
    <span>Core 1</span>
    <div style="display:flex;align-items:center;gap:8px">
      <div class="bar-container"><div class="bar" id="c1" style="width:12%"></div></div>
      <span class="value" id="c1v">12%</span>
    </div>
  </div>
  <div class="metric">
    <span>Core 2</span>
    <div style="display:flex;align-items:center;gap:8px">
      <div class="bar-container"><div class="bar" id="c2" style="width:78%"></div></div>
      <span class="value" id="c2v">78%</span>
    </div>
  </div>
  <div class="metric">
    <span>Core 3</span>
    <div style="display:flex;align-items:center;gap:8px">
      <div class="bar-container"><div class="bar" id="c3" style="width:45%"></div></div>
      <span class="value" id="c3v">45%</span>
    </div>
  </div>
</div>
<div class="card" style="text-align:center">
  <div class="big" id="avg">42%</div>
  <div class="value">Average CPU Load</div>
</div>
<script>
  const cores = [
    {bar: document.getElementById('c0'), val: document.getElementById('c0v')},
    {bar: document.getElementById('c1'), val: document.getElementById('c1v')},
    {bar: document.getElementById('c2'), val: document.getElementById('c2v')},
    {bar: document.getElementById('c3'), val: document.getElementById('c3v')},
  ];
  const avg = document.getElementById('avg');
  function update() {
    let total = 0;
    cores.forEach(c => {
      const v = Math.round(Math.random() * 100);
      total += v;
      c.bar.style.width = v + '%';
      c.val.textContent = v + '%';
    });
    avg.textContent = Math.round(total/4) + '%';
  }
  setInterval(update, 1200);
</script>
</body>
</html>
`,
  clock: `
<!DOCTYPE html>
<html>
<head>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#020617; display:flex; align-items:center; justify-content:center; height:100vh; font-family:monospace; }
  .clock { color:#34d399; font-size:48px; font-weight:700; text-shadow: 0 0 20px #34d399; }
  .date { color:#6ee7b7; font-size:14px; text-align:center; margin-top:8px; }
</style>
</head>
<body>
<div>
  <div class="clock" id="c">00:00:00</div>
  <div class="date" id="d"></div>
</div>
<script>
  function update() {
    const n = new Date();
    document.getElementById('c').textContent = n.toLocaleTimeString();
    document.getElementById('d').textContent = n.toDateString();
  }
  update();
  setInterval(update, 1000);
</script>
</body>
</html>
`,
};

function generateComponent(prompt: string): { text: string; html: string } {
  const lower = prompt.toLowerCase();
  if (lower.includes('cpu') || lower.includes('monitor') || lower.includes('usage')) {
    return {
      text: "Here's a real-time **CPU Monitor widget** rendered in a secure sandboxed iframe. It simulates live per-core CPU usage with animated progress bars.",
      html: DEMO_COMPONENTS.default,
    };
  }
  if (lower.includes('clock') || lower.includes('time')) {
    return {
      text: "Here's a **live clock widget** with a terminal aesthetic, running isolated in a WASM/iframe sandbox.",
      html: DEMO_COMPONENTS.clock,
    };
  }
  return {
    text: `I can generate UI components for: **CPU Monitor**, **Clock Widget**, and more. Try: *"Build me a CPU monitor widget"* or *"Show me a clock"*.\n\nNote: All AI-generated components execute in a strict iframe sandbox with \`sandbox="allow-scripts"\` — no access to the parent OS shell.`,
    html: '',
  };
}

export default function AIStudio() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content:
        "I'm the **GhalibOS AI Studio** — a generative UI engine. I can write React/HTML components on the fly and mount them directly into the OS.\n\n**Security**: All generated code runs in a strict `sandbox=\"allow-scripts\"` iframe — isolated from the OS shell and hardware APIs.\n\nTry: *\"Build me a CPU monitor widget\"*",
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsThinking(true);

    await new Promise((r) => setTimeout(r, 800));

    const { text, html } = generateComponent(input);
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: text,
      component: html || undefined,
    };
    setMessages((m) => [...m, assistantMsg]);
    setIsThinking(false);
  };

  return (
    <div className="flex flex-col h-full text-text text-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border-b border-yellow-500/20 shrink-0">
        <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
        <span className="text-yellow-300 text-xs">
          AI-generated code runs in a strict <code className="font-mono">sandbox="allow-scripts"</code> iframe — no DOM access to OS shell
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`
                max-w-[85%] rounded-2xl px-4 py-3 space-y-3
                ${msg.role === 'user'
                  ? 'bg-accent/30 rounded-br-sm'
                  : 'glass rounded-bl-sm'}
              `}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 text-accent text-xs font-medium mb-1">
                  <Sparkles size={12} />
                  <span>AI Studio</span>
                </div>
              )}
              <p className="text-text leading-relaxed whitespace-pre-wrap">
                {msg.content.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </p>

              {msg.component && (
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5">
                    <Code2 size={11} />
                    <span>Generated component (sandboxed)</span>
                  </div>
                  <iframe
                    title="AI Generated Component"
                    srcDoc={msg.component}
                    sandbox="allow-scripts"
                    className="w-full rounded-xl border border-border/30 bg-[#0f172a]"
                    style={{ height: '260px' }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5 text-accent text-xs font-medium mb-2">
                <Sparkles size={12} className="animate-pulse" />
                <span>Generating component…</span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="px-3 pb-3 shrink-0">
        <div className="glass rounded-xl flex items-end gap-2 p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder='Try: "Build me a CPU monitor widget"'
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-text placeholder-text-muted text-sm"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isThinking}
            className="p-2 rounded-lg bg-accent hover:bg-accent/80 disabled:opacity-40 text-white transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
