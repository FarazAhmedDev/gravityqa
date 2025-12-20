import { useState, useEffect } from 'react'
import axios from 'axios'

interface Device {
    id: number
    device_id: string
    name: string
    platform: string
    platform_version?: string
    device_type: string
    manufacturer?: string
    model?: string
    is_connected: boolean
}

export default function DeviceManager() {
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [activeTab, setActiveTab] = useState<'connected' | 'disconnected'>('connected')

    // Track mouse for parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const fetchDevices = async () => {
        setIsRefreshing(true)
        try {
            const response = await axios.get('http://localhost:8000/api/devices/')
            setDevices(response.data)
            if (!selectedDevice && response.data.length > 0) {
                const firstConnected = response.data.find((d: Device) => d.is_connected)
                if (firstConnected) setSelectedDevice(firstConnected)
            }
        } catch (err) {
            console.error('Failed to fetch devices:', err)
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchDevices()
        const websocket = new WebSocket('ws://localhost:8000/ws/realtime')
        websocket.onopen = () => setWs(websocket)
        websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                if (message.type === 'device_connected' || message.type === 'device_disconnected') {
                    fetchDevices()
                }
            } catch (error) { }
        }
        return () => { if (websocket.readyState === WebSocket.OPEN) websocket.close() }
    }, [])

    useEffect(() => {
        const interval = setInterval(fetchDevices, 5000)
        return () => clearInterval(interval)
    }, [])

    const connectedCount = devices.filter(d => d.is_connected).length
    const disconnectedCount = devices.filter(d => !d.is_connected).length
    const filteredDevices = activeTab === 'connected'
        ? devices.filter(d => d.is_connected)
        : devices.filter(d => !d.is_connected)

    return (
        <div style={{
            padding: '40px 48px',
            minHeight: '100vh',
            background: '#0a0e14',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Mesh Gradient Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at ${20 + mousePos.x * 0.02}% ${30 + mousePos.y * 0.02}%, rgba(88, 166, 255, 0.12) 0%, transparent 50%),
                    radial-gradient(circle at ${80 - mousePos.x * 0.01}% ${70 - mousePos.y * 0.01}%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                    linear-gradient(135deg, #0a0e14 0%, #0d1117 50%, #0a0e14 100%)
                `,
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
                animation: 'gradientShift 15s ease infinite'
            }}></div>

            {/* Floating Particles */}
            {[...Array(15)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'fixed',
                        width: `${4 + Math.random() * 6}px`,
                        height: `${4 + Math.random() * 6}px`,
                        background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(88, 166, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}, transparent)`,
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float${i % 3} ${15 + Math.random() * 10}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        pointerEvents: 'none',
                        filter: 'blur(1px)',
                        zIndex: 0
                    }}
                />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Ultra-Premium Header */}
                <div style={{
                    marginBottom: '40px',
                    animation: 'slideDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.2), rgba(139, 92, 246, 0.2))',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(88, 166, 255, 0.3)',
                        marginBottom: '20px',
                        animation: 'glow 3s ease-in-out infinite',
                        boxShadow: '0 0 30px rgba(88, 166, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #58a6ff, #a78bfa, #58a6ff)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            animation: 'gradientFlow 3s linear infinite'
                        }}>
                            ⚡ Device Hub
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #ffffff 0%, #58a6ff 50%, #a78bfa 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '14px',
                        letterSpacing: '-2px',
                        animation: 'gradientFlow 5s ease infinite, textFloat 4s ease-in-out infinite',
                        textShadow: '0 0 40px rgba(88, 166, 255, 0.3)'
                    }}>
                        Connected Devices
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        color: '#8b949e',
                        fontWeight: 600,
                        animation: 'fadeIn 1s ease-out 0.3s backwards'
                    }}>
                        {devices.length > 0
                            ? `⚡ ${connectedCount} active device${connectedCount !== 1 ? 's' : ''} ready`
                            : '⏳ Scanning for devices...'}
                    </p>
                </div>

                {/* Premium Controls - All in One Row */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '40px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s backwards'
                }}>
                    {/* Refresh Button */}
                    <button
                        onClick={fetchDevices}
                        disabled={isRefreshing}
                        style={{
                            position: 'relative',
                            padding: '14px 28px',
                            background: isRefreshing
                                ? 'rgba(30, 35, 42, 0.8)'
                                : 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 50%, #58a6ff 100%)',
                            backgroundSize: '200% 100%',
                            color: isRefreshing ? '#6e7681' : 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: isRefreshing ? 'not-allowed' : 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                            boxShadow: isRefreshing
                                ? 'none'
                                : '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            animation: isRefreshing ? 'none' : 'buttonPulse 2s ease-in-out infinite',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => {
                            if (!isRefreshing) {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                                e.currentTarget.style.boxShadow = '0 0 60px rgba(88, 166, 255, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                e.currentTarget.style.backgroundPosition = '100% 0'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isRefreshing) {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = '0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.backgroundPosition = '0% 0'
                            }
                        }}
                    >
                        {isRefreshing ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span>
                                Scanning
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔍 Refresh
                            </span>
                        )}
                    </button>

                    {/* Connected Tab */}
                    <button
                        onClick={() => setActiveTab('connected')}
                        style={{
                            position: 'relative',
                            padding: '14px 28px',
                            background: activeTab === 'connected'
                                ? 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)'
                                : 'rgba(30, 35, 42, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                            boxShadow: activeTab === 'connected'
                                ? `0 1px 0 0 rgba(255,255,255,0.4) inset,
                                   0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                   0 6px 20px -4px rgba(16,185,129,0.5),
                                   0 12px 40px -8px rgba(16,185,129,0.3)`
                                : 'none',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                            if (activeTab === 'connected') {
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.5) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 8px 28px -4px rgba(16,185,129,0.6),
                                    0 16px 50px -8px rgba(16,185,129,0.4)
                                `
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            if (activeTab === 'connected') {
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.4) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 6px 20px -4px rgba(16,185,129,0.5),
                                    0 12px 40px -8px rgba(16,185,129,0.3)
                                `
                            }
                        }}
                    >
                        {activeTab === 'connected' && (
                            <>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '50%',
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                                    borderRadius: '12px 12px 0 0',
                                    pointerEvents: 'none'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmerGloss 3s infinite',
                                    pointerEvents: 'none'
                                }} />
                            </>
                        )}
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🟢 Connected ({connectedCount})
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('disconnected')}
                        style={{
                            position: 'relative',
                            padding: '14px 28px',
                            background: activeTab === 'disconnected'
                                ? 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)'
                                : 'rgba(30, 35, 42, 0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            overflow: 'hidden',
                            boxShadow: activeTab === 'disconnected'
                                ? `0 1px 0 0 rgba(255,255,255,0.4) inset,
                                   0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                   0 6px 20px -4px rgba(239,68,68,0.5),
                                   0 12px 40px -8px rgba(239,68,68,0.3)`
                                : 'none',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                            if (activeTab === 'disconnected') {
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.5) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 8px 28px -4px rgba(239,68,68,0.6),
                                    0 16px 50px -8px rgba(239,68,68,0.4)
                                `
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            if (activeTab === 'disconnected') {
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.4) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 6px 20px -4px rgba(239,68,68,0.5),
                                    0 12px 40px -8px rgba(239,68,68,0.3)
                                `
                            }
                        }}
                    >
                        {activeTab === 'disconnected' && (
                            <>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '50%',
                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                                    borderRadius: '12px 12px 0 0',
                                    pointerEvents: 'none'
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                    animation: 'shimmerGloss 3s infinite',
                                    pointerEvents: 'none'
                                }} />
                            </>
                        )}
                        <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            🔴 Disconnected ({disconnectedCount})
                        </span>
                    </button>
                </div>

                {/* Mega-Premium Devices Grid */}
                {filteredDevices.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '28px'
                    }}>
                        {filteredDevices.map((device, index) => (
                            <div
                                key={device.id}
                                onClick={() => device.is_connected && setSelectedDevice(device)}
                                style={{
                                    position: 'relative',
                                    padding: '32px',
                                    background: selectedDevice?.id === device.id
                                        ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.18) 0%, rgba(139, 92, 246, 0.15) 100%)'
                                        : 'rgba(22, 27, 34, 0.5)',
                                    backdropFilter: 'blur(30px)',
                                    borderRadius: '24px',
                                    border: selectedDevice?.id === device.id
                                        ? '2px solid rgba(88, 166, 255, 0.5)'
                                        : '2px solid rgba(48, 54, 61, 0.4)',
                                    cursor: device.is_connected ? 'pointer' : 'not-allowed',
                                    opacity: device.is_connected ? 1 : 0.5,
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: selectedDevice?.id === device.id
                                        ? '0 0 60px rgba(88, 166, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                        : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                                    animation: `cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.12}s backwards`,
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    if (device.is_connected) {
                                        e.currentTarget.style.transform = 'translateY(-8px) scale(1.03) rotateX(2deg)'
                                        e.currentTarget.style.borderColor = 'rgba(88, 166, 255, 0.6)'
                                        e.currentTarget.style.boxShadow = '0 0 80px rgba(88, 166, 255, 0.5), 0 25px 70px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1) rotateX(0deg)'
                                    e.currentTarget.style.borderColor = selectedDevice?.id === device.id
                                        ? 'rgba(88, 166, 255, 0.5)'
                                        : 'rgba(48, 54, 61, 0.4)'
                                    e.currentTarget.style.boxShadow = selectedDevice?.id === device.id
                                        ? '0 0 60px rgba(88, 166, 255, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                        : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                }}
                            >
                                {/* Animated Shimmer Overlay */}
                                {selectedDevice?.id === device.id && (
                                    <>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                            animation: 'shimmer 4s infinite'
                                        }}></div>
                                        <div style={{
                                            position: 'absolute',
                                            top: '-50%',
                                            left: '-50%',
                                            width: '200%',
                                            height: '200%',
                                            background: 'conic-gradient(from 0deg, transparent, rgba(88, 166, 255, 0.1), transparent)',
                                            animation: 'rotate 8s linear infinite'
                                        }}></div>
                                    </>
                                )}

                                {/* Device Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginBottom: '28px',
                                    gap: '16px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        filter: 'drop-shadow(0 6px 20px rgba(88, 166, 255, 0.4))',
                                        animation: device.is_connected
                                            ? 'iconFloat 4s ease-in-out infinite, iconGlow 3s ease-in-out infinite'
                                            : 'none'
                                    }}>
                                        {/* Clean Phone Icon */}
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={device.is_connected ? '#58a6ff' : '#6e7681'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                            <line x1="12" y1="18" x2="12.01" y2="18" />
                                        </svg>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '22px',
                                            fontWeight: 800,
                                            color: '#ffffff',
                                            marginBottom: '8px',
                                            letterSpacing: '-0.5px',
                                            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                                        }}>
                                            {device.name}
                                        </h3>
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#8b949e',
                                            fontWeight: 600
                                        }}>
                                            {device.manufacturer} {device.model}
                                        </p>
                                    </div>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        borderRadius: '50%',
                                        background: device.is_connected
                                            ? 'radial-gradient(circle, #3fb950, #238636)'
                                            : 'radial-gradient(circle, #f85149, #da3633)',
                                        boxShadow: device.is_connected
                                            ? '0 0 20px rgba(63, 185, 80, 1), 0 0 40px rgba(63, 185, 80, 0.5)'
                                            : '0 0 20px rgba(248, 81, 73, 1)',
                                        animation: device.is_connected ? 'statusPulse 2.5s ease-in-out infinite' : 'none'
                                    }}></div>
                                </div>

                                {/* Gradient Border Details Panel */}
                                <div style={{
                                    position: 'relative',
                                    padding: '2px',
                                    borderRadius: '18px',
                                    background: selectedDevice?.id === device.id
                                        ? 'linear-gradient(135deg, rgba(88, 166, 255, 0.4), rgba(139, 92, 246, 0.4))'
                                        : 'linear-gradient(135deg, rgba(48, 54, 61, 0.5), rgba(48, 54, 61, 0.3))',
                                    zIndex: 1
                                }}>
                                    <div style={{
                                        background: 'rgba(13, 17, 23, 0.9)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '16px',
                                        padding: '22px'
                                    }}>
                                        {[
                                            { label: 'Platform', value: `${device.platform} ${device.platform_version}`, icon: '💻' },
                                            { label: 'Type', value: device.device_type, icon: '📱' },
                                            { label: 'Device ID', value: device.device_id.substring(0, 16) + '...', mono: true, icon: '🔑' }
                                        ].map((item, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: i === 2 ? '20px' : '14px',
                                                animation: `slideInLeft 0.6s ease-out ${0.4 + i * 0.1}s backwards`
                                            }}>
                                                <span style={{
                                                    fontSize: '14px',
                                                    color: '#7d8590',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                                    {item.label}
                                                </span>
                                                <span style={{
                                                    fontSize: '14px',
                                                    color: '#e6edf3',
                                                    fontWeight: 800,
                                                    fontFamily: item.mono ? 'monospace' : 'inherit',
                                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                                                }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        ))}

                                        {/* Animated Status Badge */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            paddingTop: '20px',
                                            borderTop: '2px solid rgba(48, 54, 61, 0.7)'
                                        }}>
                                            <span style={{
                                                fontSize: '14px',
                                                color: '#7d8590',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span style={{ fontSize: '16px' }}>⚡</span>
                                                Status
                                            </span>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 18px',
                                                background: device.is_connected
                                                    ? 'linear-gradient(135deg, rgba(63, 185, 80, 0.2), rgba(46, 160, 67, 0.15))'
                                                    : 'linear-gradient(135deg, rgba(248, 81, 73, 0.2), rgba(218, 54, 51, 0.15))',
                                                borderRadius: '10px',
                                                border: device.is_connected
                                                    ? '1.5px solid rgba(63, 185, 80, 0.4)'
                                                    : '1.5px solid rgba(248, 81, 73, 0.4)',
                                                boxShadow: device.is_connected
                                                    ? '0 0 20px rgba(63, 185, 80, 0.3)'
                                                    : '0 0 20px rgba(248, 81, 73, 0.3)',
                                                animation: device.is_connected ? 'badgePulse 3s ease-in-out infinite' : 'none'
                                            }}>
                                                <div style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: device.is_connected ? '#3fb950' : '#f85149',
                                                    boxShadow: device.is_connected
                                                        ? '0 0 10px rgba(63, 185, 80, 1)'
                                                        : '0 0 10px rgba(248, 81, 73, 1)'
                                                }}></div>
                                                <span style={{
                                                    fontSize: '13px',
                                                    color: device.is_connected ? '#3fb950' : '#f85149',
                                                    fontWeight: 900,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px'
                                                }}>
                                                    {device.is_connected ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '500px',
                        maxHeight: 'calc(100vh - 200px)',
                        textAlign: 'center',
                        animation: 'fadeIn 1s ease-out',
                        overflow: 'auto',
                        padding: '20px'
                    }}>
                        <div style={{
                            fontSize: '120px',
                            marginBottom: '30px',
                            opacity: 0.2,
                            animation: 'iconFloat 5s ease-in-out infinite, iconRotate 20s linear infinite'
                        }}>
                            📱
                        </div>
                        <h3 style={{
                            fontSize: '32px',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #e6edf3, #58a6ff, #8b949e)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '18px',
                            letterSpacing: '-1px',
                            animation: 'gradientFlow 5s ease infinite'
                        }}>
                            No Devices Detected
                        </h3>
                        <p style={{
                            fontSize: '17px',
                            color: '#8b949e',
                            marginBottom: '50px',
                            maxWidth: '550px',
                            lineHeight: '1.7',
                            fontWeight: 500
                        }}>
                            Connect your Android or iOS device via USB and enable debugging
                        </p>

                        <div style={{
                            maxWidth: '700px',
                            width: '100%',
                            maxHeight: '600px',
                            padding: '40px',
                            background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.7), rgba(22, 27, 34, 0.5))',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '24px',
                            border: '2px solid rgba(48, 54, 61, 0.5)',
                            textAlign: 'left',
                            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            animation: 'slideUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s backwards',
                            overflow: 'auto'
                        }}>
                            <h4 style={{
                                fontSize: '20px',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #ffffff, #58a6ff)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '24px'
                            }}>
                                📋 Quick Setup Guide
                            </h4>
                            <ol style={{
                                fontSize: '16px',
                                color: '#8b949e',
                                lineHeight: '2.4',
                                paddingLeft: '28px',
                                fontWeight: 600,
                                marginBottom: 0
                            }}>
                                <li style={{ animation: 'slideInLeft 0.6s ease-out 0.4s backwards' }}>
                                    Enable <strong style={{ color: '#e6edf3' }}>USB Debugging</strong> on device
                                </li>
                                <li style={{ animation: 'slideInLeft 0.6s ease-out 0.5s backwards' }}>
                                    Connect via <strong style={{ color: '#e6edf3' }}>USB cable</strong>
                                </li>
                                <li style={{ animation: 'slideInLeft 0.6s ease-out 0.6s backwards' }}>
                                    Accept <strong style={{ color: '#e6edf3' }}>authorization</strong> prompt
                                </li>
                                <li style={{ animation: 'slideInLeft 0.6s ease-out 0.7s backwards' }}>
                                    Click <strong style={{ color: '#58a6ff' }}>Refresh</strong> button
                                </li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Animated Status Indicator */}
                <div style={{
                    position: 'fixed',
                    bottom: '28px',
                    right: '28px',
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))',
                    backdropFilter: 'blur(30px)',
                    border: '1.5px solid rgba(48, 54, 61, 0.6)',
                    borderRadius: '16px',
                    fontSize: '14px',
                    color: '#8b949e',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                    fontWeight: 700,
                    animation: 'slideInRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 1s backwards'
                }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: ws?.readyState === WebSocket.OPEN
                            ? 'radial-gradient(circle, #3fb950, #238636)'
                            : 'radial-gradient(circle, #848d97, #6e7681)',
                        boxShadow: ws?.readyState === WebSocket.OPEN
                            ? '0 0 16px rgba(63, 185, 80, 1), 0 0 30px rgba(63, 185, 80, 0.5)'
                            : 'none',
                        animation: ws?.readyState === WebSocket.OPEN ? 'statusPulse 2.5s ease-in-out infinite' : 'none'
                    }}></div>
                    {ws?.readyState === WebSocket.OPEN ? '🟢 Live Updates Active' : '🔴 Connecting...'}
                </div>
            </div>

            {/* CSS Animations - THE MOST! */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(50px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes slideInLeft {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes cardEntrance {
                    from {
                        opacity: 0;
                        transform: translateY(40px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }

                @keyframes textFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                }

                @keyframes iconGlow {
                    0%, 100% { filter: drop-shadow(0 6px 20px rgba(0, 0, 0, 0.5)); }
                    50% { filter: drop-shadow(0 8px 30px rgba(88, 166, 255, 0.6)); }
                }

                @keyframes iconRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes statusPulse {
                    0%, 100% { 
                        opacity: 1; 
                        transform: scale(1);
                        box-shadow: 0 0 20px rgba(63, 185, 80, 1), 0 0 40px rgba(63, 185, 80, 0.5);
                    }
                    50% { 
                        opacity: 0.7; 
                        transform: scale(0.9);
                        box-shadow: 0 0 10px rgba(63, 185, 80, 0.8), 0 0 20px rgba(63, 185, 80, 0.3);
                    }
                }

                @keyframes badgePulse {
                    0%, 100% { 
                        box-shadow: 0 0 20px rgba(63, 185, 80, 0.3);
                    }
                    50% { 
                        box-shadow: 0 0 30px rgba(63, 185, 80, 0.5);
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

                @keyframes glow {
                    0%, 100% { 
                        box-shadow: 0 0 30px rgba(88, 166, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    }
                    50% { 
                        box-shadow: 0 0 50px rgba(88, 166, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
                    }
                }

                @keyframes gradientFlow {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }

                @keyframes gradientShift {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }

                @keyframes buttonPulse {
                    0%, 100% {
                        box-shadow: 0 0 40px rgba(88, 166, 255, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    }
                    50% {
                        box-shadow: 0 0 60px rgba(88, 166, 255, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                    }
                }

                @keyframes float0 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(30px, -30px); }
                    66% { transform: translate(-20px, 40px); }
                }

                @keyframes float1 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(-40px, 30px); }
                    66% { transform: translate(30px, -40px); }
                }

                @keyframes float2 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(25px, 35px); }
                    66% { transform: translate(-35px, -25px); }
                }
                @keyframes shimmerGloss {
                    0% { left: -100%; }
                    50%, 100% { left: 200%; }
                }
            `}</style>
        </div>
    )
}
