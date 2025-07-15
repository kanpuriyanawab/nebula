// src/main.js
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { generateAppCode } = require('./mastraAgent'); // Import our Mastra agent logic

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null; // Reference to your main browser UI window

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200, // Make it a bit wider for a browser feel
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true // This is crucial to enable the <webview> tag in the renderer
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools(); // DevTools for your browser's UI

  // Listen for the main window being closed
  mainWindow.on('closed', () => {
    mainWindow = null; // Clear the reference
    app.quit(); // Quit the app entirely
  });
};

app.on('ready', createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// --- IPC Handlers ---

// This handler is now solely for generating the app code
ipcMain.handle('generate-app', async (event, prompt) => {
  try {
    const generatedHtml = await generateAppCode(prompt);
    return { success: true, html: generatedHtml };
  } catch (error) {
    console.error("Failed to generate app in main process:", error);
    return { success: false, error: error.message };
  }
});

// No more IPC for create-tab, close-tab, activate-tab, load-url, navigate
// These will all be handled directly in renderer.js using webview APIs.