import { useState, useEffect } from 'react'
import axios from 'axios'
import BrowserViewer from './BrowserViewer'
import ControlPanel from './ControlPanel'
import ActionsList from './ActionsList'

interface WebAction {
    id: number
    type: 'click' | 'type' | 'scroll'
    selector?: string
    data?: any
    timestamp: string
}

export default function WebAutomation() {
    const [url, setUrl] = useState('https://example.com')
    const [browserLaunched, setBrowserLaunched] = useState(false)
    const [currentUrl, setCurrentUrl] = useState('')
    const [screenshot, setScreenshot] = useState<string | null>(null)
    const [isRecording, setIsRecording] = useState(false)
    const [inspectorMode, setInspectorMode] = useState(false)
    const [actions, setActions] = useState<WebAction[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [pageTitle, setPageTitle] = useState('')
    const [navigationProgress, setNavigationProgress] = useState(0)
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        success: '#3fb950',
        error: '#f85149',
        blue: '#58a6ff'
    }

    const launchBrowser = async () => {
        try {
            setIsLoading(true)
            setNavigationProgress(20)

            const res = await axios.post('http://localhost:8000/api/web/browser/launch', {
                headless: false
            })

            setNavigationProgress(100)

            if (res.data.success) {
                setBrowserLaunched(true)
                setShowSuccessAnimation(true)
                setTimeout(() => setShowSuccessAnimation(false), 2000)
            }
        } catch (error) {
            console.error('Failed to launch browser:', error)
            alert('Failed to launch browser')
        } finally {
            setTimeout(() => {
                setIsLoading(false)
                setNavigationProgress(0)
            }, 500)
        }
    }

    const navigateToUrl = async () => {
        if (!url.trim()) return

        try {
            setIsLoading(true)
            setNavigationProgress(0)

            // Animate progress
            const progressInterval = setInterval(() => {
                setNavigationProgress(prev => {
                    if (prev >= 90) return prev
                    return prev + 10
                })
            }, 100)

            const res = await axios.post('http://localhost:8000/api/web/browser/navigate', {
                url: url
            })

            clearInterval(progressInterval)
            setNavigationProgress(95)

            if (res.data.success) {
                setCurrentUrl(res.data.url)
                setPageTitle(res.data.title || '')

                // Get screenshot
                await updateScreenshot()

                setNavigationProgress(100)
                setShowSuccessAnimation(true)
                setTimeout(() => setShowSuccessAnimation(false), 2000)
            }
        } catch (error) {
            console.error('Navigation failed:', error)
            alert('Navigation failed')
        } finally {
            setTimeout(() => {
                setIsLoading(false)
                setNavigationProgress(0)
            }, 500)
        }
    }

    const updateScreenshot = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/web/browser/screenshot')
            if (res.data.success) {
                setScreenshot(res.data.screenshot)
            }
        } catch (error) {
            console.error('Screenshot failed:', error)
        }
    }

    const startRecording = async () => {
        try {
            const res = await axios.post('http://localhost:8000/api/web/record/start')
            if (res.data.success) {
                setIsRecording(true)
                setActions([])
            }
        } catch (error) {
            console.error('Start recording failed:', error)
        }
    }

    const stopRecording = async () => {
        try {
            const res = await axios.post('http://localhost:8000/api/web/record/stop')
            if (res.data.success) {
                setIsRecording(false)
                await loadActions()
            }
        } catch (error) {
            console.error('Stop recording failed:', error)
        }
    }

    const loadActions = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/web/record/actions')
            if (res.data.success) {
                setActions(res.data.actions)
            }
        } catch (error) {
            console.error('Load actions failed:', error)
        }
    }

    const playActions = async () => {
        try {
            setIsLoading(true)
            const res = await axios.post('http://localhost:8000/api/web/playback/start', {
                actions: actions
            })
            if (res.data.success) {
                await updateScreenshot()
            }
        } catch (error) {
            console.error('Playback failed:', error)
            alert('Playback failed')
        } finally {
            setIsLoading(false)
        }
    }

    const closeBrowser = async () => {
        try {
            await axios.delete('http://localhost:8000/api/web/browser/close')
            setBrowserLaunched(false)
            setScreenshot(null)
            setCurrentUrl('')
            setActions([])
            setIsRecording(false)
            setPageTitle('')
        } catch (error) {
            console.error('Close browser failed:', error)
        }
    }

    // Auto-update screenshot
    useEffect(() => {
        if (browserLaunched && !isLoading && currentUrl) {
            const interval = setInterval(() => {
                updateScreenshot()
            }, 2000)
            return () => clearInterval(interval)
        }
    }, [browserLaunched, isLoading, currentUrl])

    return (
        <div style={{
            background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0e14 100%)`,
            minHeight: '100vh',
            color: colors.text,
            padding: '32px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated background particles */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `radial-gradient(circle at 20% 50%, ${colors.primary}08 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, ${colors.blue}08 0%, transparent 50%)`,
                animation: 'float 20s ease-in-out infinite',
                pointerEvents: 'none'
            }} />

            {/* Header with premium styling */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: `linear-gradient(135deg, ${colors.bgSecondary}cc, ${colors.bgTertiary}cc)`,
                    backdropFilter: 'blur(20px)',
                    padding: '16px 28px',
                    borderRadius: '16px',
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 
                                inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        boxShadow: `0 0 30px ${colors.primary}40`,
                        animation: browserLaunched ? 'pulse 3s ease-in-out infinite' : 'none'
                    }}>
                        🌐
                    </div>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '32px',
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${colors.text}, ${colors.textSecondary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}>
                            Web Automation
                        </h1>
                        <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '13px',
                            color: colors.textSecondary,
                            fontWeight: 500
                        }}>
                            Powered by Playwright
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div style={{
                    padding: '12px 20px',
                    background: browserLaunched
                        ? `linear-gradient(135deg, ${colors.success}20, ${colors.success}10)`
                        : `${colors.textSecondary}20`,
                    border: `2px solid ${browserLaunched ? colors.success : colors.textSecondary}`,
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: browserLaunched ? `0 0 20px ${colors.success}30` : 'none',
                    animation: browserLaunched ? 'slideIn 0.5s ease-out' : 'none'
                }}>
                    <span style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: browserLaunched ? colors.success : colors.textSecondary,
                        boxShadow: browserLaunched ? `0 0 10px ${colors.success}` : 'none',
                        animation: browserLaunched ? 'ping 2s ease-in-out infinite' : 'none'
                    }} />
                    {browserLaunched ? 'BROWSER ACTIVE' : 'NOT CONNECTED'}
                </div>

                {showSuccessAnimation && (
                    <div style={{
                        position: 'absolute',
                        right: 0,
                        fontSize: '48px',
                        animation: 'successPop 2s ease-out forwards'
                    }}>
                        ✨
                    </div>
                )}
            </div>

            {/* Premium Browser Address Bar */}
            <div style={{
                background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
                backdropFilter: 'blur(30px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5), 
                            inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden'
            }}>
                {/* Progress bar */}
                {navigationProgress > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '3px',
                        width: `${navigationProgress}%`,
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.blue})`,
                        transition: 'width 0.3s ease-out',
                        boxShadow: `0 0 10px ${colors.primary}`
                    }} />
                )}

                {/* URL Bar */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                    {/* Lock Icon */}
                    <div style={{
                        padding: '12px',
                        background: `${colors.success}15`,
                        borderRadius: '10px',
                        border: `1px solid ${colors.success}30`
                    }}>
                        <span style={{ fontSize: '18px' }}>🔒</span>
                    </div>

                    {/* URL Input */}
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && browserLaunched && navigateToUrl()}
                        placeholder="Enter website URL..."
                        disabled={!browserLaunched}
                        style={{
                            flex: 1,
                            background: colors.bgTertiary,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '12px',
                            padding: '14px 20px',
                            color: colors.text,
                            fontSize: '15px',
                            fontWeight: 500,
                            transition: 'all 0.3s ease',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = colors.primary
                            e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.border
                            e.target.style.boxShadow = 'none'
                        }}
                    />

                    {/* Action Buttons */}
                    {!browserLaunched ? (
                        <button
                            onClick={launchBrowser}
                            disabled={isLoading}
                            style={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '14px 32px',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '15px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                boxShadow: `0 4px 20px ${colors.success}40, inset 0 1px 0 rgba(255,255,255,0.3)`,
                                transition: 'all 0.3s ease',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = `0 8px 30px ${colors.success}60`)}
                            onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = `0 4px 20px ${colors.success}40`)}
                        >
                            {isLoading ? '⏳ Launching...' : '🚀 Launch Browser'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={navigateToUrl}
                                disabled={isLoading}
                                style={{
                                    position: 'relative',
                                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: `0 4px 20px ${colors.primary}40`,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1.05)', e.currentTarget.style.boxShadow = `0 6px 25px ${colors.primary}60`)}
                                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.boxShadow = `0 4px 20px ${colors.primary}40`)}
                            >
                                {isLoading ? '⏳' : '→'} Go
                            </button>
                            <button
                                onClick={closeBrowser}
                                style={{
                                    background: `linear-gradient(135deg, ${colors.error}, ${colors.error}dd)`,
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px 24px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: `0 4px 20px ${colors.error}40`,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)', e.currentTarget.style.boxShadow = `0 6px 25px ${colors.error}60`)}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)', e.currentTarget.style.boxShadow = `0 4px 20px ${colors.error}40`)}
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>

                {/* Inspector & Page Info */}
                {browserLaunched && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        animation: 'slideIn 0.5s ease-out'
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            padding: '8px 16px',
                            background: inspectorMode ? `${colors.primary}15` : 'transparent',
                            borderRadius: '10px',
                            border: `2px solid ${inspectorMode ? colors.primary : 'transparent'}`,
                            transition: 'all 0.3s ease'
                        }}>
                            <input
                                type="checkbox"
                                checked={inspectorMode}
                                onChange={(e) => setInspectorMode(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                🔍 Inspector Mode
                            </span>
                        </label>
                        {pageTitle && (
                            <div style={{
                                flex: 1,
                                padding: '8px 16px',
                                background: `${colors.blue}10`,
                                borderRadius: '10px',
                                border: `1px solid ${colors.blue}30`,
                                fontSize: '14px',
                                fontWeight: 500,
                                color: colors.blue,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                📄 {pageTitle}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content with Premium Layout */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                height: 'calc(100vh - 360px)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Browser Viewer with Glass Effect */}
                <div style={{
                    background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
                    backdropFilter: 'blur(20px)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: `0 20px 60px rgba(0, 0, 0, 0.6), 
                                inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                    animation: 'scaleIn 0.5s ease-out'
                }}>
                    <BrowserViewer
                        screenshot={screenshot}
                        inspectorMode={inspectorMode}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right Panel */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    animation: 'slideInRight 0.6s ease-out'
                }}>
                    <ControlPanel
                        browserLaunched={browserLaunched}
                        isRecording={isRecording}
                        isLoading={isLoading}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onPlay={playActions}
                        hasActions={actions.length > 0}
                    />
                    <ActionsList
                        actions={actions}
                        isRecording={isRecording}
                    />
                </div>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(5deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes ping {
                    0% { transform: scale(1); opacity: 1; }
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes successPop {
                    0% { opacity: 0; transform: scale(0) rotate(0deg); }
                    50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
                    100% { opacity: 0; transform: scale(2) rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
