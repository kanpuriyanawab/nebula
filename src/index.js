const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { generateAppCode } = require('./mastraAgent'); // Import our Mastra agent logic

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200, 
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true 
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.openDevTools(); 

  mainWindow.on('closed', () => {
    mainWindow = null; 
    app.quit(); 
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


ipcMain.handle('generate-app', async (event, prompt) => {
  try {
    const generatedHtml = await generateAppCode(prompt);
    return { success: true, html: generatedHtml };
  } catch (error) {
    console.error("Failed to generate app in main process:", error);
    return { success: false, error: error.message };
  }
});
