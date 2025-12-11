
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const nodemailer = require('nodemailer');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "SVS School Management",
    backgroundColor: '#f8fafc', // Match the app background to prevent white flash
    icon: path.join(__dirname, 'public/favicon.ico'), // Ensure you have a favicon
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Allows using node modules in renderer if needed
      webSecurity: false // sometimes needed for local file access in older setups
    },
  });

  // Remove the menu bar for a cleaner app look
  win.setMenuBarVisibility(false);
  
  // Maximize the window for a full application feel
  win.maximize();

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

// IPC Handler to get App Paths
ipcMain.handle('get-app-paths', () => {
  return {
    userData: app.getPath('userData'),
    temp: app.getPath('temp'),
    documents: app.getPath('documents')
  };
});

// IPC Handler for Sending Email via Nodemailer
ipcMain.handle('send-email', async (event, { smtpConfig, mailOptions }) => {
  if (!smtpConfig || !mailOptions) {
    return { success: false, error: "Missing configuration" };
  }

  console.log("---------------------------------------------------");
  console.log(`[SMTP] Attempting to send email via: ${smtpConfig.host}:${smtpConfig.port}`);
  console.log(`[SMTP] User: ${smtpConfig.user}`);
  
  try {
    const port = parseInt(smtpConfig.port);
    
    // Config tuned for Gmail/Outlook/Standard SMTP
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: port,
      // secure: true for 465, false for other ports.
      // Note: STARTTLS will be upgraded automatically for 587 if server supports it.
      secure: port === 465, 
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      tls: {
        // Helpful for local/dev environments or self-signed certs
        rejectUnauthorized: false
      },
      // Increase timeouts to avoid ETIMEDOUT on slow connections
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    console.log("[SMTP] Verifying connection...");
    // Verify connection config
    await transporter.verify();
    console.log("[SMTP] Connection verified successfully.");

    console.log("[SMTP] Sending mail...");
    const info = await transporter.sendMail({
      from: `"${smtpConfig.senderName || 'School Admin'}" <${smtpConfig.fromEmail || smtpConfig.user}>`,
      ...mailOptions
    });

    console.log("[SMTP] Email sent successfully:", info.messageId);
    console.log("---------------------------------------------------");
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[SMTP] Email send failed:", error);
    console.log("---------------------------------------------------");
    // Return detailed error message to renderer
    // We pass JSON.stringify(error) to ensure all enumerable properties (like 'code', 'command') are sent
    return { success: false, error: error.message || "Unknown SMTP Error", details: JSON.parse(JSON.stringify(error)) };
  }
});

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
