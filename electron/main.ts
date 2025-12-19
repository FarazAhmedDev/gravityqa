import { app, BrowserWindow } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let backendProcess: ChildProcess | null = null

// Start Python backend
function startBackend() {
    const backendPath = isDev
        ? path.join(__dirname, '../../backend')
        : path.join(process.resourcesPath, 'backend')

    const pythonPath = isDev
        ? path.join(backendPath, 'venv/bin/python')
        : path.join(backendPath, 'venv/bin/python')

    const mainPy = path.join(backendPath, 'main.py')

    console.log('Starting backend:', pythonPath, mainPy)

    backendProcess = spawn(pythonPath, [mainPy], {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
    })

    backendProcess.stdout?.on('data', (data) => {
        console.log(`Backend: ${data}`)
    })

    backendProcess.stderr?.on('data', (data) => {
        console.error(`Backend Error: ${data}`)
    })

    backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`)
    })
}

// Stop backend
function stopBackend() {
    if (backendProcess) {
        backendProcess.kill()
        backendProcess = null
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        title: 'GravityQA - AI-Native Test Automation',
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#0f172a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    // Wait for backend to start (3 seconds)
    setTimeout(() => {
        if (isDev) {
            mainWindow?.loadURL('http://localhost:5173')
            mainWindow?.webContents.openDevTools()
        } else {
            mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'))
        }
    }, 3000)

    mainWindow.on('closed', () => {
        mainWindow = null
    })
}

app.whenReady().then(() => {
    // Start backend first
    startBackend()

    // Then create window
    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    stopBackend()
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('before-quit', () => {
    stopBackend()
})

// Handle errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error)
})
