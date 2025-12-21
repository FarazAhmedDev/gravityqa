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

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        success: '#3fb950',
        error: '#f85149'
    }

    const launchBrowser = async () => {
        try {
            setIsLoading(true)
            const res = await axios.post('http://localhost:8000/api/web/browser/launch', {
                headless: false
            })
            if (res.data.success) {
                setBrowserLaunched(true)
                console.log('Browser launched successfully')
            }
        } catch (error) {
            console.error('Failed to launch browser:', error)
            alert('Failed to launch browser')
        } finally {
            setIsLoading(false)
        }
    }

    const navigateToUrl = async () => {
        try {
            setIsLoading(true)
            const res = await axios.post('http://localhost:8000/api/web/browser/navigate', {
                url: url
            })
            if (res.data.success) {
                setCurrentUrl(res.data.url)
                setPageTitle(res.data.title || '')
                // Get screenshot after navigation
                await updateScreenshot()
            }
        } catch (error) {
            console.error('Navigation failed:', error)
            alert('Navigation failed')
        } finally {
            setIsLoading(false)
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
                // Get recorded actions
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
                console.log('Playback completed')
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
        } catch (error) {
            console.error('Close browser failed:', error)
        }
    }

    // Auto-update screenshot periodically when browser is active
    useEffect(() => {
        if (browserLaunched && !isLoading) {
            const interval = setInterval(() => {
                updateScreenshot()
            }, 2000) // Update every 2 seconds
            return () => clearInterval(interval)
        }
    }, [browserLaunched, isLoading])

    return (
        <div style={{
            background: colors.bg,
            minHeight: '100vh',
            color: colors.text,
            padding: '24px'
        }}>
            {/* Header */}
            <div style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🌐</span>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>
                        Web Automation
                    </h1>
                </div>
                <div style={{
                    padding: '6px 12px',
                    background: browserLaunched ? colors.success : colors.textSecondary,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600
                }}>
                    {browserLaunched ? '● BROWSER ACTIVE' : '○ NOT CONNECTED'}
                </div>
            </div>

            {/* URL Bar */}
            <div style={{
                background: colors.bgSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && navigateToUrl()}
                        placeholder="Enter URL (e.g., https://example.com)"
                        disabled={!browserLaunched}
                        style={{
                            flex: 1,
                            background: colors.bgTertiary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: colors.text,
                            fontSize: '14px'
                        }}
                    />
                    {!browserLaunched ? (
                        <button
                            onClick={launchBrowser}
                            disabled={isLoading}
                            style={{
                                background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.5 : 1
                            }}
                        >
                            {isLoading ? '⏳ Launching...' : '🚀 Launch Browser'}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={navigateToUrl}
                                disabled={isLoading}
                                style={{
                                    background: colors.primary,
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Go
                            </button>
                            <button
                                onClick={closeBrowser}
                                style={{
                                    background: colors.error,
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </>
                    )}
                </div>

                {/* Inspector Toggle */}
                {browserLaunched && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={inspectorMode}
                                onChange={(e) => setInspectorMode(e.target.checked)}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 500 }}>
                                🔍 Inspector Mode
                            </span>
                        </label>
                        {pageTitle && (
                            <span style={{
                                color: colors.textSecondary,
                                fontSize: '13px',
                                marginLeft: 'auto'
                            }}>
                                {pageTitle}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '16px',
                height: 'calc(100vh - 280px)'
            }}>
                {/* Browser Viewer */}
                <div style={{
                    background: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    <BrowserViewer
                        screenshot={screenshot}
                        inspectorMode={inspectorMode}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Control Panel */}
                    <ControlPanel
                        browserLaunched={browserLaunched}
                        isRecording={isRecording}
                        isLoading={isLoading}
                        onStartRecording={startRecording}
                        onStopRecording={stopRecording}
                        onPlay={playActions}
                        hasActions={actions.length > 0}
                    />

                    {/* Actions List */}
                    <ActionsList
                        actions={actions}
                        isRecording={isRecording}
                    />
                </div>
            </div>
        </div>
    )
}
