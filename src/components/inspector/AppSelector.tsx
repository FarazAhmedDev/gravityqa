import { useState, useEffect } from 'react'
import axios from 'axios'

interface InstalledApp {
    package_name: string
    app_name: string
    activity: string
    version: string
}

interface Props {
    deviceId: string
    onSelectApp: (app: InstalledApp) => void
    onClose: () => void
}

export default function AppSelector({ deviceId, onSelectApp, onClose }: Props) {
    const [apps, setApps] = useState<InstalledApp[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        loadApps()
    }, [deviceId])

    const loadApps = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`http://localhost:8000/api/installed-apps/${deviceId}`)
            setApps(res.data.apps)
        } catch (error) {
            alert('Failed to load apps from device')
        } finally {
            setLoading(false)
        }
    }

    const filteredApps = apps.filter(app =>
        app.package_name.toLowerCase().includes(filter.toLowerCase()) ||
        app.app_name.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
        }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.95))',
                    backdropFilter: 'blur(30px)',
                    border: '2px solid rgba(240, 183, 47, 0.3)',
                    borderRadius: '24px',
                    width: '650px',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 0 60px rgba(240, 183, 47, 0.2)',
                    animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    overflow: 'hidden'
                }}>
                {/* Header */}
                <div style={{
                    padding: '24px 28px',
                    background: 'linear-gradient(135deg, rgba(240, 183, 47, 0.12), rgba(255, 117, 24, 0.08))',
                    borderBottom: '1.5px solid rgba(240, 183, 47, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '22px',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #f0b72f, #ff7518)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        📱 Select App from Device
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))',
                            border: '1.5px solid rgba(248, 81, 73, 0.3)',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            color: '#f85149',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: 700,
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 81, 73, 0.25), rgba(218, 54, 51, 0.2))'
                            e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))'
                            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '20px 24px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search apps..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '14px 18px',
                            background: 'rgba(13, 17, 23, 0.7)',
                            border: '1.5px solid rgba(48, 54, 61, 0.6)',
                            borderRadius: '12px',
                            color: '#e6edf3',
                            fontSize: '15px',
                            fontWeight: 600,
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#f0b72f'
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(240, 183, 47, 0.15), 0 0 20px rgba(240, 183, 47, 0.2)'
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.6)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    />
                </div>

                {/* Apps List */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '0 24px 20px 24px'
                }}>
                    {loading ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#8b949e',
                            fontSize: '16px',
                            fontWeight: 600
                        }}>
                            <div style={{
                                fontSize: '48px',
                                marginBottom: '16px',
                                animation: 'spin 2s linear infinite'
                            }}>⏳</div>
                            Loading apps...
                        </div>
                    ) : filteredApps.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: '#7d8590',
                            fontSize: '16px',
                            fontWeight: 600
                        }}>
                            <div style={{
                                fontSize: '64px',
                                marginBottom: '16px',
                                opacity: 0.3
                            }}>📱</div>
                            No apps found
                        </div>
                    ) : (
                        filteredApps.map((app, idx) => (
                            <div
                                key={idx}
                                onClick={() => {
                                    onSelectApp(app)
                                    onClose()
                                }}
                                style={{
                                    position: 'relative',
                                    padding: '18px 20px',
                                    background: 'rgba(13, 17, 23, 0.6)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1.5px solid rgba(48, 54, 61, 0.5)',
                                    borderRadius: '14px',
                                    marginBottom: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    animation: `cardEntrance 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.05}s backwards`,
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(240, 183, 47, 0.6)'
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(240, 183, 47, 0.12), rgba(255, 117, 24, 0.08))'
                                    e.currentTarget.style.transform = 'translateX(4px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = '0 0 30px rgba(240, 183, 47, 0.2), 0 8px 20px rgba(0, 0, 0, 0.3)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = 'rgba(48, 54, 61, 0.5)'
                                    e.currentTarget.style.background = 'rgba(13, 17, 23, 0.6)'
                                    e.currentTarget.style.transform = 'translateX(0) scale(1)'
                                    e.currentTarget.style.boxShadow = 'none'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#ffffff',
                                            marginBottom: '6px',
                                            letterSpacing: '-0.3px'
                                        }}>
                                            {app.app_name}
                                        </div>
                                        <div style={{
                                            fontSize: '13px',
                                            color: '#7d8590',
                                            fontFamily: 'Monaco, Consolas, monospace',
                                            marginBottom: '6px',
                                            fontWeight: 600
                                        }}>
                                            {app.package_name}
                                        </div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#f0b72f',
                                            fontWeight: 600
                                        }}>
                                            🎯 {app.activity}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#8b949e',
                                        padding: '6px 12px',
                                        background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15), rgba(88, 166, 255, 0.1))',
                                        border: '1px solid rgba(88, 166, 255, 0.3)',
                                        borderRadius: '8px',
                                        fontWeight: 700
                                    }}>
                                        v{app.version}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 28px',
                    background: 'linear-gradient(135deg, rgba(240, 183, 47, 0.08), rgba(255, 117, 24, 0.05))',
                    borderTop: '1.5px solid rgba(240, 183, 47, 0.2)',
                    fontSize: '13px',
                    color: '#8b949e',
                    textAlign: 'center',
                    fontWeight: 700
                }}>
                    📊 Found {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''} • Click to select
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(50px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes cardEntrance {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
