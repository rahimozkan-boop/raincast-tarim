const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopBuilder', {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  saveProject: project => ipcRenderer.invoke('project:save', project),
  openProject: () => ipcRenderer.invoke('dialog:open-project'),
  getAISettings: () => ipcRenderer.invoke('ai:get-settings'),
  setAISettings: settings => ipcRenderer.invoke('ai:set-settings', settings),
  checkAI: settings => ipcRenderer.invoke('ai:health', settings),
  generate: (prompt, settings) => ipcRenderer.invoke('ai:generate', { prompt, settings })
});
