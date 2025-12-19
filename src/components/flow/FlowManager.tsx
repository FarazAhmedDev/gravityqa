import { useState, useEffect } from 'react'
import axios from 'axios'

interface Flow {
    id: number
    name: string
    description: string
    device_info: {
        device_id: string
        name: string
        platform: string
    }
    app_info: {
        package: string
        name: string
    }
    steps: any[]
    created_at: string
}

export default function FlowManager() {
    const [flows, setFlows] = useState<Flow[]>([])
    const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null)
    const [devices, setDevices] = useState<any[]>([])
    const [selectedDevice, setSelectedDevice] = useState<string>('')
    const [isPlaying, setIsPlaying] = useState(false)
    const [selectedApk, setSelectedApk] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isInstalling, setIsInstalling] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [apkUploaded, setApkUploaded] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        fetchFlows()
        fetchDevices()
        const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY })
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const fetchFlows = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/flows/')
            setFlows(res.data)
        } catch (error) {
            console.error('Failed to fetch flows:', error)
        }
    }

    const fetchDevices = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/devices/')
            setDevices(res.data.filter((d: any) => d.is_connected))
        } catch (error) {
            console.error('Failed to fetch devices:', error)
        }
    }

    const handlePlayFlow = async () => {
        if (!selectedFlow || !selectedDevice) {
            alert('Please select both flow and device')
            return
        }
        setIsPlaying(true)
        try {
            const res = await axios.post('http://localhost:8000/api/playback/start', {
                flow_id: selectedFlow.id,
                device_id: selectedDevice
            })
            const { total_steps, successful_steps, success_rate } = res.data
            alert(`✅ Playback Complete!\n\nTotal Steps: ${total_steps}\nSuccessful: ${successful_steps}\nSuccess Rate: ${success_rate.toFixed(1)}%`)
        } catch (error: any) {
            alert('❌ Playback failed: ' + (error.response?.data?.detail || error.message))
        } finally {
            setIsPlaying(false)
        }
    }

    const handleDeleteFlow = async (id: number) => {
        if (!confirm('Delete this flow?')) return
        try {
            await axios.delete(`http://localhost:8000/api/flows/${id}`)
            fetchFlows()
            if (selectedFlow?.id === id) setSelectedFlow(null)
        } catch (error) {
            alert('Failed to delete flow')
        }
    }

    const handleApkUpload = async (file: File) => {
        console.log('[APK Upload] Starting upload...', file.name)
        if (!selectedDevice) {
            console.error('[APK Upload] No device selected!')
            alert('⚠️ Please select a device first before uploading APK')
            return
        }
        console.log('[APK Upload] Selected device:', selectedDevice)
        setSelectedApk(file)
        setIsUploading(true)
        setUploadProgress(0)
        try {
            const formData = new FormData()
            formData.append('file', file)
            console.log('[APK Upload] Uploading to backend...')
            const res = await axios.post('http://localhost:8000/api/inspector/upload-apk/', formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0
                    console.log('[APK Upload] Progress:', progress + '%')
                    setUploadProgress(progress)
                }
            })
            console.log('[APK Upload] Upload successful!', res.data)
            setApkUploaded(true)
            setIsUploading(false)
            console.log('[APK Upload] Starting installation...')
            await handleInstallApk(res.data.package_name)
        } catch (error: any) {
            console.error('[APK Upload] Error:', error)
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
            alert('❌ APK upload failed: ' + errorMsg)
            setIsUploading(false)
            setApkUploaded(false)
        }
    }

    const handleInstallApk = async (packageName: string) => {
        if (!selectedDevice) return
        console.log('[APK Install] Installing package:', packageName)
        setIsInstalling(true)
        try {
            await axios.post('http://localhost:8000/api/inspector/install-apk/', {
                device_id: selectedDevice,
                package_name: packageName
            })
            console.log('[APK Install] Installation successful!')
            alert('✅ APK installed successfully! Ready to run test.')
            setIsInstalling(false)
        } catch (error: any) {
            console.error('[APK Install] Error:', error)
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error'
            alert('❌ Installation failed: ' + errorMsg)
            setIsInstalling(false)
            setApkUploaded(false)
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
                    radial-gradient(circle at ${20 + mousePos.x * 0.02}% ${30 + mousePos.y * 0.02}%, rgba(88, 166, 255, 0.12) 0%, transparent 50%),
                    radial-gradient(circle at ${80 - mousePos.x * 0.01}% ${70 - mousePos.y * 0.01}%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
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
                    background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(88, 166, 255, 0.3)' : 'rgba(139, 92, 246, 0.3)'}, transparent)`,
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
                        background: 'linear-gradient(135deg, rgba(46, 160, 67, 0.2), rgba(35, 134, 54, 0.2))',
                        borderRadius: '24px',
                        border: '1.5px solid rgba(46, 160, 67, 0.3)',
                        marginBottom: '20px',
                        animation: 'glow 3s ease-in-out infinite',
                        boxShadow: '0 0 30px rgba(46, 160, 67, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}>
                        <span style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #3fb950, #56d364, #3fb950)',
                            backgroundSize: '200% 100%',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                            animation: 'gradientFlow 3s linear infinite'
                        }}>
                            🎬 Test Flows
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: '48px',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #ffffff 0%, #3fb950 50%, #56d364 100%)',
                        backgroundSize: '200% 100%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '14px',
                        letterSpacing: '-2px',
                        animation: 'gradientFlow 5s ease infinite, textFloat 4s ease-in-out infinite',
                        textShadow: '0 0 40px rgba(46, 160, 67, 0.3)'
                    }}>
                        Saved Test Flows
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        color: '#8b949e',
                        fontWeight: 600,
                        animation: 'fadeIn 1s ease-out 0.3s backwards'
                    }}>
                        {flows.length > 0 ? `🎯 ${flows.length} test flow${flows.length !== 1 ? 's' : ''} ready` : '⏳ No flows saved yet'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 260px)' }}>
                    {/* Flows List */}
                    <div style={{
                        flex: 1,
                        overflow: 'auto',
                        paddingRight: '8px',
                        animation: 'slideUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s backwards'
                    }}>
                        {flows.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {flows.map((flow, index) => (
                                    <div
                                        key={flow.id}
                                        onClick={() => setSelectedFlow(flow)}
                                        style={{
                                            position: 'relative',
                                            padding: '24px',
                                            background: selectedFlow?.id === flow.id
                                                ? 'linear-gradient(135deg, rgba(46, 160, 67, 0.18), rgba(35, 134, 54, 0.15))'
                                                : 'rgba(22, 27, 34, 0.5)',
                                            backdropFilter: 'blur(30px)',
                                            borderRadius: '20px',
                                            border: selectedFlow?.id === flow.id
                                                ? '2.5px solid rgba(46, 160, 67, 0.6)'
                                                : '2px solid rgba(48, 54, 61, 0.5)',
                                            cursor: 'pointer',
                                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: selectedFlow?.id === flow.id
                                                ? '0 0 60px rgba(46, 160, 67, 0.4), 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                                                : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                                            animation: `cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s backwards`,
                                            overflow: 'hidden',
                                            boxSizing: 'border-box'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedFlow?.id !== flow.id) {
                                                e.currentTarget.style.borderColor = 'rgba(46, 160, 67, 0.5)'
                                                e.currentTarget.style.borderWidth = '2.5px'
                                                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
                                                e.currentTarget.style.boxShadow = '0 0 40px rgba(46, 160, 67, 0.3), 0 16px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedFlow?.id !== flow.id) {
                                                e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.5)'
                                                e.currentTarget.style.borderWidth = '2px'
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                            }
                                        }}
                                    >
                                        {selectedFlow?.id === flow.id && (
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
                                                    background: 'conic-gradient(from 0deg, transparent, rgba(46, 160, 67, 0.1), transparent)',
                                                    animation: 'rotate 8s linear infinite'
                                                }}></div>
                                            </>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'start',
                                            marginBottom: '16px',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                                <h3 style={{
                                                    fontSize: '20px',
                                                    fontWeight: 700,
                                                    color: '#ffffff',
                                                    marginBottom: '8px',
                                                    letterSpacing: '-0.5px',
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word'
                                                }}>
                                                    {flow.name}
                                                </h3>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: '#8b949e',
                                                    lineHeight: '1.5',
                                                    wordBreak: 'break-word',
                                                    overflowWrap: 'break-word'
                                                }}>
                                                    {flow.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteFlow(flow.id)
                                                }}
                                                style={{
                                                    padding: '10px 14px',
                                                    background: 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))',
                                                    border: '1.5px solid rgba(248, 81, 73, 0.3)',
                                                    borderRadius: '10px',
                                                    color: '#f85149',
                                                    fontSize: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s',
                                                    fontWeight: 700
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 81, 73, 0.25), rgba(218, 54, 51, 0.2))'
                                                    e.currentTarget.style.borderColor = '#f85149'
                                                    e.currentTarget.style.transform = 'scale(1.1)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))'
                                                    e.currentTarget.style.borderColor = 'rgba(248, 81, 73, 0.3)'
                                                    e.currentTarget.style.transform = 'scale(1)'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            gap: '20px',
                                            flexWrap: 'wrap',
                                            fontSize: '13px',
                                            color: '#7d8590',
                                            marginBottom: '12px',
                                            position: 'relative',
                                            zIndex: 1,
                                            overflow: 'hidden'
                                        }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>
                                                📱 {flow.device_info.name}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45%' }}>
                                                📦 {flow.app_info.name || flow.app_info.package}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, flexShrink: 0 }}>
                                                ▶️ {flow.steps.length} steps
                                            </span>
                                        </div>

                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6e7681',
                                            fontWeight: 600,
                                            position: 'relative',
                                            zIndex: 1,
                                            wordBreak: 'break-word',
                                            overflowWrap: 'break-word'
                                        }}>
                                            Created: {new Date(flow.created_at).toLocaleString()}
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
                                height: '100%',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    fontSize: '96px',
                                    marginBottom: '24px',
                                    opacity: 0.25,
                                    animation: 'iconFloat 5s ease-in-out infinite, iconRotate 20s linear infinite'
                                }}>
                                    🎬
                                </div>
                                <h3 style={{
                                    fontSize: '28px',
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #e6edf3, #8b949e)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '12px'
                                }}>
                                    No flows saved yet
                                </h3>
                                <p style={{ fontSize: '15px', color: '#7d8590', fontWeight: 500 }}>
                                    Record a test in Inspector tab to create flows
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Flow Details Panel */}
                    {selectedFlow && (
                        <div style={{
                            width: '440px',
                            background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.7), rgba(22, 27, 34, 0.5))',
                            backdropFilter: 'blur(30px)',
                            borderRadius: '24px',
                            border: '2px solid rgba(48, 54, 61, 0.5)',
                            padding: '32px',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                            animation: 'slideInRight 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            maxHeight: 'calc(100vh - 260px)',
                            overflowY: 'auto',
                            overflowX: 'hidden'
                        }}>
                            <h3 style={{
                                fontSize: '24px',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #ffffff, #3fb950)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '28px',
                                letterSpacing: '-0.5px'
                            }}>
                                Flow Details
                            </h3>

                            {/* App Info Card */}
                            <div style={{
                                marginBottom: '24px',
                                padding: '20px',
                                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.12), rgba(88, 166, 255, 0.08))',
                                borderRadius: '16px',
                                border: '1.5px solid rgba(88, 166, 255, 0.3)',
                                boxShadow: '0 10px 30px rgba(88, 166, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                            }}>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#8b949e',
                                    marginBottom: '10px',
                                    fontWeight: 700
                                }}>
                                    📱 Test will run on:
                                </div>
                                <div style={{
                                    fontSize: '18px',
                                    background: 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 800,
                                    marginBottom: '6px'
                                }}>
                                    {selectedFlow.app_info.name || 'Unknown App'}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#7d8590',
                                    fontFamily: 'monospace',
                                    fontWeight: 600
                                }}>
                                    {selectedFlow.app_info.package}
                                </div>
                                <div style={{
                                    marginTop: '14px',
                                    padding: '10px 14px',
                                    background: 'linear-gradient(135deg, rgba(46, 160, 67, 0.18), rgba(46, 160, 67, 0.12))',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    color: '#3fb950',
                                    fontWeight: 700,
                                    border: '1px solid rgba(46, 160, 67, 0.3)'
                                }}>
                                    ✅ App data will be cleared before each run
                                </div>
                            </div>

                            {/* APK Upload Section */}
                            <div style={{
                                marginBottom: '24px',
                                padding: '22px',
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.08))',
                                borderRadius: '16px',
                                border: '1.5px solid rgba(139, 92, 246, 0.3)',
                                boxShadow: '0 10px 30px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                            }}>
                                <div style={{
                                    fontSize: '15px',
                                    color: '#8b949e',
                                    marginBottom: '14px',
                                    fontWeight: 700
                                }}>
                                    🔄 Test on New Build (Optional)
                                </div>
                                <p style={{
                                    fontSize: '13px',
                                    color: '#7d8590',
                                    marginBottom: '16px',
                                    lineHeight: '1.6',
                                    fontWeight: 500
                                }}>
                                    Upload a new APK version to test this flow on a different build
                                </p>

                                {!isUploading && !isInstalling && !apkUploaded && (
                                    <>
                                        {!selectedDevice && (
                                            <div style={{
                                                padding: '14px 20px',
                                                background: 'rgba(125, 133, 144, 0.1)',
                                                border: '1.5px dashed rgba(125, 133, 144, 0.3)',
                                                borderRadius: '12px',
                                                textAlign: 'center',
                                                fontSize: '13px',
                                                color: '#6e7681',
                                                fontWeight: 700
                                            }}>
                                                ⚠️ Select a device first to enable APK upload
                                            </div>
                                        )}

                                        {selectedDevice && (
                                            <label style={{
                                                display: 'block',
                                                padding: '16px 24px',
                                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(139, 92, 246, 0.12))',
                                                border: '2px dashed rgba(139, 92, 246, 0.5)',
                                                borderRadius: '14px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s',
                                                fontSize: '15px',
                                                color: '#a78bfa',
                                                fontWeight: 800
                                            }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.18))'
                                                    e.currentTarget.style.borderColor = '#a78bfa'
                                                    e.currentTarget.style.transform = 'scale(1.02)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(139, 92, 246, 0.12))'
                                                    e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)'
                                                    e.currentTarget.style.transform = 'scale(1)'
                                                }}
                                            >
                                                📦 Choose New APK File
                                                <input
                                                    type="file"
                                                    accept=".apk"
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) handleApkUpload(file)
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </>
                                )}

                                {(isUploading || isInstalling) && (
                                    <div>
                                        <div style={{
                                            fontSize: '15px',
                                            color: '#a78bfa',
                                            fontWeight: 800,
                                            marginBottom: '12px',
                                            textAlign: 'center'
                                        }}>
                                            {isUploading ? `📤 Uploading... ${uploadProgress}%` : '📲 Installing APK...'}
                                        </div>
                                        {isUploading && (
                                            <div style={{
                                                background: '#21262d',
                                                height: '8px',
                                                borderRadius: '4px',
                                                overflow: 'hidden',
                                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)'
                                            }}>
                                                <div style={{
                                                    width: `${uploadProgress}%`,
                                                    height: '100%',
                                                    background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                                                    transition: 'width 0.3s ease',
                                                    boxShadow: '0 0 10px rgba(139, 92, 246, 0.6)'
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {apkUploaded && (
                                    <div style={{
                                        padding: '14px',
                                        background: 'linear-gradient(135deg, rgba(46, 160, 67, 0.18), rgba(46, 160, 67, 0.12))',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        color: '#3fb950',
                                        fontWeight: 800,
                                        textAlign: 'center',
                                        border: '1px solid rgba(46, 160, 67, 0.3)',
                                        boxShadow: '0 0 20px rgba(46, 160, 67, 0.2)'
                                    }}>
                                        ✅ New APK Installed! Ready to test.
                                    </div>
                                )}
                            </div>

                            {/* Device Selector */}
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '14px',
                                    color: '#8b949e',
                                    marginBottom: '12px',
                                    fontWeight: 700
                                }}>
                                    Select Device for Playback
                                </label>
                                <select
                                    value={selectedDevice}
                                    onChange={(e) => setSelectedDevice(e.target.value)}
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
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#58a6ff'
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 166, 255, 0.15), 0 0 20px rgba(88, 166, 255, 0.2)'
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    <option value="">Choose device...</option>
                                    {devices.map(d => (
                                        <option key={d.device_id} value={d.device_id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Play Button */}
                            <button
                                onClick={handlePlayFlow}
                                disabled={!selectedDevice || isPlaying}
                                style={{
                                    width: '100%',
                                    padding: '18px 36px',
                                    fontSize: '18px',
                                    background: (!selectedDevice || isPlaying)
                                        ? 'rgba(48, 54, 61, 0.5)'
                                        : 'linear-gradient(135deg, #3fb950 0%, #238636 50%, #3fb950 100%)',
                                    backgroundSize: '200% 100%',
                                    color: (!selectedDevice || isPlaying) ? '#6e7681' : 'white',
                                    border: 'none',
                                    borderRadius: '14px',
                                    cursor: (!selectedDevice || isPlaying) ? 'not-allowed' : 'pointer',
                                    fontWeight: 900,
                                    boxShadow: (!selectedDevice || isPlaying)
                                        ? 'none'
                                        : '0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                    transition: 'all 0.4s',
                                    marginBottom: '28px',
                                    animation: (!selectedDevice || isPlaying) ? 'none' : 'buttonPulse 2.5s ease-in-out infinite'
                                }}
                                onMouseEnter={(e) => {
                                    if (selectedDevice && !isPlaying) {
                                        e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                        e.currentTarget.style.boxShadow = '0 0 60px rgba(46, 160, 67, 0.8), 0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                        e.currentTarget.style.backgroundPosition = '100% 0'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (selectedDevice && !isPlaying) {
                                        e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                        e.currentTarget.style.boxShadow = '0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                        e.currentTarget.style.backgroundPosition = '0% 0'
                                    }
                                }}
                            >
                                {isPlaying ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                        Playing...
                                    </span>
                                ) : (
                                    `⚡ Play Flow (${selectedFlow.steps.length} steps)`
                                )}
                            </button>

                            {/* Steps Preview */}
                            <div style={{
                                position: 'relative',
                                padding: '2px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, rgba(46, 160, 67, 0.3), rgba(35, 134, 54, 0.3))'
                            }}>
                                <div style={{
                                    background: 'rgba(13, 17, 23, 0.9)',
                                    borderRadius: '14px',
                                    padding: '20px'
                                }}>
                                    <h4 style={{
                                        fontSize: '16px',
                                        fontWeight: 800,
                                        color: '#e6edf3',
                                        marginBottom: '16px'
                                    }}>
                                        🎬 Test Steps Preview:
                                    </h4>
                                    <div style={{
                                        maxHeight: '350px',
                                        overflowY: 'auto',
                                        paddingRight: '8px'
                                    }}>
                                        {selectedFlow.steps.map((step: any, idx: number) => (
                                            <div
                                                key={idx}
                                                style={{
                                                    padding: '12px 14px',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    borderRadius: '10px',
                                                    marginBottom: '8px',
                                                    border: '1px solid rgba(48, 54, 61, 0.5)',
                                                    transition: 'all 0.3s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(46, 160, 67, 0.1)'
                                                    e.currentTarget.style.borderColor = 'rgba(46, 160, 67, 0.4)'
                                                    e.currentTarget.style.transform = 'translateX(4px)'
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
                                                    e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.5)'
                                                    e.currentTarget.style.transform = 'translateX(0)'
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#3fb950',
                                                    fontWeight: 700,
                                                    marginBottom: '6px'
                                                }}>
                                                    Step {step.step}: {step.action.toUpperCase()}
                                                </div>
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#8b949e',
                                                    lineHeight: '1.5',
                                                    fontWeight: 500
                                                }}>
                                                    {step.description}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
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
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes textFloat {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-4px); }
                }
                @keyframes iconRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
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
                    0%, 100% { box-shadow: 0 0 30px rgba(46, 160, 67, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1); }
                    50% { box-shadow: 0 0 50px rgba(46, 160, 67, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15); }
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
                @keyframes buttonPulse {
                    0%, 100% { box-shadow: 0 0 40px rgba(46, 160, 67, 0.6), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2); }
                    50% { box-shadow: 0 0 60px rgba(46, 160, 67, 0.8), 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25); }
                }
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
            `}</style>
        </div>
    )
}
