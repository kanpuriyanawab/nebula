const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateApp: (prompt) => ipcRenderer.invoke('generate-app', prompt)
});

