const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Start Python backend
function startBackend() {
    const pythonPath = path.join(__dirname, '../backend/venv/bin/python');
    const mainPy = path.join(__dirname, '../backend/main.py');

    backendProcess = spawn(pythonPath, [mainPy], {
        cwd: path.join(__dirname, '../backend'),
        env: { ...process.env }
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`[Backend] ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`[Backend Error] ${data}`);
    });

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
    });

    console.log('[Electron] Backend started');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'GravityQA - Mobile Testing Automation',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            webSecurity: false  // Disabled for dev
        },
        backgroundColor: '#0d1117',
        show: false
    });

    // Load from Vite dev server in development or built files in production
    const startURL = app.isPackaged
        ? `file://${path.join(__dirname, '../dist/index.html')}`
        : 'http://localhost:5173';

    mainWindow.loadURL(startURL);

    // Debug console messages
    mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log(`[Browser Console] ${message}`);
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    console.log('[Electron] App ready, starting backend...');
    startBackend();

    // Wait for backend to start
    setTimeout(() => {
        console.log('[Electron] Creating window...');
        createWindow();
    }, 3000);
});

app.on('window-all-closed', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
    app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// Cleanup on quit
app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
