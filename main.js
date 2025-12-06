const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "SVS School Management",
    icon: path.join(__dirname, 'public/favicon.ico'), // Ensure you have a favicon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows using node modules in renderer if needed
      webSecurity: false // sometimes needed for local file access in older setups, safer to keep true usually but false helps with local images
    },
  });

  // Remove the menu bar for a cleaner app look
  win.setMenuBarVisibility(false);

  // In production, load the local bundle file.
  // In development, load localhost.
  if (isDev) {
    // Vite default port
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // Make sure to load the index.html from the dist folder (Vite output)
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Open external links (like WhatsApp) in the default browser, not the Electron window
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});