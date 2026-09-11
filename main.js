const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const projectsDir = path.join(app.getPath('documents'), 'AI Desktop Builder Projects');

function ensureProjectsDir() {
  fs.mkdirSync(projectsDir, { recursive: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  ensureProjectsDir();
  ipcMain.handle('projects:list', () => {
    ensureProjectsDir();
    return fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
  });
  ipcMain.handle('project:save', (_, project) => {
    const safe = String(project.name || 'Untitled').replace(/[^a-zA-Z0-9_-]/g, '-');
    const dir = path.join(projectsDir, safe);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'app.json'), JSON.stringify(project, null, 2));
    fs.writeFileSync(path.join(dir, 'index.html'), project.html || '');
    return dir;
  });
  ipcMain.handle('dialog:open-project', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    if (result.canceled) return null;
    const file = path.join(result.filePaths[0], 'app.json');
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
