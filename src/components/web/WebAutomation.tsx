import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import BrowserViewer from './BrowserViewer'
import ControlPanel from './ControlPanel'
import ActionsList from './ActionsList'
import TimelineView from './TimelineView'
import ModeSwitch from './ModeSwitch'
import EnvironmentSelector from './EnvironmentSelector'
import StepEditorModal from './StepEditorModal'
import VisualAssertCapture from './VisualAssertCapture'
import SaveTestDialog from './SaveTestDialog'
import TestSavedSuccess from './TestSavedSuccess'

interface WebAction {
    id: number
    type: 'click' | 'type' | 'scroll' | 'wait' | 'assert' | 'inspect'
    selector?: string
    data?: any
    timestamp: string
    enabled?: boolean
    status?: 'success' | 'error' | 'warning' | 'pending'
}

export default function WebAutomation() {
    const [mode, setMode] = useState<'browser' | 'inspector' | 'recorder' | 'playback'>('browser')
    const [workMode, setWorkMode] = useState<'record' | 'assert' | 'debug'>('record')
    const [currentEnvironment, setCurrentEnvironment] = useState('dev')
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
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [savedTestName, setSavedTestName] = useState<string | null>(null)
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [showSuccessScreen, setShowSuccessScreen] = useState(false)
    const [testId, setTestId] = useState<string>('')
    const [smartWaitEnabled, setSmartWaitEnabled] = useState(false)
    const [editingAction, setEditingAction] = useState<WebAction | null>(null)
    const [visualBaseline, setVisualBaseline] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

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
        blue: '#58a6ff',
        purple: '#a78bfa',
        cyan: '#56d4dd'
    }


    // Mouse tracking for parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setMousePosition({
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height
                })
            }
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    // Poll for actions while recording
    useEffect(() => {
        if (!isRecording) return

        const interval = setInterval(async () => {
            await loadActions()
        }, 2000) // Poll every 2 seconds

        return () => clearInterval(interval)
    }, [isRecording])

    const launchBrowser = async () => {
        try {
            setIsLoading(true)
            setNavigationProgress(20)

            const res = await axios.post('http://localhost:8000/api/web/launch', {
                browser: 'chrome',
                url: url.trim() || null,  // Send the URL to backend!
                headless: false
            })

            setNavigationProgress(90)

            if (res.data.status === 'launched') {
                setBrowserLaunched(true)
                setCurrentUrl(url.trim() || '')

                // Update screenshot after launch
                setTimeout(async () => {
                    await updateScreenshot()
                }, 1000)

                setNavigationProgress(100)
                setShowSuccessAnimation(true)
                setTimeout(() => setShowSuccessAnimation(false), 3000)
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
                await updateScreenshot()
                setNavigationProgress(100)
                setShowSuccessAnimation(true)
                setTimeout(() => setShowSuccessAnimation(false), 3000)
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
                setSavedTestName(null) // Clear saved test when starting new recording
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


    const saveTest = async () => {
        setShowSaveDialog(true)
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

    const handleSaveTest = async (testName: string) => {
        try {
            const id = Math.floor(Math.random() * 900) + 100
            setTestId(id.toString())
            setSavedTestName(testName)
            console.log(`Test saved: ${testName}`, actions)
            setShowSaveDialog(false)
            setShowSuccessScreen(true)
        } catch (error) {
            console.error('Save test failed:', error)
            alert('Save test failed')
        }
    }

    const handleRunTest = async () => {
        try {
            setShowSuccessScreen(false)
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

    const handleConvertToCode = () => {
        setShowSuccessScreen(false)
        alert('Convert to Code feature coming soon!')
    }

    const handleStartNewTest = () => {
        setShowSuccessScreen(false)
        setSavedTestName(null)
        setActions([])
        setTestId('')
    }

    const handleWait = async (seconds: number) => {
        if (!isRecording) return
        try {
            await axios.post('http://localhost:8000/api/web/action/wait', {
                seconds: seconds
            })
            console.log(`Wait ${seconds}s added to recording`)
            // Reload actions to show the new wait action
            await loadActions()
        } catch (error) {
            console.error('Wait action failed:', error)
        }
    }

    // Timeline handlers
    const handleReorderActions = (newActions: WebAction[]) => {
        setActions(newActions)
        console.log('Actions reordered:', newActions)
    }

    const handleEditAction = (actionId: number) => {
        const action = actions.find(a => a.id === actionId)
        if (action) {
            setEditingAction(action)
        }
    }

    const handleSaveEditedAction = (updatedAction: any) => {
        setActions(prevActions =>
            prevActions.map(action =>
                action.id === updatedAction.id ? updatedAction : action
            )
        )
        setEditingAction(null)
        console.log('Action updated:', updatedAction)
    }

    const handleVisualCapture = () => {
        if (screenshot) {
            setVisualBaseline(screenshot)
            console.log('Visual baseline captured!')
            alert('✅ Visual baseline captured!\n\nThis will be used for visual regression testing.')
        }
    }

    const handleToggleAction = (actionId: number) => {
        setActions(prevActions =>
            prevActions.map(action =>
                action.id === actionId
                    ? { ...action, enabled: action.enabled === false ? true : false }
                    : action
            )
        )
    }

    const handleDeleteAction = (actionId: number) => {
        setActions(prevActions => prevActions.filter(action => action.id !== actionId))
    }

    const handleEnvironmentChange = (envId: string) => {
        setCurrentEnvironment(envId)
        const env = environments.find(e => e.id === envId)
        if (env) {
            setUrl(env.baseUrl)
            console.log(`Environment changed to: ${env.name}`)
        }
    }

    const environments = [
        { id: 'dev', name: 'Development', baseUrl: 'http://localhost:3000', color: '#3fb950' },
        { id: 'staging', name: 'Staging', baseUrl: 'https://staging.example.com', color: '#d29922' },
        { id: 'prod', name: 'Production', baseUrl: 'https://example.com', color: '#f85149' }
    ]

    const handleInteraction = async (x: number, y: number, type: 'click' | 'tap') => {
        if (!browserLaunched) return

        try {
            console.log(`🖱️ Click at (${x}, ${y}) in mode: ${mode}`)

            // In INSPECT mode, get element details AND perform click
            if (mode === 'inspector') {
                const res = await axios.post('http://localhost:8000/api/web/action/inspect', {
                    x, y
                })
                if (res.data.success && res.data.element) {
                    const el = res.data.element

                    // Add inspect action to timeline with element details
                    const inspectAction = {
                        id: actions.length + 1,
                        type: 'inspect' as any,
                        selector: el.selector || `coordinate:${x},${y}`,
                        data: {
                            tag: el.tag,
                            id: el.id,
                            className: el.className,
                            text: el.text,
                            x,
                            y
                        },
                        timestamp: new Date().toISOString(),
                        enabled: true,
                        status: 'success' as any
                    }

                    setActions(prev => [...prev, inspectAction])

                    // Also show details in alert
                    const details = `Element Inspected:\n\n` +
                        `Tag: ${el.tag || 'N/A'}\n` +
                        `ID: ${el.id || 'N/A'}\n` +
                        `Class: ${el.className || 'N/A'}\n` +
                        `Selector: ${el.selector || 'N/A'}\n` +
                        `Text: ${el.text || 'N/A'}\n\n` +
                        `✅ Added to timeline!`
                    alert(details)

                    console.log('📍 Element inspected and added to timeline:', el)

                    // Still perform the click
                    await axios.post('http://localhost:8000/api/web/action/interact', {
                        x, y, type
                    })

                    // Update screenshot
                    setTimeout(() => updateScreenshot(), 300)
                }
                return
            }

            // In TAP mode, perform coordinate-based click
            console.log('⏳ Sending click to backend...')
            const res = await axios.post('http://localhost:8000/api/web/action/interact', {
                x, y, type
            })

            console.log('✅ Click response:', res.data)

            if (res.data.success) {
                // Refresh screenshot immediately after interaction - faster refresh
                setTimeout(() => {
                    console.log('📸 Refreshing screenshot...')
                    updateScreenshot()
                }, 300)


                // If recording, sync actions immediately
                if (isRecording) {
                    console.log('📝 Loading actions...')
                    await loadActions()
                }
            } else {
                console.error('❌ Click failed:', res.data.error)
            }
        } catch (error) {
            console.error('❌ Interaction failed:', error)
        }
    }

    const handleSwipe = async (direction: 'up' | 'down') => {
        if (!browserLaunched) return
        try {
            await axios.post('http://localhost:8000/api/web/action/scroll', {
                direction,
                amount: 200
            })
            setTimeout(() => updateScreenshot(), 500)
            if (isRecording) {
                await loadActions()
            }
        } catch (error) {
            console.error('Swipe/Scroll failed:', error)
        }
    }

    useEffect(() => {
        if (browserLaunched && !isLoading && currentUrl) {
            const interval = setInterval(() => {
                updateScreenshot()
            }, 2000)
            return () => clearInterval(interval)
        }
    }, [browserLaunched, isLoading, currentUrl])

    // Generate particles for background
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 8,
        duration: Math.random() * 20 + 25
    }))

    return (
        <div
            ref={containerRef}
            style={{
                height: '100vh',
                width: '100%',
                color: colors.text,
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: colors.bg
            }}
        >
            {/* AMBIENT BACKGROUND EFFECTS */}
            <div style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
            }}>
                {/* Parallax Orbs */}
                <div style={{
                    position: 'absolute',
                    top: '10%',
                    left: '15%',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${colors.primary}10 0%, transparent 70%)`,
                    filter: 'blur(80px)',
                    animation: 'floatOrb1 30s ease-in-out infinite',
                    transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    right: '15%',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${colors.cyan}10 0%, transparent 70%)`,
                    filter: 'blur(80px)',
                    animation: 'floatOrb2 30s ease-in-out infinite',
                    transform: `translate(${mousePosition.x * -20}px, ${mousePosition.y * -20}px)`
                }} />

                {/* Cyber Grid */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(to right, ${colors.border}11 1px, transparent 1px),
                        linear-gradient(to bottom, ${colors.border}11 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    opacity: 0.4
                }} />

                {/* Floating Particles */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        style={{
                            position: 'absolute',
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            background: p.id % 2 === 0 ? colors.primary : colors.cyan,
                            borderRadius: '50%',
                            left: `${p.x}%`,
                            top: `${p.y}%`,
                            opacity: 0.2,
                            animation: `floatParticle ${p.duration}s linear infinite`,
                            animationDelay: `-${p.delay}s`
                        }}
                    />
                ))}
            </div>

            {/* SETUP SCREEN: CLEAN COMPACT DESIGN */}
            {!browserLaunched ? (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    padding: '40px',
                    animation: 'scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    <div style={{
                        width: '100%',
                        maxWidth: '600px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px'
                    }}>
                        {/* Icon */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            width: '70px',
                            height: '70px',
                            background: `linear-gradient(135deg, ${colors.primary}20, ${colors.cyan}20)`,
                            border: `2px solid ${colors.primary}30`,
                            borderRadius: '20px',
                            boxShadow: `0 10px 30px ${colors.primary}20`,
                            animation: 'float 3s ease-in-out infinite'
                        }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke={colors.primary} strokeWidth="2" />
                                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                    stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>

                        {/* Title */}
                        <div>
                            <div style={{
                                fontSize: '42px',
                                fontWeight: 900,
                                letterSpacing: '-1px',
                                marginBottom: '12px',
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.cyan})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                WEB AUTOMATION
                            </div>
                            <p style={{
                                color: colors.textSecondary,
                                fontSize: '14px',
                                margin: 0
                            }}>
                                Enterprise-grade browser automation
                            </p>
                        </div>

                        {/* Input */}
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && launchBrowser()}
                                placeholder="https://example.com"
                                style={{
                                    width: '100%',
                                    background: `${colors.bgSecondary}dd`,
                                    backdropFilter: 'blur(20px)',
                                    border: `2px solid ${colors.border}`,
                                    borderRadius: '14px',
                                    padding: '18px 50px',
                                    color: colors.text,
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    textAlign: 'center',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = colors.primary;
                                    e.target.style.boxShadow = `0 0 0 4px ${colors.primary}15, 0 10px 30px rgba(0,0,0,0.4)`;
                                    e.target.style.transform = 'translateY(-2px)';
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = colors.border;
                                    e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
                                    e.target.style.transform = 'translateY(0)';
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                left: '20px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '20px',
                                opacity: 0.5,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Button */}
                        <button
                            onClick={launchBrowser}
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                background: `linear-gradient(135deg, ${colors.primary}, #e65b00)`,
                                color: 'white',
                                border: 'none',
                                padding: '16px 32px',
                                borderRadius: '14px',
                                fontSize: '15px',
                                fontWeight: 800,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: `0 10px 30px ${colors.primary}40`,
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = `0 15px 40px ${colors.primary}50`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = `0 10px 30px ${colors.primary}40`;
                                }
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '50%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                animation: 'extremeShimmer 3s infinite'
                            }} />
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid white',
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        animation: 'rotate3D 0.8s linear infinite'
                                    }} />
                                    Launching...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    🚀 Launch Session
                                </span>
                            )}
                        </button>

                        {/* Features */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            justifyContent: 'center',
                            flexWrap: 'wrap'
                        }}>
                            {['AI-Powered', 'Secure', 'Real-time'].map((feature) => (
                                <div key={feature} style={{
                                    padding: '6px 12px',
                                    background: `${colors.bgSecondary}aa`,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '16px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    color: colors.textSecondary
                                }}>
                                    ✓ {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                /* AUTOMATION DASHBOARD */
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1,
                    padding: '32px',
                    animation: 'slideIn 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}>
                    {/* SESSION HEADER - HIDDEN */}
                    {/* <div style={{
                        display: 'flex',
                        gap: '24px',
                        alignItems: 'center',
                        marginBottom: '32px',
                        padding: '16px 32px',
                        background: `linear-gradient(135deg, ${colors.bgSecondary}ee, ${colors.bgTertiary}ee)`,
                        backdropFilter: 'blur(30px)',
                        borderRadius: '24px',
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}>
                        <button
                            onClick={closeBrowser}
                            style={{
                                background: colors.bgTertiary,
                                border: `1px solid ${colors.border}`,
                                color: colors.text,
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                cursor: 'pointer',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.3s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = colors.border}
                            onMouseLeave={(e) => e.currentTarget.style.background = colors.bgTertiary}
                        >
                            ✕
                        </button>

                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 20px',
                            background: `${colors.bg}aa`,
                            borderRadius: '16px',
                            border: `1px solid ${colors.border}`
                        }}>
                            <span style={{ fontSize: '18px', opacity: 0.6 }}>🌐</span>
                            <div style={{
                                flex: 1,
                                color: colors.text,
                                fontSize: '15px',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {currentUrl || url}
                            </div>
                        </div>

                        <div style={{
                            padding: '10px 20px',
                            background: `linear-gradient(135deg, ${colors.success}20, transparent)`,
                            borderRadius: '14px',
                            border: `1px solid ${colors.success}40`,
                            color: colors.success,
                            fontSize: '13px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                background: colors.success,
                                borderRadius: '50%',
                                boxShadow: `0 0 10px ${colors.success}`,
                                animation: 'twinkle 1.5s infinite'
                            }} />
                            ACTIVE
                        </div>
                    </div> */}

                    {/* WORKSPACE */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 380px',
                        gap: '16px',
                        flex: 1,
                        minHeight: 0
                    }}>
                        {/* VIEWER */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflow: 'hidden' }}>
                            {/* Mode Switch and Environment Selector */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center'
                            }}>
                                <ModeSwitch
                                    mode={workMode}
                                    onChange={setWorkMode}
                                    disabled={!browserLaunched}
                                />
                                <EnvironmentSelector
                                    currentEnv={currentEnvironment}
                                    environments={environments}
                                    onChange={handleEnvironmentChange}
                                    disabled={browserLaunched}
                                />
                            </div>

                            {/* TAP / INSPECT Toggle */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                padding: '6px',
                                background: `${colors.bgSecondary}cc`,
                                borderRadius: '20px',
                                border: `1px solid ${colors.border}`
                            }}>
                                {[
                                    { id: 'browser', icon: '👆', label: 'TAP' },
                                    { id: 'inspector', icon: '🔍', label: 'INSPECT' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setMode(t.id as any)}
                                        style={{
                                            flex: 1,
                                            padding: '14px',
                                            borderRadius: '16px',
                                            background: mode === t.id ? colors.primary : 'transparent',
                                            border: 'none',
                                            color: mode === t.id ? 'white' : colors.textSecondary,
                                            fontWeight: 900,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <span style={{ fontSize: '18px' }}>{t.icon}</span> {t.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{
                                flex: 1,
                                background: `linear-gradient(135deg, ${colors.bgSecondary}aa, ${colors.bgTertiary}aa)`,
                                borderRadius: '32px',
                                border: `1px solid ${colors.border}`,
                                overflow: 'hidden',
                                position: 'relative',
                                boxShadow: '0 30px 70px rgba(0,0,0,0.6)',
                                minHeight: 0,
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <BrowserViewer
                                    screenshot={screenshot}
                                    inspectorMode={inspectorMode}
                                    isLoading={isLoading}
                                    onInteract={handleInteraction}
                                    onSwipe={handleSwipe}
                                />
                                {navigationProgress > 0 && navigationProgress < 100 && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        height: '4px',
                                        width: `${navigationProgress}%`,
                                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.cyan})`,
                                        transition: 'width 0.3s'
                                    }} />
                                )}

                                {/* Visual Assertion Capture */}
                                <VisualAssertCapture
                                    screenshot={screenshot}
                                    onCapture={handleVisualCapture}
                                    disabled={!browserLaunched || isLoading}
                                />
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            minHeight: 0,
                            overflow: 'auto'
                        }}>
                            <ControlPanel
                                browserLaunched={browserLaunched}
                                isRecording={isRecording}
                                isLoading={isLoading}
                                onStartRecording={startRecording}
                                onStopRecording={stopRecording}
                                onPlay={saveTest}
                                onWait={handleWait}
                                hasActions={actions.length > 0}
                                smartWaitEnabled={smartWaitEnabled}
                                onSmartWaitToggle={setSmartWaitEnabled}
                            />
                            <div style={{ flex: 1, minHeight: 0 }}>
                                <TimelineView
                                    actions={actions}
                                    isRecording={isRecording}
                                    onReorder={handleReorderActions}
                                    onEdit={handleEditAction}
                                    onToggle={handleToggleAction}
                                    onDelete={handleDeleteAction}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STYLES */}
            <style>{`
                @keyframes floatOrb1 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(40px, -40px); }
                }
                @keyframes floatOrb2 {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(-40px, 40px); }
                }
                @keyframes floatParticle {
                    0% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.2; }
                    90% { opacity: 0.2; }
                    100% { transform: translateY(-100vh); opacity: 0; }
                }
                @keyframes extremeShimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes rotate3D {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 1; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>

            {/* Save Test Dialog */}
            {showSaveDialog && (
                <SaveTestDialog
                    actionsCount={actions.length}
                    onSave={handleSaveTest}
                    onCancel={() => setShowSaveDialog(false)}
                />
            )}

            {/* Test Saved Success Screen */}
            {showSuccessScreen && savedTestName && (
                <TestSavedSuccess
                    testId={testId}
                    testName={savedTestName}
                    actionsCount={actions.length}
                    onRunTest={handleRunTest}
                    onConvertToCode={handleConvertToCode}
                    onStartNewTest={handleStartNewTest}
                />
            )}

            {/* Step Editor Modal */}
            {editingAction && (
                <StepEditorModal
                    action={editingAction}
                    onSave={handleSaveEditedAction}
                    onCancel={() => setEditingAction(null)}
                />
            )}
        </div>
    );
}
