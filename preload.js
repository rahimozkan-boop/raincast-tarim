const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopBuilder', {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  saveProject: project => ipcRenderer.invoke('project:save', project),
  openProject: () => ipcRenderer.invoke('dialog:open-project')
});
