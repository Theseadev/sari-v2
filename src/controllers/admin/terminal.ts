// src/controllers/admin/terminal.ts — Web Terminal (super_admin only)

import type { Context } from "hono";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { esc, getUser } from "../../helpers";
import { adminLayout } from "../../views/admin/helpers";

const execAsync = promisify(exec);

// Hanya command aman yang boleh dijalankan
const ALLOWED_COMMANDS: Record<string, string> = {
	"git status": "Cek status Git",
	"git pull": "Pull update terbaru",
	"git log --oneline -10": "Lihat 10 commit terakhir",
	"git branch": "Lihat branch",
	"npm install": "Install dependencies",
	"npm run build": "Build aplikasi",
	"node --version": "Cek versi Node",
	"npm --version": "Cek versi npm",
	"git --version": "Cek versi Git",
	"df -h": "Cek disk usage",
	"uptime": "Cek uptime server",
	"date": "Cek waktu server",
	"cat package.json | grep version": "Cek versi aplikasi",
};

const WORK_DIR = process.cwd();

export async function terminalPage(c: Context) {
	const user = getUser(c);
	if (!user || user.roleName !== "super_admin") {
		return c.redirect("/admin");
	}

	const commandList = Object.entries(ALLOWED_COMMANDS)
		.map(([cmd, desc]) => `<option value="${esc(cmd)}">${esc(desc)} — <code>${esc(cmd)}</code></option>`)
		.join("\n");

	const body = `
<style>
  .term-wrap {
    background: #0f172a;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    border: 1px solid #1e293b;
  }
  .term-header {
    background: #1e293b;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #334155;
  }
  .term-dots {
    display: flex;
    gap: 8px;
  }
  .term-dots span {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .term-dots span:nth-child(1) { background: #ef4444; }
  .term-dots span:nth-child(2) { background: #eab308; }
  .term-dots span:nth-child(3) { background: #22c55e; }
  .term-title {
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 500;
  }
  .term-body {
    padding: 20px;
    min-height: 250px;
    max-height: 250px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #475569 #0f172a;
  }
  .term-body::-webkit-scrollbar { width: 6px; }
  .term-body::-webkit-scrollbar-track { background: #0f172a; }
  .term-body::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
  .term-line {
    margin-bottom: 8px;
    line-height: 1.6;
  }
  .term-prompt {
    color: #22c55e;
  }
  .term-cmd {
    color: #f1f5f9;
    font-weight: 600;
  }
  .term-output {
    color: #94a3b8;
    white-space: pre-wrap;
    word-break: break-all;
  }
  .term-error {
    color: #f87171;
  }
  .term-success {
    color: #4ade80;
  }
  .term-controls {
    padding: 16px 20px;
    background: #1e293b;
    border-top: 1px solid #334155;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .term-top-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .term-input-wrap {
    flex: 1;
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .term-prompt-symbol {
    color: #22c55e;
    font-weight: 700;
    font-size: 1rem;
  }
  .term-input {
    flex: 1;
    padding: 10px 14px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }
  .term-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
  .term-input::placeholder {
    color: #475569;
  }
  .term-controls select {
    min-width: 180px;
    padding: 10px 14px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 10px;
    color: #e2e8f0;
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
  }
  .term-controls select:focus {
    outline: none;
    border-color: #6366f1;
  }
  .term-bottom-row {
    display: flex;
    gap: 10px;
  }
  .term-btn {
    padding: 10px 24px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    white-space: nowrap;
  }
  .term-btn:hover {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  }
  .term-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .term-btn.danger {
    background: #dc2626;
  }
  .term-btn.danger:hover {
    background: #b91c1c;
  }
  .term-welcome {
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #1e293b;
  }
  .term-welcome strong {
    color: #94a3b8;
  }
  .term-spinner {
    display: inline-block;
    width: 14px;
    height: 14px;
    border: 2px solid #475569;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: termSpin 0.6s linear infinite;
    vertical-align: middle;
    margin-right: 8px;
  }
  @keyframes termSpin {
    to { transform: rotate(360deg); }
  }
</style>

<div class="term-wrap">
  <div class="term-header">
    <div class="term-dots"><span></span><span></span><span></span></div>
    <span class="term-title">SARI Terminal — ${esc(user.name)}</span>
  </div>
  <div class="term-body" id="termBody">
    <div class="term-welcome">
      <strong>SARI System Terminal</strong><br>
      Ketik perintah langsung atau pilih dari shortcut dropdown.
    </div>
  </div>
  <div class="term-controls">
    <div class="term-top-row">
      <div class="term-input-wrap">
        <span class="term-prompt-symbol">$</span>
        <input type="text" class="term-input" id="termInput" placeholder="Ketik perintah... (Enter untuk jalankan)" autocomplete="off" spellcheck="false">
      </div>
      <select id="termSelect" title="Shortcut perintah">
        <option value="">— Shortcut —</option>
        ${commandList}
      </select>
    </div>
    <div class="term-bottom-row">
      <button class="term-btn" id="termRun" onclick="runCommand()">▶ Jalankan</button>
      <button class="term-btn danger" onclick="clearTerminal()">Clear</button>
    </div>
  </div>
</div>

<script>
const termBody = document.getElementById('termBody');
const termInput = document.getElementById('termInput');
const termSelect = document.getElementById('termSelect');
const termRun = document.getElementById('termRun');

let history = [];
let historyIdx = -1;

function appendLine(html) {
  const div = document.createElement('div');
  div.className = 'term-line';
  div.innerHTML = html;
  termBody.appendChild(div);
  termBody.scrollTop = termBody.scrollHeight;
}

function getCommand() {
  // Dropdown优先，否则用input
  return termSelect.value || termInput.value.trim();
}

async function runCommand() {
  const cmd = getCommand();
  if (!cmd) return;

  // Simpan ke history
  history.unshift(cmd);
  if (history.length > 50) history.pop();
  historyIdx = -1;

  termRun.disabled = true;
  termRun.innerHTML = '<span class="term-spinner"></span> Running...';

  appendLine('<span class="term-prompt">$</span> <span class="term-cmd">' + escHtml(cmd) + '</span>');

  try {
    const res = await fetch('/admin/terminal/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({ command: cmd })
    });

    const data = await res.json();

    if (data.ok) {
      appendLine('<span class="term-output">' + escHtml(data.stdout || '(no output)') + '</span>');
      if (data.stderr) {
        appendLine('<span class="term-error">' + escHtml(data.stderr) + '</span>');
      }
      appendLine('<span class="term-success">✓ Selesai</span>');
    } else {
      appendLine('<span class="term-error">✗ ' + escHtml(data.error || 'Gagal') + '</span>');
    }
  } catch (e) {
    appendLine('<span class="term-error">✗ Koneksi gagal</span>');
  }

  termRun.disabled = false;
  termRun.innerHTML = '▶ Jalankan';
  termInput.value = '';
  termSelect.value = '';
  termInput.focus();
}

function clearTerminal() {
  termBody.innerHTML = '';
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// Enter untuk jalankan
termInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    runCommand();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (history.length > 0 && historyIdx < history.length - 1) {
      historyIdx++;
      termInput.value = history[historyIdx];
    }
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx > 0) {
      historyIdx--;
      termInput.value = history[historyIdx];
    } else {
      historyIdx = -1;
      termInput.value = '';
    }
  }
});

// Dropdown pilih → isi input
termSelect.addEventListener('change', () => {
  if (termSelect.value) {
    termInput.value = termSelect.value;
    termInput.focus();
  }
});
</script>
`;

	return c.html(adminLayout("Terminal", body, { name: user.name, roleName: user.roleName }, "terminal"));
}

export async function execCommand(c: Context) {
	const user = getUser(c);
	if (!user || user.roleName !== "super_admin") {
		return c.json({ ok: false, error: "Akses ditolak" }, 403);
	}

	const body = await c.req.json<{ command?: string }>();
	const cmd = body.command?.trim();

	if (!cmd || !(cmd in ALLOWED_COMMANDS)) {
		return c.json({ ok: false, error: "Command tidak diizinkan" }, 400);
	}

	try {
		const { stdout, stderr } = await execAsync(cmd, {
			cwd: WORK_DIR,
			timeout: 30000, // 30 detik max
			maxBuffer: 1024 * 512, // 512KB
		});

		return c.json({
			ok: true,
			stdout: stdout.toString().slice(0, 10000), // Limit output
			stderr: stderr.toString().slice(0, 5000),
		});
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		return c.json({ ok: false, error: msg.slice(0, 1000) });
	}
}
