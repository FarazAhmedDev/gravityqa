import { useState, useEffect } from 'react'
import axios from 'axios'

interface Device {
    id: number
    device_id: string
    name: string
    platform: string
    is_connected: boolean
}

export default function Inspector() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [sessionActive, setSessionActive] = useState(false)
    const [screenshot, setScreenshot] = useState<string>('')
    const [status, setStatus] = useState('Select device and launch app')

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

    // Launch app with real package
    const handleLaunchApp = async () => {
        if (!selectedDevice) {
            alert('Select device first')
            return
        }

        setStatus('Starting app...')

        try {
            // Use the RED app package that exists on phone
            await axios.post('http://localhost:8000/api/inspector/start-session', {
                device_id: selectedDevice.device_id,
                platform: 'android',
                app_package: 'com.google.android.apps.subscriptions.red',
                app_activity: '.LauncherActivity'
            })

            setSessionActive(true)
            setStatus('✅ App launched! Capturing screen...')

            setTimeout(captureScreen, 2000)

        } catch (error: any) {
            setStatus('❌ Launch failed')
            alert('Failed to launch: ' + (error.response?.data?.detail || error.message))
        }
    }

    // Capture screenshot
    const captureScreen = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/inspector/screenshot')
            setScreenshot(`data:image/png;base64,${res.data.screenshot}`)
            setStatus('✅ Ready!')
        } catch (error) {
            console.error('Screenshot failed:', error)
            setStatus('❌ Screenshot failed')
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', background: '#0d1117', padding: '20px' }}>
            {/* Simple controls */}
            <div style={{ marginBottom: '20px' }}>
                <h2 style={{ color: '#e6edf3', marginBottom: '16px' }}>Inspector - Simple Test</h2>

                <select
                    value={selectedDevice?.device_id || ''}
                    onChange={(e) => {
                        const device = devices.find(d => d.device_id === e.target.value)
                        setSelectedDevice(device || null)
                    }}
                    style={{
                        padding: '10px',
                        marginRight: '10px',
                        background: '#21262d',
                        color: '#e6edf3',
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        minWidth: '200px'
                    }}
                >
                    <option value="">Select Device</option>
                    {devices.filter(d => d.is_connected).map(d => (
                        <option key={d.device_id} value={d.device_id}>
                            {d.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleLaunchApp}
                    disabled={!selectedDevice || sessionActive}
                    style={{
                        padding: '10px 20px',
                        background: sessionActive ? '#30363d' : '#238636',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: selectedDevice && !sessionActive ? 'pointer' : 'not-allowed',
                        fontSize: '14px',
                        fontWeight: 600,
                        marginRight: '10px'
                    }}
                >
                    🚀 Launch YouTube Red App
                </button>

                <button
                    onClick={captureScreen}
                    disabled={!sessionActive}
                    style={{
                        padding: '10px 20px',
                        background: sessionActive ? '#1f6feb' : '#30363d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: sessionActive ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                    }}
                >
                    📸 Refresh Screenshot
                </button>

                <div style={{ marginTop: '16px', color: '#7d8590', fontSize: '14px' }}>
                    Status: {status}
                </div>
            </div>

            {/* Screenshot area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0d1117',
                borderRadius: '12px',
                border: '2px solid #30363d'
            }}>
                {screenshot ? (
                    <img
                        src={screenshot}
                        alt="Device Screen"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            borderRadius: '8px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                        }}
                    />
                ) : (
                    <div style={{ textAlign: 'center', color: '#7d8590' }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📱</div>
                        <div style={{ fontSize: '16px' }}>
                            {!selectedDevice ? 'Select a device' :
                                !sessionActive ? 'Click "Launch" to start' :
                                    'Loading screenshot...'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
