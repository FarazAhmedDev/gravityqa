import { useState, useEffect, useRef } from 'react'
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
    const [mode, setMode] = useState<'browser' | 'inspector' | 'recorder' | 'playback'>('browser')
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

    const handleWait = async (seconds: number) => {
        if (!isRecording) return
        try {
            await axios.post('http://localhost:8000/api/web/action/wait', {
                seconds: seconds
            })
            console.log(`Wait ${seconds}s added to recording`)
        } catch (error) {
            console.error('Wait action failed:', error)
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

    // Generate particles for background (slower, smoother)
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 8,
        duration: Math.random() * 20 + 25  // Slower: 25-45s instead of 15-25s
    }))

    return (
        <div
            ref={containerRef}
            style={{
                background: `linear-gradient(135deg, ${colors.bg} 0%, #0a0e14 50%, #080b10 100%)`,
                minHeight: '100vh',
                color: colors.text,
                padding: '32px',
                position: 'relative',
                overflow: 'auto'
            }}
        >
            {/* EXTREME Background Effects */}
            {/* Animated Gradient Orbs */}
            <div style={{
                position: 'absolute',
                top: '20%',
                left: '10%',
                width: '500px',
                height: '500px',
                background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`,
                filter: 'blur(60px)',
                animation: 'floatOrb1 20s ease-in-out infinite',
                pointerEvents: 'none',
                transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)`
            }} />
            <div style={{
                position: 'absolute',
                top: '60%',
                right: '10%',
                width: '400px',
                height: '400px',
                background: `radial-gradient(circle, ${colors.cyan}15 0%, transparent 70%)`,
                filter: 'blur(60px)',
                animation: 'floatOrb2 25s ease-in-out infinite',
                pointerEvents: 'none',
                transform: `translate(${-mousePosition.x * 40}px, ${-mousePosition.y * 40}px)`
            }} />
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                width: '350px',
                height: '350px',
                background: `radial-gradient(circle, ${colors.purple}12 0%, transparent 70%)`,
                filter: 'blur(80px)',
                animation: 'floatOrb3 30s ease-in-out infinite',
                pointerEvents: 'none'
            }} />

            {/* Floating Particles */}
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute',
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    background: `radial-gradient(circle, ${colors.primary}80, ${colors.cyan}60)`,
                    borderRadius: '50%',
                    filter: 'blur(1px)',
                    opacity: 0.6,
                    animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    pointerEvents: 'none',
                    boxShadow: `0 0 ${p.size * 2}px ${colors.primary}40`
                }} />
            ))}

            {/* Wave Animation (SVG) */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '300px',
                opacity: 0.1,
                pointerEvents: 'none'
            }}>
                <svg viewBox="0 0 1200 300" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                    <path d="M0,100 C300,200 400,0 600,100 C800,200 900,0 1200,100 L1200,300 L0,300 Z" fill={colors.primary} opacity="0.3">
                        <animate attributeName="d" dur="15s" repeatCount="indefinite"
                            values="M0,100 C300,200 400,0 600,100 C800,200 900,0 1200,100 L1200,300 L0,300 Z;
                                    M0,150 C300,50 400,250 600,150 C800,50 900,250 1200,150 L1200,300 L0,300 Z;
                                    M0,100 C300,200 400,0 600,100 C800,200 900,0 1200,100 L1200,300 L0,300 Z" />
                    </path>
                    <path d="M0,150 C300,50 400,250 600,150 C800,50 900,250 1200,150 L1200,300 L0,300 Z" fill={colors.cyan} opacity="0.2">
                        <animate attributeName="d" dur="20s" repeatCount="indefinite"
                            values="M0,150 C300,50 400,250 600,150 C800,50 900,250 1200,150 L1200,300 L0,300 Z;
                                    M0,100 C300,200 400,0 600,100 C800,200 900,0 1200,100 L1200,300 L0,300 Z;
                                    M0,150 C300,50 400,250 600,150 C800,50 900,250 1200,150 L1200,300 L0,300 Z" />
                    </path>
                </svg>
            </div>

            {/* Geometric Shapes */}
            <div style={{
                position: 'absolute',
                top: '15%',
                right: '15%',
                width: '100px',
                height: '100px',
                border: `2px solid ${colors.purple}30`,
                borderRadius: '20px',
                animation: 'rotateShape 20s linear infinite',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '20%',
                left: '20%',
                width: '80px',
                height: '80px',
                border: `2px solid ${colors.primary}25`,
                borderRadius: '50%',
                animation: 'scaleShape 15s ease-in-out infinite',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                top: '50%',
                right: '30%',
                width: '60px',
                height: '60px',
                border: `2px solid ${colors.cyan}20`,
                transform: 'rotate(45deg)',
                animation: 'floatShape 25s ease-in-out infinite',
                pointerEvents: 'none'
            }} />

            {/* Twinkling Stars */}
            {[...Array(15)].map((_, i) => (
                <div key={`star-${i}`} style={{
                    position: 'absolute',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: '2px',
                    height: '2px',
                    background: 'white',
                    borderRadius: '50%',
                    boxShadow: `0 0 ${Math.random() * 10 + 5}px ${colors.cyan}`,
                    animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out ${Math.random() * 2}s infinite`,
                    pointerEvents: 'none'
                }} />
            ))}

            {/* Rotating Light Rays */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '1000px',
                height: '1000px',
                transform: 'translate(-50%, -50%)',
                background: `conic-gradient(
                    from 0deg,
                    transparent 0deg,
                    ${colors.primary}05 10deg,
                    transparent 20deg,
                    ${colors.cyan}05 30deg,
                    transparent 40deg,
                    ${colors.purple}05 50deg,
                    transparent 60deg
                )`,
                animation: 'rotateRays 60s linear infinite',
                pointerEvents: 'none',
                opacity: 0.5
            }} />

            {/* Scanline Effect */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
                pointerEvents: 'none',
                opacity: 0.3
            }} />

            {/* Animated Grid */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `
                    linear-gradient(${colors.primary}08 1px, transparent 1px),
                    linear-gradient(90deg, ${colors.primary}08 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                animation: 'gridPulse 10s ease-in-out infinite',
                pointerEvents: 'none',
                opacity: 0.3
            }} />

            {/* EXTREME Header - No Box */}
            <div style={{
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    {/* WWW Icon using image */}
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px',
                        boxShadow: `
                            0 0 40px ${colors.primary}60,
                            0 0 80px ${colors.primary}30,
                            inset 0 2px 10px rgba(255,255,255,0.2)
                        `,
                        animation: browserLaunched ? 'extremePulse 3s ease-in-out infinite, rotate3D 10s linear infinite' : 'none',
                        transform: 'perspective(1000px)',
                        position: 'relative'
                    }}>
                        {/* Inner glow */}
                        <div style={{
                            position: 'absolute',
                            inset: '4px',
                            borderRadius: '12px',
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)`,
                            pointerEvents: 'none'
                        }} />
                        {/* WWW Icon Image */}
                        <svg viewBox="0 0 512 512" style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }} fill="white">
                            <path d="M352,256C352,278.2,350.8,299.6,348.7,320H163.3C161.2,299.6,160,278.2,160,256C160,233.8,161.2,212.4,163.3,192H348.7C350.8,212.4,352,233.8,352,256zM503.9,192C509.2,212.5,512,233.9,512,256C512,278.1,509.2,299.5,503.9,320H380.8C383.1,299.4,384,277.1,384,256C384,234.9,383.1,212.6,380.8,192H503.9zM493.4,160H376.7C366.7,96.14,346.9,42.62,321.4,8.442C399.8,29.09,467.4,77.18,493.4,160zM192,256C192,228.6,194.4,202.1,198.6,176H313.4C317.6,202.1,320,228.6,320,256C320,283.4,317.6,309.9,313.4,336H198.6C194.4,309.9,192,283.4,192,256zM190.6,8.442C165.1,42.62,145.3,96.14,135.3,160H18.56C44.62,77.18,112.2,29.09,190.6,8.442zM131.2,192C128.9,212.6,128,234.9,128,256C128,277.1,128.9,299.4,131.2,320H8.065C2.8,299.5,0,278.1,0,256C0,233.9,2.8,212.5,8.065,192H131.2zM194.7,504.3C219.8,470.1,239.5,416.6,249.5,352H135.3C145.3,415.9,165.1,469.4,190.6,503.6C191.9,503.9,193.3,504.2,194.7,504.3L194.7,504.3zM317.3,503.6C342.4,469.4,362.1,415.9,372.1,352H135.3C145.3,415.9,165.1,469.4,190.6,503.6C191.9,503.9,193.3,504.2,194.7,504.3C293.2,504.2,315.9,503.9,317.3,503.6zM376.7,352C366.7,415.9,346.9,469.4,321.4,503.6C399.8,482.9,467.4,434.8,493.4,352H376.7z" />
                        </svg>
                    </div>

                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '36px',
                            fontWeight: 900,
                            background: `linear-gradient(135deg, ${colors.text} 0%, ${colors.primary} 50%, ${colors.cyan} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-1px',
                            textShadow: `0 0 30px ${colors.primary}40`,
                            animation: 'shimmerText 5s ease-in-out infinite'
                        }}>
                            Web Automation
                        </h1>
                        <p style={{
                            margin: '6px 0 0 0',
                            fontSize: '14px',
                            color: colors.textSecondary,
                            fontWeight: 600,
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                        }}>
                            Powered by Playwright • AI-Enhanced
                        </p>
                    </div>
                </div>

                {/* Extreme Status Badge - Clickable */}
                <div
                    onClick={() => !browserLaunched && !isLoading && launchBrowser()}
                    style={{
                        padding: '14px 24px',
                        background: browserLaunched
                            ? `linear-gradient(135deg, ${colors.success}25, ${colors.success}15)`
                            : `linear-gradient(135deg, ${colors.error}25, ${colors.error}15)`,
                        border: `2px solid ${browserLaunched ? colors.success : colors.error}`,
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        boxShadow: browserLaunched
                            ? `0 0 30px ${colors.success}40, 0 8px 25px rgba(0,0,0,0.3)`
                            : `0 0 30px ${colors.error}40, 0 4px 15px rgba(0,0,0,0.2)`,
                        animation: browserLaunched ? 'statusGlow 2s ease-in-out infinite' : 'none',
                        position: 'relative',
                        overflow: 'hidden',
                        cursor: (!browserLaunched && !isLoading) ? 'pointer' : 'default',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!browserLaunched && !isLoading) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 0 40px ${colors.error}60, 0 6px 20px rgba(0,0,0,0.3)`
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!browserLaunched && !isLoading) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = `0 0 30px ${colors.error}40, 0 4px 15px rgba(0,0,0,0.2)`
                        }
                    }}
                >
                    {/* Animated background */}
                    {browserLaunched && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `linear-gradient(90deg, transparent, ${colors.success}20, transparent)`,
                            animation: 'shimmerSweep 3s linear infinite'
                        }} />
                    )}

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: browserLaunched ? colors.success : colors.textSecondary,
                                display: 'block',
                                boxShadow: browserLaunched ? `0 0 15px ${colors.success}, 0 0 30px ${colors.success}60` : 'none'
                            }} />
                            {browserLaunched && (
                                <>
                                    <span style={{
                                        position: 'absolute',
                                        inset: '-4px',
                                        borderRadius: '50%',
                                        border: `2px solid ${colors.success}`,
                                        animation: 'extremePing 2s ease-out infinite'
                                    }} />
                                    <span style={{
                                        position: 'absolute',
                                        inset: '-4px',
                                        borderRadius: '50%',
                                        border: `2px solid ${colors.success}`,
                                        animation: 'extremePing 2s ease-out infinite 0.5s'
                                    }} />
                                </>
                            )}
                        </div>
                        {browserLaunched ? 'BROWSER ACTIVE' : 'NOT CONNECTED'}
                    </div>
                </div>

                {/* Extreme Success Animation */}
                {showSuccessAnimation && (
                    <>
                        <div style={{
                            position: 'absolute',
                            right: '-50px',
                            top: '50%',
                            fontSize: '64px',
                            animation: 'extremeSuccess 3s ease-out forwards',
                            filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.8))'
                        }}>
                            ✨
                        </div>
                        <div style={{
                            position: 'absolute',
                            right: '20px',
                            top: '20%',
                            fontSize: '48px',
                            animation: 'extremeSuccess 3s ease-out 0.2s forwards',
                            filter: 'drop-shadow(0 0 15px rgba(86, 212, 221, 0.8))'
                        }}>
                            🎉
                        </div>
                        <div style={{
                            position: 'absolute',
                            right: '60px',
                            top: '70%',
                            fontSize: '52px',
                            animation: 'extremeSuccess 3s ease-out 0.4s forwards',
                            filter: 'drop-shadow(0 0 15px rgba(167, 139, 250, 0.8))'
                        }}>
                            🚀
                        </div>
                    </>
                )}
            </div>

            {/* EXTREME Address Bar */}
            <div style={{
                background: `linear-gradient(135deg, ${colors.bgSecondary}dd 0%, ${colors.bgTertiary}dd 100%)`,
                backdropFilter: 'blur(40px) saturate(180%)',
                border: `1px solid ${colors.border}`,
                borderRadius: '20px',
                padding: '28px',
                marginBottom: '28px',
                boxShadow: `
                    0 0 60px rgba(0,0,0,0.3),
                    0 15px 50px rgba(0, 0, 0, 0.6), 
                    inset 0 1px 0 rgba(255, 255, 255, 0.1),
                    inset 0 0 30px rgba(249, 115, 22, 0.03)
                `,
                position: 'relative',
                zIndex: 1,
                overflow: 'hidden'
            }}>
                {/* Extreme Progress Bar */}
                {navigationProgress > 0 && (
                    <>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '4px',
                            width: `${navigationProgress}%`,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.cyan}, ${colors.purple})`,
                            backgroundSize: '200% 100%',
                            transition: 'width 0.3s ease-out',
                            boxShadow: `0 0 20px ${colors.primary}, 0 0 40px ${colors.cyan}40`,
                            animation: 'progressShimmer 2s linear infinite'
                        }} />
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '4px',
                            width: `${navigationProgress}%`,
                            background: 'rgba(255,255,255,0.5)',
                            filter: 'blur(8px)',
                            transition: 'width 0.3s ease-out'
                        }} />
                    </>
                )}

                {/* URL Bar */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                        padding: '14px',
                        background: `linear-gradient(135deg, ${colors.success}18, ${colors.success}10)`,
                        borderRadius: '12px',
                        border: `2px solid ${colors.success}40`,
                        boxShadow: `0 0 20px ${colors.success}20, inset 0 1px 5px rgba(255,255,255,0.1)`,
                        animation: 'iconFloat 4s ease-in-out infinite'
                    }}>
                        <span style={{ fontSize: '22px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🔒</span>
                    </div>

                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && browserLaunched && navigateToUrl()}
                        placeholder="Enter website URL..."
                        disabled={!browserLaunched}
                        style={{
                            flex: 1,
                            background: `linear-gradient(135deg, ${colors.bgTertiary}dd, ${colors.bgSecondary}dd)`,
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${colors.border}`,
                            borderRadius: '14px',
                            padding: '16px 24px',
                            color: colors.text,
                            fontSize: '16px',
                            fontWeight: 600,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            outline: 'none',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = colors.primary
                            e.target.style.boxShadow = `0 0 0 4px ${colors.primary}20, inset 0 2px 8px rgba(0,0,0,0.2), 0 0 30px ${colors.primary}30`
                            e.target.style.transform = 'translateY(-2px)'
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.border
                            e.target.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.2)'
                            e.target.style.transform = 'translateY(0)'
                        }}
                    />

                    {!browserLaunched ? (
                        <button
                            onClick={launchBrowser}
                            disabled={isLoading}
                            style={{
                                position: 'relative',
                                background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '16px 36px',
                                borderRadius: '14px',
                                fontWeight: 800,
                                fontSize: '16px',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                boxShadow: `
                                    0 0 30px ${colors.success}40,
                                    0 6px 25px rgba(0,0,0,0.3), 
                                    inset 0 1px 0 rgba(255,255,255,0.4),
                                    inset 0 -2px 10px rgba(0,0,0,0.2)
                                `,
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                overflow: 'hidden',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                            onMouseEnter={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                                    e.currentTarget.style.boxShadow = `0 0 40px ${colors.success}60, 0 10px 35px rgba(0,0,0,0.4)`
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isLoading) {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = `0 0 30px ${colors.success}40, 0 6px 25px rgba(0,0,0,0.3)`
                                }
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                animation: 'extremeShimmer 3s infinite'
                            }} />
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
                                    padding: '16px 32px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '16px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    boxShadow: `0 0 30px ${colors.primary}40, 0 6px 25px rgba(0,0,0,0.3)`,
                                    transition: 'all 0.3s ease',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = 'scale(1.05)'
                                        e.currentTarget.style.boxShadow = `0 0 40px ${colors.primary}60, 0 8px 30px rgba(0,0,0,0.4)`
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isLoading) {
                                        e.currentTarget.style.transform = 'scale(1)'
                                        e.currentTarget.style.boxShadow = `0 0 30px ${colors.primary}40, 0 6px 25px rgba(0,0,0,0.3)`
                                    }
                                }}
                            >
                                {isLoading ? '⏳' : '→'} Go
                            </button>
                            <button
                                onClick={closeBrowser}
                                style={{
                                    background: `linear-gradient(135deg, ${colors.error}, ${colors.error}dd)`,
                                    color: 'white',
                                    border: 'none',
                                    padding: '16px 28px',
                                    borderRadius: '14px',
                                    fontWeight: 800,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: `0 0 30px ${colors.error}40, 0 6px 25px rgba(0,0,0,0.3)`,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)'
                                    e.currentTarget.style.boxShadow = `0 0 40px ${colors.error}60, 0 8px 30px rgba(0,0,0,0.4)`
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                                    e.currentTarget.style.boxShadow = `0 0 30px ${colors.error}40, 0 6px 25px rgba(0,0,0,0.3)`
                                }}
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>

                {browserLaunched && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        animation: 'slideIn 0.6s ease-out'
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            padding: '10px 20px',
                            background: inspectorMode
                                ? `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`
                                : 'transparent',
                            borderRadius: '12px',
                            border: `2px solid ${inspectorMode ? colors.primary : 'transparent'}`,
                            transition: 'all 0.4s ease',
                            boxShadow: inspectorMode ? `0 0 25px ${colors.primary}30` : 'none'
                        }}>
                            <input
                                type="checkbox"
                                checked={inspectorMode}
                                onChange={(e) => setInspectorMode(e.target.checked)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '15px', fontWeight: 700 }}>
                                🔍 Inspector Mode
                            </span>
                        </label>
                        {pageTitle && (
                            <div style={{
                                flex: 1,
                                padding: '10px 20px',
                                background: `linear-gradient(135deg, ${colors.blue}15, ${colors.blue}08)`,
                                borderRadius: '12px',
                                border: `2px solid ${colors.blue}30`,
                                fontSize: '15px',
                                fontWeight: 600,
                                color: colors.blue,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                boxShadow: `0 0 20px ${colors.blue}20, inset 0 1px 3px rgba(255,255,255,0.1)`,
                                animation: 'titleGlow 3s ease-in-out infinite'
                            }}>
                                📄 {pageTitle}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mode Selector Tabs - Like Mobile Automation */}
            <div style={{
                marginBottom: '24px',
                background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
                backdropFilter: 'blur(20px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '16px',
                padding: '8px',
                display: 'flex',
                gap: '8px',
                position: 'relative',
                zIndex: 1,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
                {[
                    { id: 'browser', icon: '🌐', label: 'Browser', color: colors.primary },
                    { id: 'inspector', icon: '🔍', label: 'Inspector', color: colors.blue },
                    { id: 'recorder', icon: '⏺️', label: 'Recorder', color: colors.error },
                    { id: 'playback', icon: '▶️', label: 'Playback', color: colors.success }
                ].map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id as any)}
                        disabled={!browserLaunched && m.id !== 'browser'}
                        style={{
                            flex: 1,
                            padding: '14px 20px',
                            background: mode === m.id
                                ? `linear-gradient(135deg, ${m.color}25, ${m.color}15)`
                                : 'transparent',
                            border: mode === m.id
                                ? `2px solid ${m.color}`
                                : '2px solid transparent',
                            borderRadius: '12px',
                            color: mode === m.id ? m.color : (!browserLaunched && m.id !== 'browser') ? colors.textSecondary : colors.text,
                            fontWeight: mode === m.id ? 800 : 600,
                            fontSize: '15px',
                            cursor: (!browserLaunched && m.id !== 'browser') ? 'not-allowed' : 'pointer',
                            opacity: (!browserLaunched && m.id !== 'browser') ? 0.4 : 1,
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: mode === m.id
                                ? `0 0 20px ${m.color}30, inset 0 1px 0 rgba(255,255,255,0.1)`
                                : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (browserLaunched || m.id === 'browser') {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                if (mode !== m.id) {
                                    e.currentTarget.style.background = `${m.color}10`
                                }
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            if (mode !== m.id) {
                                e.currentTarget.style.background = 'transparent'
                            }
                        }}
                    >
                        {mode === m.id && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `linear-gradient(90deg, transparent, ${m.color}20, transparent)`,
                                animation: 'shimmerSweep 3s linear infinite'
                            }} />
                        )}
                        <span style={{ fontSize: '20px', position: 'relative', zIndex: 1 }}>{m.icon}</span>
                        <span style={{ position: 'relative', zIndex: 1 }}>{m.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '28px',
                height: 'calc(100vh - 380px)',
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
                    backdropFilter: 'blur(30px) saturate(180%)',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: `
                        0 0 60px rgba(0,0,0,0.3),
                        0 25px 70px rgba(0, 0, 0, 0.7), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.1)
                    `,
                    animation: 'scaleIn 0.6s ease-out',
                    position: 'relative'
                }}>
                    {/* Corner accents */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100px',
                        height: '100px',
                        background: `radial-gradient(circle at top left, ${colors.primary}20, transparent)`,
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '100px',
                        height: '100px',
                        background: `radial-gradient(circle at bottom right, ${colors.cyan}20, transparent)`,
                        pointerEvents: 'none'
                    }} />

                    <BrowserViewer
                        screenshot={screenshot}
                        inspectorMode={inspectorMode}
                        isLoading={isLoading}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                    animation: 'slideInRight 0.7s ease-out'
                }}>
                    <ControlPanel
                        browserLaunched={browserLaunched}
                        isRecording={isRecording}
                        isLoading={isLoading}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onPlay={playActions}
                        onWait={handleWait}
                        hasActions={actions.length > 0}
                    />
                    <ActionsList
                        actions={actions}
                        isRecording={isRecording}
                    />
                </div>
            </div>

            {/* EXTREME CSS Animations */}
            <style>{`
                @keyframes floatOrb1 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(50px, -30px); }
                    66% { transform: translate(-30px, 40px); }
                }
                @keyframes floatOrb2 {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(-40px, 50px); }
                    66% { transform: translate(60px, -20px); }
                }
                @keyframes floatOrb3 {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    50% { transform: translate(30px, -40px) rotate(180deg); }
                }
                @keyframes gridPulse {
                    0%, 100% { opacity: 0.2; }
                    50% { opacity: 0.4; }
                }
                @keyframes rotateBorder {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 400% 50%; }
                }
                @keyframes extremePulse {
                    0%, 100% { transform: scale(1) perspective(1000px) rotateY(0deg); box-shadow: 0 0 40px ${colors.primary}60, 0 0 80px ${colors.primary}30; }
                    50% { transform: scale(1.08) perspective(1000px) rotateY(10deg); box-shadow: 0 0 60px ${colors.primary}80, 0 0 120px ${colors.primary}50; }
                }
                @keyframes rotate3D {
                    0% { transform: perspective(1000px) rotateY(0deg); }
                    100% { transform: perspective(1000px) rotateY(360deg); }
                }
                @keyframes shimmerText {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes statusGlow {
                    0%, 100% { box-shadow: 0 0 30px ${colors.success}40, 0 8px 25px rgba(0,0,0,0.3); }
                    50% { box-shadow: 0 0 50px ${colors.success}60, 0 12px 35px rgba(0,0,0,0.4); }
                }
                @keyframes extremePing {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                @keyframes shimmerSweep {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
                @keyframes extremeSuccess {
                    0% { opacity: 0; transform: scale(0) rotate(0deg) translateY(0); }
                    30% { opacity: 1; transform: scale(1.5) rotate(180deg) translateY(-20px); }
                    60% { opacity: 1; transform: scale(1.2) rotate(360deg) translateY(-40px); }
                    100% { opacity: 0; transform: scale(2) rotate(720deg) translateY(-100px); }
                }
                @keyframes progressShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 200% 50%; }
                }
                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes extremeShimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(-15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.92); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes titleGlow {
                    0%, 100% { box-shadow: 0 0 20px ${colors.blue}20; }
                    50% { box-shadow: 0 0 35px ${colors.blue}40; }
                }
                @keyframes floatParticle {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-100px) translateX(50px); }
                    50% { transform: translateY(-200px) translateX(-30px); }
                    75% { transform: translateY(-100px) translateX(70px); }
                }
                @keyframes rotateShape {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.2); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                @keyframes scaleShape {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.5); opacity: 0.6; }
                }
                @keyframes floatShape {
                    0%, 100% { transform: translateY(0) rotate(45deg); }
                    50% { transform: translateY(-50px) rotate(225deg); }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }
                @keyframes rotateRays {
                    0% { transform: translate(-50%, -50%) rotate(0deg); }
                    100% { transform: translate(-50%, -50%) rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
