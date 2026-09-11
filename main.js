const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const projectsDir = path.join(app.getPath('documents'), 'AI Desktop Builder Projects');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_AI = { endpoint: 'http://127.0.0.1:8000/v1/chat/completions', model: 'Qwen/Qwen2.5-Coder-7B-Instruct', apiKey: '' };

function ensureProjectsDir() { fs.mkdirSync(projectsDir, { recursive: true }); }
function loadSettings() {
  try { return { ...DEFAULT_AI, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) }; }
  catch { return { ...DEFAULT_AI }; }
}
function saveSettings(settings) {
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify({ ...DEFAULT_AI, ...settings }, null, 2));
}
function safeName(name) { return String(name || 'Untitled').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'Untitled'; }

async function callLocalAI(prompt, settings) {
  const s = { ...loadSettings(), ...(settings || {}) };
  const system = `You are the code-generation engine inside AI Desktop Builder. Return ONLY valid JSON, no markdown fences. Schema: {"name":"string","files":[{"path":"relative/path","content":"full file content"}],"previewFile":"relative/path","notes":"string"}. Generate a complete runnable desktop-friendly web application from the user's request. Prefer plain HTML/CSS/JS with no external network dependency unless the user explicitly asks for a framework. Include all required files. Keep paths safe and relative. The previewFile must be an HTML file. Never include secrets.`;
  const body = { model: s.model, temperature: 0.15, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] };
  const headers = { 'Content-Type': 'application/json' };
  if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}`;
  const response = await fetch(s.endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`AI sunucusu HTTP ${response.status}: ${await response.text()}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('AI sunucusu boş yanıt verdi.');
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  const result = JSON.parse(clean);
  if (!Array.isArray(result.files) || !result.files.length) throw new Error('AI yanıtında dosya bulunamadı.');
  return result;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1500, height: 940, minWidth: 1180, minHeight: 720,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ensureProjectsDir();
  ipcMain.handle('projects:list', () => {
    ensureProjectsDir();
    return fs.readdirSync(projectsDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
  });
  ipcMain.handle('project:save', (_, project) => {
    const dir = path.join(projectsDir, safeName(project.name));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify(project, null, 2));
    const files = project.files || {};
    for (const [relative, content] of Object.entries(files)) {
      const target = path.resolve(dir, relative);
      if (!target.startsWith(path.resolve(dir) + path.sep)) continue;
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, String(content));
    }
    if (project.html && !files['index.html']) fs.writeFileSync(path.join(dir, 'index.html'), project.html);
    return dir;
  });
  ipcMain.handle('dialog:open-project', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    const file = path.join(result.filePaths[0], 'app.json');
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  });
  ipcMain.handle('ai:get-settings', () => loadSettings());
  ipcMain.handle('ai:set-settings', (_, settings) => { saveSettings(settings); return loadSettings(); });
  ipcMain.handle('ai:health', async (_, settings) => {
    const s = { ...loadSettings(), ...(settings || {}) };
    const base = s.endpoint.replace(/\/chat\/completions\/?$/, '');
    try {
      const headers = s.apiKey ? { Authorization: `Bearer ${s.apiKey}` } : {};
      const r = await fetch(`${base}/models`, { headers });
      return { ok: r.ok, status: r.status, detail: r.ok ? 'NVIDIA/local AI endpoint erişilebilir.' : await r.text() };
    } catch (e) { return { ok: false, detail: e.message }; }
  });
  ipcMain.handle('ai:generate', async (_, { prompt, settings }) => callLocalAI(prompt, settings));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
