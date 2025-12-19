import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import AppSelector from './AppSelector'

interface Device {
    id: number
    device_id: string
    name: string
    platform: string
    is_connected: boolean
}

interface RecordedAction {
    step: number
    action: string
    x?: number
    y?: number
    description: string
    screenshot?: string
    timestamp: number
}

interface InstalledApp {
    package_name: string
    app_name: string
    version: string
    activity: string  // NEW: Detected activity
    apk_path: string
}

export default function Inspector() {
    // Device & APK state
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [apkFile, setApkFile] = useState<File | null>(null)
    const [installedApp, setInstalledApp] = useState<InstalledApp | null>(null)
    const [showAppSelector, setShowAppSelector] = useState(false)

    // Session state
    const [sessionActive, setSessionActive] = useState(false)
    const [screenshot, setScreenshot] = useState<string>('')

    // Recording state
    const [isRecording, setIsRecording] = useState(false)
    const [actions, setActions] = useState<RecordedAction[]>([])

    // UI state
    const [status, setStatus] = useState<string>('Select device to begin')
    const [isUploading, setIsUploading] = useState(false)
    const [isLaunching, setIsLaunching] = useState(false)
    const [installProgress, setInstallProgress] = useState(0)
    const [installStatus, setInstallStatus] = useState('')
    const [isChecking, setIsChecking] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    // Load installed app from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('installed_app')
        if (saved) {
            setInstalledApp(JSON.parse(saved))
        }
    }, [])

    // Auto-check APK when selected
    const handleAPKSelection = async (file: File | null) => {
        if (!file || !selectedDevice) return

        setApkFile(file)
        setIsChecking(true)
        setStatus('Checking if app already installed...')

        const formData = new FormData()
        formData.append('apk', file)

        try {
            const res = await axios.post(
                `http://localhost:8000/api/check-apk/${selectedDevice.device_id}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )

            const { already_installed, package_name, app_name, version, activity } = res.data

            if (already_installed) {
                // App exists - show popup
                const userChoice = confirm(
                    `✅ "${app_name}" is already installed on device!\n\n` +
                    `Package: ${package_name}\n` +
                    `Version: ${version}\n\n` +
                    `Do you want to:\n` +
                    `• Click OK to RE-INSTALL (fresh copy)\n` +
                    `• Click Cancel to USE EXISTING (skip install)`
                )

                if (!userChoice) {
                    // User chose to use existing app
                    const appData: InstalledApp = {
                        package_name,
                        app_name,
                        version,
                        activity,
                        apk_path: res.data.apk_path
                    }
                    setInstalledApp(appData)
                    localStorage.setItem('installed_app', JSON.stringify(appData))
                    setStatus(`✅ Using existing: ${app_name}`)
                } else {
                    setStatus(`Ready to re-install: ${app_name}`)
                }
            } else {
                // App doesn't exist
                setStatus(`📲 Ready to install: ${app_name}`)
            }
        } catch (error: any) {
            console.error('Check failed:', error)
            setStatus('⚠️ Check failed - you can still try installing')
        } finally {
            setIsChecking(false)
        }
    }

    // WebSocket for installation progress
    useEffect(() => {
        if (!selectedDevice || !isUploading) return

        const ws = new WebSocket('ws://localhost:8000/ws/realtime')

        ws.onopen = () => {
            console.log('[WebSocket] Connected for installation progress')
        }

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)

            if (data.type === 'installation_progress' && data.device_id === selectedDevice.device_id) {
                setInstallProgress(data.progress)
                setInstallStatus(data.message)
                console.log(`[Progress] ${data.progress}% - ${data.message}`)
            }
        }

        ws.onerror = (error) => {
            console.error('[WebSocket] Error:', error)
        }

        return () => {
            ws.close()
        }
    }, [selectedDevice, isUploading])

    // Fetch devices
    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/devices/')
                setDevices(res.data)
                if (res.data.length > 0 && !selectedDevice) {
                    const firstConnected = res.data.find((d: Device) => d.is_connected)
                    if (firstConnected) setSelectedDevice(firstConnected)
                }
            } catch (error) {
                console.error('Failed to fetch devices:', error)
            }
        }
        fetchDevices()
        const interval = setInterval(fetchDevices, 5000)
        return () => clearInterval(interval)
    }, [selectedDevice])

    // Handle APK upload and installation
    const handleInstallAPK = async () => {
        if (!apkFile || !selectedDevice) {
            alert('Please select device and APK file')
            return
        }

        setIsUploading(true)
        setStatus('Uploading and installing APK...')

        const formData = new FormData()
        formData.append('apk', apkFile)

        try {
            const res = await axios.post(
                `http://localhost:8000/api/devices/${selectedDevice.device_id}/install-apk`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            )

            const appData: InstalledApp = {
                package_name: res.data.package_name,
                app_name: res.data.app_name || apkFile.name,
                version: res.data.version || '1.0',
                activity: res.data.activity || '.MainActivity',  // Use detected activity
                apk_path: res.data.apk_path
            }

            setInstalledApp(appData)
            localStorage.setItem('installed_app', JSON.stringify(appData))

            setStatus(`✅ Installed: ${appData.app_name}`)

        } catch (error: any) {
            setStatus('❌ Installation failed')
            alert('Failed to install: ' + (error.response?.data?.detail || error.message))
        } finally {
            setIsUploading(false)
            setTimeout(() => {
                setInstallProgress(0)
                setInstallStatus('')
            }, 2000) // Keep progress visible for 2 seconds
        }
    }

    // Start Appium session and launch app
    const handleLaunchApp = async () => {
        if (!installedApp || !selectedDevice) {
            alert('Install APK first')
            return
        }

        setIsLaunching(true)
        setStatus('Starting Appium session...')

        try {
            await axios.post('http://localhost:8000/api/inspector/start-session', {
                device_id: selectedDevice.device_id,
                platform: selectedDevice.platform.toLowerCase(),
                app_package: installedApp.package_name,
                app_activity: installedApp.activity  // Use detected activity!
            })

            setSessionActive(true)
            setStatus('✅ App launched! Capturing screen...')

            setTimeout(captureScreen, 2000)

        } catch (error: any) {
            setStatus('❌ Launch failed')
            alert('Failed to launch: ' + (error.response?.data?.detail || error.message))
            setIsLaunching(false)
        }
    }

    // Capture screenshot
    const captureScreen = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/inspector/screenshot')
            setScreenshot(`data:image/png;base64,${res.data.screenshot}`)

            if (isLaunching) {
                setIsLaunching(false)
                setStatus('✅ Ready! Click "Start Recording" to begin')
            } else if (isRecording) {
                setStatus(`🔴 Recording (${actions.length} actions)`)
            }
        } catch (error) {
            console.error('Screenshot failed:', error)
            setStatus('❌ Screenshot failed - check Appium connection')
        }
    }

    // Handle screen click for recording
    const handleScreenClick = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isRecording || !sessionActive) return

        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Scale to device coordinates
        const img = imageRef.current
        if (!img) return

        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height

        const deviceX = Math.round(x * scaleX)
        const deviceY = Math.round(y * scaleY)

        // Record action
        const action: RecordedAction = {
            step: actions.length + 1,
            action: 'tap',
            x: deviceX,
            y: deviceY,
            description: `Tap at (${deviceX}, ${deviceY})`,
            screenshot: screenshot,
            timestamp: Date.now()
        }

        setActions([...actions, action])
        setStatus(`🔴 Recording (${actions.length + 1} actions)`)

        // Perform tap on device
        try {
            await axios.post('http://localhost:8000/api/inspector/tap-coordinate', {
                x: deviceX,
                y: deviceY
            })

            setTimeout(captureScreen, 1000)
        } catch (error) {
            console.error('Tap failed:', error)
        }
    }

    // Generate and download test code
    const handleSaveFlow = async () => {
        if (actions.length === 0) {
            alert('No actions recorded!')
            return
        }

        const flowName = prompt('Enter flow name:', `${installedApp?.app_name}_test`)
        if (!flowName) return

        try {
            // Save flow to database
            await axios.post('http://localhost:8000/api/flows/', {
                name: flowName,
                description: `Auto-recorded test for ${installedApp?.app_name}`,
                device_id: selectedDevice?.device_id,
                device_name: selectedDevice?.name,
                device_platform: selectedDevice?.platform,
                device_os_version: '',
                app_package: installedApp?.package_name,
                app_name: installedApp?.app_name,
                app_version: installedApp?.version,
                steps: actions,
                flow_metadata: {
                    recorded_at: new Date().toISOString(),
                    total_steps: actions.length
                }
            })

            // Generate and download Python code
            const code = generateTestCode()
            const blob = new Blob([code], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${flowName.toLowerCase().replace(/\s+/g, '_')}.py`
            a.click()
            URL.revokeObjectURL(url)

            setStatus(`✅ Flow saved: ${flowName} (${actions.length} steps)`)
            alert(`✅ Flow saved to database and downloaded!\nFile: ${flowName}.py\nSteps: ${actions.length}`)

        } catch (error: any) {
            alert('❌ Failed to save flow: ' + (error.response?.data?.detail || error.message))
        }
    }

    const generateTestCode = () => {
        return `"""
GravityQA Auto-Generated Test
App: ${installedApp?.app_name}
Package: ${installedApp?.package_name}
Device: ${selectedDevice?.name}
Steps: ${actions.length}
Generated: ${new Date().toLocaleString()}
"""

from appium import webdriver
import time

# Capabilities
caps = {
    "platformName": "${selectedDevice?.platform}",
    "deviceName": "${selectedDevice?.device_id}",
    "automationName": "UiAutomator2",
    "appPackage": "${installedApp?.package_name}",
    "appActivity": ".MainActivity",
    "noReset": True
}

# Start session
driver = webdriver.Remote("http://localhost:4723", caps)
time.sleep(2)

try:
${actions.map(action => `    # Step ${action.step}: ${action.description}
    driver.tap([(${action.x}, ${action.y})])
    time.sleep(1)
`).join('\n')}
    print("✅ Test completed successfully!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    
finally:
    driver.quit()
`
    }

    // Clear installed app
    const handleClearApp = () => {
        if (confirm('Clear app data and start fresh?')) {
            setInstalledApp(null)
            setApkFile(null)
            localStorage.removeItem('installed_app')
            setStatus('Cleared - select APK to begin')
            // Force page refresh to clear all state
            window.location.reload()
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', background: '#0d1117' }}>
            {/* Toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #30363d', background: '#161b22' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Device Select */}
                    <select
                        value={selectedDevice?.device_id || ''}
                        onChange={(e) => {
                            const device = devices.find(d => d.device_id === e.target.value)
                            setSelectedDevice(device || null)
                        }}
                        disabled={sessionActive}
                        className="btn"
                        style={{ padding: '8px 12px', minWidth: '200px' }}
                    >
                        <option value="">Select Device</option>
                        {devices.filter(d => d.is_connected).map(d => (
                            <option key={d.device_id} value={d.device_id}>
                                {d.name}
                            </option>
                        ))}
                    </select>

                    {/* Show installed app OR upload option */}
                    {installedApp ? (
                        <>
                            <div style={{
                                padding: '8px 12px',
                                background: '#238636',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span>✅ {installedApp.app_name}</span>
                                <button
                                    onClick={handleClearApp}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '2px 6px'
                                    }}
                                    title="Clear and select different APK"
                                >
                                    ✕
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* APK Upload */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".apk"
                                onChange={(e) => handleAPKSelection(e.target.files?.[0] || null)}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sessionActive || isChecking}
                                className="btn"
                            >
                                {isChecking ? '🔍 Checking...' : `📁 ${apkFile ? apkFile.name.substring(0, 20) + '...' : 'Select APK'} `}
                            </button>

                            {/* Install */}
                            <button
                                onClick={handleInstallAPK}
                                disabled={!apkFile || !selectedDevice || isUploading || sessionActive}
                                className="btn btn-primary"
                            >
                                {isUploading ? '⏳ Installing...' : '📲 Install'}
                            </button>
                        </>
                    )}

                    {/* Launch */}
                    <button
                        onClick={handleLaunchApp}
                        disabled={!installedApp || isLaunching || sessionActive}
                        className="btn btn-primary"
                    >
                        {isLaunching ? '⏳ Launching...' : '🚀 Launch App'}
                    </button>

                    {/* Refresh Screenshot */}
                    <button
                        onClick={captureScreen}
                        disabled={!sessionActive}
                        className="btn"
                    >
                        📸 Refresh
                    </button>

                    {/* Record Toggle */}
                    <button
                        onClick={() => {
                            if (!isRecording) {
                                setIsRecording(true)
                                setStatus('🔴 Recording - click on screen to capture actions')
                            } else {
                                setIsRecording(false)
                                setStatus(`⏸️ Recording stopped(${actions.length} actions)`)
                            }
                        }}
                        disabled={!sessionActive}
                        className="btn"
                        style={{
                            background: isRecording ? '#dc2626' : '#30363d',
                            color: 'white',
                            fontWeight: 600
                        }}
                    >
                        {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
                    </button>

                    {/* Save Flow */}
                    <button
                        onClick={handleSaveFlow}
                        disabled={actions.length === 0}
                        className="btn btn-primary"
                    >
                        💾 Save Test ({actions.length})
                    </button>
                </div>

                {/* Status Bar */}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#7d8590', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>{status}</span>
                    {isRecording && (
                        <span style={{ color: '#dc2626', fontWeight: 'bold', animation: 'pulse 1.5s infinite' }}>
                            ● RECORDING
                        </span>
                    )}
                </div>

                {/* Installation Progress Bar */}
                {isUploading && installProgress > 0 && (
                    <div style={{ marginTop: '12px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px'
                        }}>
                            <span style={{ fontSize: '12px', color: '#7d8590' }}>{installStatus}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#58a6ff' }}>{installProgress}%</span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: '6px',
                            background: '#21262d',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${installProgress}% `,
                                height: '100%',
                                background: 'linear-gradient(90deg, #1f6feb 0%, #58a6ff 100%)',
                                transition: 'width 0.3s ease',
                                borderRadius: '3px'
                            }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left - Phone Screen */}
                <div style={{ flex: 1, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                    {screenshot ? (
                        <img
                            ref={imageRef}
                            src={screenshot}
                            alt="Device Screen"
                            onClick={handleScreenClick}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                borderRadius: '12px',
                                border: isRecording ? '3px solid #dc2626' : '2px solid #30363d',
                                cursor: isRecording ? 'crosshair' : 'default',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                            }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', color: '#7d8590' }}>
                            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📱</div>
                            <div style={{ fontSize: '14px' }}>
                                {!selectedDevice ? 'Select a device' :
                                    !installedApp ? 'Upload and install APK' :
                                        !sessionActive ? 'Launch app to begin' :
                                            'Loading screenshot...'}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right - Recorded Actions */}
                {actions.length > 0 && (
                    <div style={{ width: '320px', borderLeft: '1px solid #30363d', background: '#161b22', overflow: 'auto' }}>
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid #21262d', fontWeight: 600, fontSize: '13px', color: '#e6edf3' }}>
                            Recorded Actions ({actions.length})
                        </div>
                        <div style={{ padding: '8px' }}>
                            {actions.map((action) => (
                                <div
                                    key={action.step}
                                    style={{
                                        padding: '12px',
                                        background: '#0d1117',
                                        borderRadius: '6px',
                                        marginBottom: '8px',
                                        border: '1px solid #21262d'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#1f6feb',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {action.step}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '12px', color: '#58a6ff', fontWeight: 500 }}>
                                                {action.action.toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#c9d1d9', marginTop: '2px' }}>
                                                {action.description}
                                            </div>
                                        </div>
                                    </div>

                                    {action.screenshot && (
                                        <img
                                            src={action.screenshot}
                                            alt={`Step ${action.step} `}
                                            style={{
                                                width: '100%',
                                                borderRadius: '4px',
                                                border: '1px solid #21262d',
                                                marginTop: '8px'
                                            }}
                                        />
                                    )}

                                    <div style={{
                                        fontSize: '10px',
                                        color: '#484f58',
                                        marginTop: '8px',
                                        fontFamily: 'Monaco, monospace'
                                    }}>
                                        driver.tap([({action.x}, {action.y})])
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
