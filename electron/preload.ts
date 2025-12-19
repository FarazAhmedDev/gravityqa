import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // App info
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),

    // File system operations
    uploadApp: (filePath: string) => ipcRenderer.invoke('upload-app', filePath),
    saveTestFile: (projectId: string, fileName: string, content: string) =>
        ipcRenderer.invoke('save-test-file', projectId, fileName, content),

    // Device operations
    getDevices: () => ipcRenderer.invoke('get-devices'),
    installApp: (deviceId: string, appId: string) =>
        ipcRenderer.invoke('install-app', deviceId, appId),

    // Test execution
    startTest: (testId: string) => ipcRenderer.invoke('start-test', testId),
    stopTest: (testId: string) => ipcRenderer.invoke('stop-test', testId),

    // Event listeners
    on: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (_, ...args) => callback(...args))
    },

    off: (channel: string, callback: (...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, callback)
    },
})
