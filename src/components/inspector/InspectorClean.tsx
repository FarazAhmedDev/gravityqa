import { useState, useEffect } from 'react'
import axios from 'axios'

interface Device {
    id: number
    device_id: string
    name: string
    platform: string
    is_connected: boolean
}

interface RecordedAction {
    step: number
    action: 'tap' | 'swipe' | 'input'
    x?: number
    y?: number
    text?: string
    description: string
    timestamp: number
}

export default function InspectorClean() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<string>('')
    const [sessionActive, setSessionActive] = useState(false)
    const [screenshot, setScreenshot] = useState<string>('')
    const [isLaunching, setIsLaunching] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [actions, setActions] = useState<RecordedAction[]>([])
    const [status, setStatus] = useState('Connect device and launch app')
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/devices/')
                setDevices(res.data.filter((d: Device) => d.is_connected))
                if (res.data.length > 0 && !selectedDevice) {
                    const first = res.data.find((d: Device) => d.is_connected)
                    if (first) setSelectedDevice(first.device_id)
                }
            } catch (error) {
                console.error('Device fetch failed:', error)
            }
        }
        fetchDevices()
        const interval = setInterval(fetchDevices, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!sessionActive) return
        const refreshScreenshot = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/inspector/screenshot')
                if (res.data.screenshot) {
                    setScreenshot(`data:image/png;base64,${res.data.screenshot}`)
                }
            } catch (error) {
                console.error('Screenshot refresh failed')
            }
        }
        const interval = setInterval(refreshScreenshot, 2000)
        return () => clearInterval(interval)
    }, [sessionActive])

    const handleLaunch = async () => {
        if (!selectedDevice) {
            alert('Please select a device!')
            return
        }
        setIsLaunching(true)
        setStatus('Launching app on device...')
        try {
            const res = await axios.post('http://localhost:8000/api/inspector/start-session', {
                device_id: selectedDevice,
                platform: 'android',
                app_package: 'com.google.android.apps.subscriptions.red',
                app_activity: '.LauncherActivity'
            })
            if (res.data.session_id) {
                setSessionActive(true)
                setStatus('✅ App launched! Starting screen capture...')
                setTimeout(async () => {
                    try {
                        const shot = await axios.get('http://localhost:8000/api/inspector/screenshot')
                        setScreenshot(`data:image/png;base64,${shot.data.screenshot}`)
                        setStatus('✅ Ready! Click \"Start Recording\" to begin')
                    } catch (err) {
                        setStatus('⚠️ App launched but screenshot failed')
                    }
                    setIsLaunching(false)
                }, 3000)
            }
        } catch (error: any) {
            setStatus('❌ Launch failed: ' + (error.response?.data?.detail || error.message))
            setIsLaunching(false)
        }
    }

    const handleScreenTap = async (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isRecording) return
        const rect = e.currentTarget.getBoundingClientRect()
        const img = e.currentTarget as HTMLImageElement
        const scaleX = img.naturalWidth / img.width
        const scaleY = img.naturalHeight / img.height
        const x = Math.round((e.clientX - rect.left) * scaleX)
        const y = Math.round((e.clientY - rect.top) * scaleY)
        const action: RecordedAction = {
            step: actions.length + 1,
            action: 'tap',
            x,
            y,
            description: `Tap at (${x}, ${y})`,
            timestamp: Date.now()
        }
        setActions([...actions, action])
        setStatus(`🔴 Recording - ${actions.length + 1} actions`)
        try {
            await axios.post('http://localhost:8000/api/inspector/tap-coordinate', { x, y })
        } catch (error) {
            console.error('Tap execution failed:', error)
        }
    }

    const handleSave = async () => {
        if (actions.length === 0) {
            alert('No actions to save!')
            return
        }
        const flowName = prompt('Enter test name:', 'my_test') || 'untitled_test'
        try {
            await axios.post('http://localhost:8000/api/flows/', {
                name: flowName,
                description: 'Recorded test flow',
                device_id: selectedDevice,
                device_name: devices.find(d => d.device_id === selectedDevice)?.name || 'Unknown',
                device_platform: 'Android',
                device_os_version: '',
                app_package: 'com.google.android.apps.subscriptions.red',
                app_name: 'YouTube Red',
                app_version: '1.0',
                steps: actions,
                flow_metadata: {
                    recorded_at: new Date().toISOString(),
                    total_steps: actions.length
                }
            })
            alert(`✅ Test \"${flowName}\" saved successfully!`)
            setStatus(`✅ Saved: ${flowName}`)
        } catch (error: any) {
            alert('❌ Save failed: ' + (error.response?.data?.detail || error.message))
        }
    }

    return (
        <div style={{
            padding: '40px 48px',
            minHeight: '100vh',
            background: '#0a0e14',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: `
                    radial-gradient(circle at ${20 + mousePos.x * 0.02}% ${30 + mousePos.y * 0.02}%, rgba(255, 117, 24, 0.12) 0%, transparent 50%),
                    radial-gradient(circle at ${80 - mousePos.x * 0.01}% ${70 - mousePos.y * 0.01}%, rgba(248, 81, 73, 0.08) 0%, transparent 50%),
                    linear-gradient(135deg, #0a0e14 0%, #0d1117 50%, #0a0e14 100%)
                `,
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
                animation: 'gradientShift 15s ease infinite'
            }}></div>

            {/* Floating Particles */}
            {[...Array(12)].map((_, i) => (
                <div key={i} style={{
                    position: 'fixed',
                    width: `${4 + Math.random() * 5}px`,
                    height: `${4 + Math.random() * 5}px`,
                    background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(255, 117, 24, 0.3)' : 'rgba(248, 81, 73, 0.3)'}, transparent)`,
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animation: `float${i % 3} ${12 + Math.random() * 8}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 4}s`,
                    pointerEvents: 'none',
                    filter: 'blur(1px)',
                    zIndex: 0
                }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Premium Header */}
                <div style={{ marginBottom: '40px', animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, rgba(255, 117, 24, 0.2), rgba(248, 81, 73, 0.2))',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(255, 117, 24, 0.3)',
                        marginBottom: '20px',
                        animation: 'glow 3s ease-in-out infinite',
                        boxShadow: '0 0 30px rgba(255, 117, 24, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #ff7518, #f85149, #ff7518)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            animation: 'gradientFlow 3s linear infinite'
                        }}>
                            🔍 Inspector
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #ffffff 0%, #ff7518 50%, #f85149 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '14px',
                        letterSpacing: '-2px',
                        animation: 'gradientFlow 5s ease infinite, textFloat 4s ease-in-out infinite',
                        textShadow: '0 0 40px rgba(255, 117, 24, 0.3)'
                    }}>
                        Test Recording Studio
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        color: '#8b949e',
                        fontWeight: 600,
                        animation: 'fadeIn 1s ease-out 0.3s backwards'
                    }}>
                        {sessionActive
                            ? isRecording
                                ? `🔴 Recording - ${actions.length} action${actions.length !== 1 ? 's' : ''} captured`
                                : '⏸️ Session active - ready to record'
                            : '📱 Launch app to begin recording'}
                    </p>
                </div>

                {/* Control Panel */}
                <div style={{
                    marginBottom: '32px',
                    padding: '28px 32px',
                    background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.7), rgba(22, 27, 34, 0.5))',
                    backdropFilter: 'blur(30px)',
                    borderRadius: '20px',
                    border: '2px solid rgba(255, 117, 24, 0.2)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards'
                }}>
                    {/* Device Selection */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            color: '#8b949e',
                            marginBottom: '12px',
                            fontWeight: 700
                        }}>
                            Select Device
                        </label>
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            disabled={sessionActive}
                            style={{
                                width: '100%',
                                padding: '16px 18px',
                                background: 'rgba(13, 17, 23, 0.7)',
                                color: '#e6edf3',
                                border: '1.5px solid rgba(48, 54, 61, 0.6)',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 600,
                                outline: 'none',
                                cursor: sessionActive ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: sessionActive ? 0.5 : 1
                            }}
                            onFocus={(e) => {
                                if (!sessionActive) {
                                    e.currentTarget.style.borderColor = '#ff7518'
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 117, 24, 0.15), 0 0 20px rgba(255, 117, 24, 0.2)'
                                }
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                e.currentTarget.style.boxShadow = 'none'
                            }}
                        >
                            <option value="">Choose device...</option>
                            {devices.map(d => (
                                <option key={d.device_id} value={d.device_id}>{d.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {/* Launch Button */}
                        <button
                            onClick={handleLaunch}
                            disabled={!selectedDevice || sessionActive || isLaunching}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '18px 36px',
                                fontSize: '16px',
                                fontWeight: 900,
                                background: sessionActive
                                    ? 'rgba(48, 54, 61, 0.5)'
                                    : isLaunching
                                        ? 'rgba(48, 54, 61, 0.5)'
                                        : 'linear-gradient(135deg, #3fb950 0%, #238636 50%, #3fb950 100%)',
                                backgroundSize: '200% 100%',
                                color: (selectedDevice && !sessionActive && !isLaunching) ? 'white' : '#6e7681',
                                border: 'none',
                                borderRadius: '14px',
                                cursor: (selectedDevice && !sessionActive && !isLaunching) ? 'pointer' : 'not-allowed',
                                transition: 'all 0.4s',
                                boxShadow: (selectedDevice && !sessionActive && !isLaunching)
                                    ? '0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : 'none',
                                animation: (selectedDevice && !sessionActive && !isLaunching) ? 'buttonPulse 2.5s ease-in-out infinite' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (selectedDevice && !sessionActive && !isLaunching) {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = '0 0 60px rgba(46, 160, 67, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                    e.currentTarget.style.backgroundPosition = '100% 0'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (selectedDevice && !sessionActive && !isLaunching) {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = '0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    e.currentTarget.style.backgroundPosition = '0% 0'
                                }
                            }}
                        >
                            {isLaunching ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                    Launching...
                                </span>
                            ) : sessionActive ? '✅ App Running' : '🚀 Launch App'}
                        </button>

                        {/* Record Button */}
                        <button
                            onClick={() => {
                                setIsRecording(!isRecording)
                                setStatus(isRecording ? '⏸️ Recording stopped' : '🔴 Recording - tap on screen')
                            }}
                            disabled={!sessionActive}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '18px 36px',
                                fontSize: '16px',
                                fontWeight: 900,
                                background: isRecording
                                    ? 'linear-gradient(135deg, #f85149 0%, #da3633 50%, #f85149 100%)'
                                    : sessionActive
                                        ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))'
                                        : 'rgba(48, 54, 61, 0.5)',
                                backgroundSize: '200% 100%',
                                color: isRecording || sessionActive ? (isRecording ? 'white' : '#f85149') : '#6e7681',
                                border: isRecording || sessionActive
                                    ? '2px solid rgba(248, 81, 73, 0.5)'
                                    : '2px solid transparent',
                                borderRadius: '14px',
                                cursor: sessionActive ? 'pointer' : 'not-allowed',
                                transition: 'all 0.4s',
                                boxShadow: isRecording
                                    ? '0 0 60px rgba(248, 81, 73, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                    : sessionActive
                                        ? '0 0 30px rgba(248, 81, 73, 0.3)'
                                        : 'none',
                                animation: isRecording ? 'recordPulse 1.2s ease-in-out infinite' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (sessionActive) {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                    e.currentTarget.style.backgroundPosition = '100% 0'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (sessionActive) {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.backgroundPosition = '0% 0'
                                }
                            }}
                        >
                            {isRecording ? '⏹️ Stop Recording' : '🔴 Start Recording'}
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={actions.length === 0}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '18px 36px',
                                fontSize: '16px',
                                fontWeight: 900,
                                background: actions.length > 0
                                    ? 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 50%, #58a6ff 100%)'
                                    : 'rgba(48, 54, 61, 0.5)',
                                backgroundSize: '200% 100%',
                                color: actions.length > 0 ? 'white' : '#6e7681',
                                border: 'none',
                                borderRadius: '14px',
                                cursor: actions.length > 0 ? 'pointer' : 'not-allowed',
                                transition: 'all 0.4s',
                                boxShadow: actions.length > 0
                                    ? '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : 'none',
                                animation: actions.length > 0 ? 'buttonPulse 2.5s ease-in-out infinite' : 'none'
                            }}
                            onMouseEnter={(e) => {
                                if (actions.length > 0) {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = '0 0 60px rgba(88, 166, 255, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                    e.currentTarget.style.backgroundPosition = '100% 0'
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (actions.length > 0) {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    e.currentTarget.style.backgroundPosition = '0% 0'
                                }
                            }}
                        >
                            💾 Save Test ({actions.length})
                        </button>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                        marginTop: '20px',
                        padding: '14px 20px',
                        background: isRecording
                            ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))'
                            : 'linear-gradient(135deg, rgba(255, 117, 24, 0.12), rgba(255, 117, 24, 0.08))',
                        borderRadius: '12px',
                        border: isRecording
                            ? '1.5px solid rgba(248, 81, 73, 0.3)'
                            : '1.5px solid rgba(255, 117, 24, 0.2)',
                        fontSize: '14px',
                        color: isRecording ? '#f85149' : '#ff7518',
                        fontWeight: 700,
                        textAlign: 'center',
                        boxShadow: isRecording ? '0 0 20px rgba(248, 81, 73, 0.2)' : 'none',
                        animation: isRecording ? 'recordPulse 2s ease-in-out infinite' : 'none'
                    }}>
                        {status}
                    </div>
                </div>

                {/* Main Content - Split View */}
                <div style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 500px)' }}>
                    {/* Device Screen Panel */}
                    <div style={{
                        flex: screenshot ? 2 : 1,
                        background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.7), rgba(22, 27, 34, 0.5))',
                        backdropFilter: 'blur(30px)',
                        borderRadius: '24px',
                        border: '2px solid rgba(48, 54, 61, 0.5)',
                        padding: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                        animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        {screenshot ? (
                            <>
                                {/* Shimmer effect on recording */}
                                {isRecording && (
                                    <>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(248, 81, 73, 0.15), transparent)',
                                            animation: 'shimmer 3s infinite'
                                        }}></div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: 'conic-gradient(from 0deg, transparent, rgba(248, 81, 73, 0.12), transparent)',
                                            animation: 'rotate 6s linear infinite'
                                        }}></div>
                                    </>
                                )}

                                <div style={{
                                    position: 'relative',
                                    padding: '3px',
                                    borderRadius: '20px',
                                    background: isRecording
                                        ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.5), rgba(255, 117, 24, 0.5))'
                                        : 'linear-gradient(135deg, rgba(88, 166, 255, 0.3), rgba(139, 92, 246, 0.3))',
                                    boxShadow: isRecording
                                        ? '0 0 60px rgba(248, 81, 73, 0.6)'
                                        : '0 10px 40px rgba(0, 0, 0, 0.8)',
                                    zIndex: 1
                                }}>
                                    <img
                                        src={screenshot}
                                        alt="Device Screen"
                                        onClick={handleScreenTap}
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: 'calc(100vh - 620px)',
                                            borderRadius: '18px',
                                            cursor: isRecording ? 'crosshair' : 'default',
                                            transition: 'all 0.3s',
                                            display: 'block'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isRecording) {
                                                e.currentTarget.style.transform = 'scale(1.02)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                color: '#7d8590',
                                animation: 'fadeIn 0.8s ease-out'
                            }}>
                                <div style={{
                                    fontSize: '96px',
                                    marginBottom: '24px',
                                    opacity: 0.25,
                                    animation: 'iconFloat 5s ease-in-out infinite, iconRotate 20s linear infinite'
                                }}>
                                    📱
                                </div>
                                <h3 style={{
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #e6edf3, #8b949e)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '12px'
                                }}>
                                    {!selectedDevice ? 'Select a device' :
                                        !sessionActive ? 'Launch app to begin' :
                                            'Loading screen...'}
                                </h3>
                                <p style={{
                                    fontSize: '15px',
                                    color: '#7d8590',
                                    fontWeight: 500
                                }}>
                                    {!selectedDevice ? 'Choose from device dropdown above' :
                                        'Click the launch button when ready'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions Panel */}
                    {actions.length > 0 && (
                        <div style={{
                            flex: 1,
                            minWidth: '360px',
                            background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.7), rgba(22, 27, 34, 0.5))',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '24px',
                            border: '2px solid rgba(255, 117, 24, 0.2)',
                            padding: '28px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                            animation: 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            overflowY: 'auto',
                            maxHeight: 'calc(100vh - 520px)'
                        }}>
                            <h3 style={{
                                margin: '0 0 24px 0',
                                fontSize: '20px',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #ff7518, #f85149)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}>
                                🎬 Recorded Actions ({actions.length})
                            </h3>
                            {actions.map((action, idx) => (
                                <div
                                    key={action.step}
                                    style={{
                                        position: 'relative',
                                        padding: '18px 20px',
                                        background: 'rgba(13, 17, 23, 0.7)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '14px',
                                        marginBottom: '12px',
                                        border: '1.5px solid rgba(48, 54, 61, 0.5)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        animation: `cardEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s backwards`,
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(255, 117, 24, 0.6)'
                                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 117, 24, 0.12), rgba(248, 81, 73, 0.08))'
                                        e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)'
                                        e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 117, 24, 0.2), 0 8px 20px rgba(0, 0, 0, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.5)'
                                        e.currentTarget.style.background = 'rgba(13, 17, 23, 0.7)'
                                        e.currentTarget.style.transform = 'translateX(0) scale(1)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#ff7518',
                                        fontWeight: 800,
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        Step {action.step}: {action.action}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#e6edf3',
                                        marginBottom: '10px',
                                        lineHeight: '1.5',
                                        fontWeight: 600,
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        {action.description}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#7d8590',
                                        fontFamily: 'Monaco, Consolas, monospace',
                                        padding: '8px 12px',
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        border: '1px solid rgba(48, 54, 61, 0.5)',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        tap({action.x}, {action.y})
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes float0 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(25px, -25px); }
                    66% { transform: translate(-20px, 35px); }
                }
                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(-35px, 25px); }
                    66% { transform: translate(25px, -35px); }
                }
                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(20px, 30px); }
                    66% { transform: translate(-30px, -20px); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(50px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes cardEntrance {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes textFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes iconRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                @keyframes gradientShift {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 30px rgba(255, 117, 24, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
                    50% { box-shadow: 0 0 50px rgba(255, 117, 24, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
                }
                @keyframes buttonPulse {
                    0%, 100% {
                        box-shadow: 0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 60px rgba(46, 160, 67, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                    }
                }
                @keyframes recordPulse {
                    0%, 100% {
                        box-shadow: 0 0 60px rgba(248, 81, 73, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
                    }
                    50% {
                        box-shadow: 0 0 80px rgba(248, 81, 73, 1), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35);
                    }
                }
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
