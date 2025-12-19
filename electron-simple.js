const { app, BrowserWindow } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let backendProcess

function startBackend() {
    const pythonPath = path.join(__dirname, '../backend/venv/bin/python')
    const mainPy = path.join(__dirname, '../backend/main.py')

    backendProcess = spawn(pythonPath, [mainPy], {
        cwd: path.join(__dirname, '../backend')
    })

    backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`))
    backendProcess.stderr.on('data', (data) => console.error(`Backend: ${data}`))
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'GravityQA',
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    })

    // Load http://localhost:5173 initially
    // In production, you would load the built files
    mainWindow.loadURL('http://localhost:8000')

    mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    startBackend()
    setTimeout(createWindow, 3000) // Wait for backend
})

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill()
    app.quit()
})
