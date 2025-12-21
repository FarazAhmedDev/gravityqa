import { app, BrowserWindow } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null
let backendProcess: ChildProcess | null = null

// Check and install dependencies
function setupBackend(backendPath: string, pythonPath: string) {
    return new Promise<void>((resolve) => {
        console.log('Checking backend dependencies...')

        const requirementsPath = path.join(backendPath, 'requirements.txt')

        // Install pip packages
        const pipInstall = spawn(pythonPath, ['-m', 'pip', 'install', '-r', requirementsPath], {
            cwd: backendPath,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        })

        pipInstall.stdout?.on('data', (data) => {
            console.log(`[Setup] ${data}`)
        })

        pipInstall.stderr?.on('data', (data) => {
            console.error(`[Setup Error] ${data}`)
        })

        pipInstall.on('close', (code) => {
            if (code === 0) {
                console.log('Dependencies installed successfully')

                // Install Playwright browsers
                const playwrightInstall = spawn(pythonPath, ['-m', 'playwright', 'install'], {
                    cwd: backendPath,
                    env: { ...process.env, PYTHONUNBUFFERED: '1' }
                })

                playwrightInstall.stdout?.on('data', (data) => {
                    console.log(`[Playwright Setup] ${data}`)
                })

                playwrightInstall.on('close', (playwrightCode) => {
                    if (playwrightCode === 0) {
                        console.log('Playwright browsers installed')
                        resolve()
                    } else {
                        console.warn('Playwright install failed, but continuing...')
                        resolve() // Continue even if playwright install fails
                    }
                })
            } else {
                console.warn('Pip install had errors, but continuing...')
                resolve() // Continue even if some packages fail
            }
        })
    })
}

// Start Python backend
async function startBackend() {
    const backendPath = isDev
        ? path.join(__dirname, '../../backend')
        : path.join(process.resourcesPath, 'backend')

    const pythonPath = isDev
        ? path.join(backendPath, 'venv/bin/python')
        : path.join(backendPath, 'venv/bin/python')

    const mainPy = path.join(backendPath, 'main.py')

    // Run setup first
    try {
        await setupBackend(backendPath, pythonPath)
    } catch (error) {
        console.error('Setup failed:', error)
    }

    console.log('Starting backend:', pythonPath, mainPy)

    backendProcess = spawn(pythonPath, [mainPy], {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
    })

    backendProcess.stdout?.on('data', (data) => {
        console.log(`[Backend] ${data}`)
    })

    backendProcess.stderr?.on('data', (data) => {
        console.error(`[Backend Error] ${data}`)
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
