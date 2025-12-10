const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    icon: path.join(__dirname, 'src/assets/icon.png'), // Optional: add app icon
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  });

  // Load from localhost (your Vite dev server)
  win.loadURL('http://localhost:5173');
  
  // Open DevTools automatically (optional, for debugging)
  // win.webContents.openDevTools();

  // Remove menu bar for cleaner look (optional)
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});