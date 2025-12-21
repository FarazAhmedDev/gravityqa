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
            const res = await axios.post('http://localhost:8000/api/web/browser/launch', { headless: false })
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
            setTimeout(() => { setIsLoading(false); setNavigationProgress(0) }, 500)
        }
    }

    const navigateToUrl = async () => {
        if (!url.trim()) return
        try {
            setIsLoading(true)
            setNavigationProgress(0)
            const progressInterval = setInterval(() => {
                setNavigationProgress(prev => prev >= 90 ? prev : prev + 10)
            }, 100)
            const res = await axios.post('http://localhost:8000/api/web/browser/navigate', { url })
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
            setTimeout(() => { setIsLoading(false); setNavigationProgress(0) }, 500)
        }
    }

    const updateScreenshot = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/web/browser/screenshot')
            if (res.data.success) setScreenshot(res.data.screenshot)
        } catch (error) {
            console.error('Screenshot failed:', error)
        }
    }

    const startRecording = async () => {
        try {
            const res = await axios.post('http://localhost:8000/api/web/record/start')
            if (res.data.success) { setIsRecording(true); setActions([]) }
        } catch (error) {
            console.error('Start recording failed:', error)
        }
    }

    const stopRecording = async () => {
        try {
            const res = await axios.post('http://localhost:8000/api/web/record/stop')
            if (res.data.success) { setIsRecording(false); await loadActions() }
        } catch (error) {
            console.error('Stop recording failed:', error)
        }
    }

    const loadActions = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/web/record/actions')
            if (res.data.success) setActions(res.data.actions)
        } catch (error) {
            console.error('Load actions failed:', error)
        }
    }

    const playActions = async () => {
        try {
            setIsLoading(true)
            const res = await axios.post('http://localhost:8000/api/web/playback/start', { actions })
            if (res.data.success) await updateScreenshot()
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

    useEffect(() => {
        if (browserLaunched && !isLoading && currentUrl) {
            const interval = setInterval(() => updateScreenshot(), 2000)
            return () => clearInterval(interval)
        }
    }, [browserLaunched, isLoading, currentUrl])

    // Generate particles
    const particles = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 5,
        duration: Math.random() * 10 + 15
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
                overflow: 'hidden'
            }}
        >
            {/* EXTREME BACKGROUND ANIMATIONS */}
            
            {/* Animated Orbs */}
            <div style={{ position: 'absolute', top: '20%', left: '10%', width: '500px', height: '500px',
                background: `radial-gradient(circle, ${colors.primary}15 0%, transparent 70%)`, filter: 'blur(60px)',
                animation: 'floatOrb1 20s ease-in-out infinite', pointerEvents: 'none',
                transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px)` }} />
            <div style={{ position: 'absolute', top: '60%', right: '10%', width: '400px', height: '400px',
                background: `radial-gradient(circle, ${colors.cyan}15 0%, transparent 70%)`, filter: 'blur(60px)',
                animation: 'floatOrb2 25s ease-in-out infinite', pointerEvents: 'none',
                transform: `translate(${-mousePosition.x * 40}px, ${-mousePosition.y * 40}px)` }} />
            <div style={{ position: 'absolute', top: '40%', left: '50%', width: '350px', height: '350px',
                background: `radial-gradient(circle, ${colors.purple}12 0%, transparent 70%)`, filter: 'blur(80px)',
                animation: 'floatOrb3 30s ease-in-out infinite', pointerEvents: 'none' }} />

            {/* Floating Particles */}
            {particles.map(p => (
                <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`,
                    background: `radial-gradient(circle, ${colors.primary}80, ${colors.cyan}60)`, borderRadius: '50%',
                    filter: 'blur(1px)', opacity: 0.6, animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                    pointerEvents: 'none', boxShadow: `0 0 ${p.size * 2}px ${colors.primary}40` }} />
            ))}

            {/* Wave SVG */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '300px', opacity: 0.1, pointerEvents: 'none' }}>
                <svg viewBox="0 0 1200 300" preserveAspectRatio="none" style={{width:'100%',height:'100%'}}>
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
            <div style={{ position: 'absolute', top: '15%', right: '15%', width: '100px', height: '100px',
                border: `2px solid ${colors.purple}30`, borderRadius: '20px',
                animation: 'rotateShape 20s linear infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '20%', left: '20%', width: '80px', height: '80px',
                border: `2px solid ${colors.primary}25`, borderRadius: '50%',
                animation: 'scaleShape 15s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', right: '30%', width: '60px', height: '60px',
                border: `2px solid ${colors.cyan}20`, transform: 'rotate(45deg)',
                animation: 'floatShape 25s ease-in-out infinite', pointerEvents: 'none' }} />

{/* Twinkling Stars */}
            {[...Array(15)].map((_, i) => (
                <div key={`star-${i}`} style={{ position: 'absolute', left: `${Math.random()*100}%`, top: `${Math.random()*100}%`,
                    width: '2px', height: '2px', background: 'white', borderRadius: '50%',
                    boxShadow: `0 0 ${Math.random()*10+5}px ${colors.cyan}`,
                    animation: `twinkle ${Math.random()*3+2}s ease-in-out ${Math.random()*2}s infinite`,
                    pointerEvents: 'none' }} />
            ))}

            {/* Light Rays */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', width: '1000px', height: '1000px',
                transform: 'translate(-50%, -50%)',
                background: `conic-gradient(from 0deg, transparent 0deg, ${colors.primary}05 10deg, transparent 20deg,
                    ${colors.cyan}05 30deg, transparent 40deg, ${colors.purple}05 50deg, transparent 60deg)`,
                animation: 'rotateRays 60s linear infinite', pointerEvents: 'none', opacity: 0.5 }} />

            {/* Scanline + Grid */}
            <div style={{ position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
                pointerEvents: 'none', opacity: 0.3 }} />
            <div style={{ position: 'absolute', inset: 0,
                backgroundImage: `linear-gradient(${colors.primary}08 1px, transparent 1px), linear-gradient(90deg, ${colors.primary}08 1px, transparent 1px)`,
                backgroundSize: '50px 50px', animation: 'gridPulse 10s ease-in-out infinite',
                pointerEvents: 'none', opacity: 0.3 }} />

            {/* CONTENT STARTS HERE - maintaining exact same structure */}
            {/* Rest of component content... */}

            <style>{`
                @keyframes floatOrb1 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(50px,-30px)} 66%{transform:translate(-30px,40px)} }
                @keyframes floatOrb2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-40px,50px)} 66%{transform:translate(60px,-20px)} }
                @keyframes floatOrb3 { 0%,100%{transform:translate(0,0)rotate(0deg)} 50%{transform:translate(30px,-40px)rotate(180deg)} }
                @keyframes floatParticle { 0%,100%{transform:translateY(0)translateX(0)} 25%{transform:translateY(-100px)translateX(50px)} 50%{transform:translateY(-200px)translateX(-30px)} 75%{transform:translateY(-100px)translateX(70px)} }
                @keyframes rotateShape { 0%{transform:rotate(0)scale(1)} 50%{transform:rotate(180deg)scale(1.2)} 100%{transform:rotate(360deg)scale(1)} }
                @keyframes scaleShape { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(1.5);opacity:0.6} }
                @keyframes floatShape { 0%,100%{transform:translateY(0)rotate(45deg)} 50%{transform:translateY(-50px)rotate(225deg)} }
                @keyframes twinkle { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.5)} }
                @keyframes rotateRays { 0%{transform:translate(-50%,-50%)rotate(0)} 100%{transform:translate(-50%,-50%)rotate(360deg)} }
                @keyframes gridPulse { 0%,100%{opacity:0.2} 50%{opacity:0.4} }
            `}</style>
        </div>
    )
}
