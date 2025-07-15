// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  generateApp: (prompt) => ipcRenderer.invoke('generate-app', prompt)
  // Removed browser-specific IPC calls as they are now handled by webview in renderer
});