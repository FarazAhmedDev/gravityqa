import { useState, useEffect } from 'react'
import axios from 'axios'

// Phase 5: Web Automation Main Component

interface WebAction {
    id: string
    type: 'click' | 'input' | 'select' | 'navigate' | 'scroll' | 'submit'
    selector: {
        xpath?: string
        css?: string
        id?: string
    }
    value?: string
    timestamp: number
    screenshot?: string
}

interface WebTest {
    id: string
    name: string
    url: string
    browser: 'chrome' | 'firefox' | 'safari'
    actions: WebAction[]
    viewport?: { width: number; height: number }
    createdAt: number
    updatedAt: number
}

export default function WebAutomation() {
    // State Management
    const [selectedBrowser, setSelectedBrowser] = useState<'chrome' | 'firefox' | 'safari'>('chrome')
    const [url, setUrl] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [recordedActions, setRecordedActions] = useState<WebAction[]>([])
    const [browserStatus, setBrowserStatus] = useState<'idle' | 'launching' | 'running' | 'error'>('idle')
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [currentTest, setCurrentTest] = useState<WebTest | null>(null)

    // Task 5.1: Launch Browser
    const handleLaunchBrowser = async () => {
        if (!url) {
            alert('❌ Please enter a URL!')
            return
        }

        setBrowserStatus('launching')

        try {
            const res = await axios.post('http://localhost:8000/api/web/launch', {
                browser: selectedBrowser,
                url: url
            })

            setSessionId(res.data.session_id)
            setBrowserStatus('running')
            console.log('[Web] ✅ Browser launched:', res.data)
        } catch (error: any) {
            console.error('[Web] ❌ Launch failed:', error)
            setBrowserStatus('error')
            alert('❌ Failed to launch browser: ' + (error.response?.data?.detail || error.message))
        }
    }

    // Task 5.1: Close Browser
    const handleCloseBrowser = async () => {
        if (!sessionId) return

        try {
            await axios.post('http://localhost:8000/api/web/close', { session_id: sessionId })
            setSessionId(null)
            setBrowserStatus('idle')
            setIsRecording(false)
            console.log('[Web] ✅ Browser closed')
        } catch (error) {
            console.error('[Web] ❌ Close failed:', error)
        }
    }

    // Task 5.1: Navigate
    const handleNavigate = async (newUrl: string) => {
        if (!sessionId) return

        try {
            await axios.post('http://localhost:8000/api/web/navigate', {
                session_id: sessionId,
                url: newUrl
            })
            setUrl(newUrl)
        } catch (error) {
            console.error('[Web] ❌ Navigate failed:', error)
        }
    }

    // Task 5.2: Start/Stop Recording
    const handleToggleRecording = async () => {
        if (!sessionId) {
            alert('❌ Please launch browser first!')
            return
        }

        if (isRecording) {
            // Stop recording
            setIsRecording(false)
            console.log('[Web] ⏹️ Recording stopped')
        } else {
            // Start recording
            setIsRecording(true)
            setRecordedActions([])
            console.log('[Web] ⏺️ Recording started')
        }
    }

    // Task 5.2: Save Test
    const handleSaveTest = () => {
        if (recordedActions.length === 0) {
            alert('❌ No actions recorded!')
            return
        }

        const testName = prompt('Enter test name:')
        if (!testName) return

        const newTest: WebTest = {
            id: Date.now().toString(),
            name: testName,
            url: url,
            browser: selectedBrowser,
            actions: recordedActions,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        // Save to localStorage
        const existingTests = JSON.parse(localStorage.getItem('web_tests') || '[]')
        existingTests.push(newTest)
        localStorage.setItem('web_tests', JSON.stringify(existingTests))

        alert(`✅ Test "${testName}" saved!`)
        setRecordedActions([])
        setIsRecording(false)
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (sessionId) {
                handleCloseBrowser()
            }
        }
    }, [])

    return (
        <div style={{
            padding: '24px',
            background: '#0d1117',
            minHeight: '100vh',
            color: '#e6edf3'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: 700,
                        margin: 0,
                        background: 'linear-gradient(135deg, #58a6ff, #79c0ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        🌐 Web Automation
                    </h2>
                    <p style={{ color: '#8b949e', margin: '4px 0 0 0' }}>
                        Record and replay web application tests
                    </p>
                </div>

                <div style={{
                    padding: '8px 16px',
                    background: browserStatus === 'running' ? 'rgba(46, 160, 67, 0.1)' : 'rgba(139, 148, 158, 0.1)',
                    border: browserStatus === 'running' ? '1px solid #3fb950' : '1px solid #30363d',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: browserStatus === 'running' ? '#3fb950' : '#8b949e'
                }}>
                    {browserStatus === 'idle' && '⚪ Not Connected'}
                    {browserStatus === 'launching' && '🟡 Launching...'}
                    {browserStatus === 'running' && '🟢 Connected'}
                    {browserStatus === 'error' && '🔴 Error'}
                </div>
            </div>

            {/* Browser Controls */}
            <div style={{
                background: '#161b22',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
                border: '1px solid #30363d'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr auto auto',
                    gap: '12px',
                    alignItems: 'center'
                }}>
                    {/* Browser Selection */}
                    <select
                        value={selectedBrowser}
                        onChange={(e) => setSelectedBrowser(e.target.value as any)}
                        disabled={browserStatus === 'running'}
                        style={{
                            padding: '12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '8px',
                            color: '#e6edf3',
                            fontSize: '14px',
                            cursor: browserStatus === 'running' ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <option value="chrome">🌐 Chrome</option>
                        <option value="firefox">🦊 Firefox</option>
                        <option value="safari">🧭 Safari</option>
                    </select>

                    {/* URL Input */}
                    <input
                        type="text"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        disabled={browserStatus === 'running'}
                        style={{
                            padding: '12px',
                            background: '#0d1117',
                            border: '1px solid #30363d',
                            borderRadius: '8px',
                            color: '#e6edf3',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />

                    {/* Launch/Close Button */}
                    <button
                        onClick={browserStatus === 'running' ? handleCloseBrowser : handleLaunchBrowser}
                        disabled={browserStatus === 'launching'}
                        style={{
                            padding: '12px 24px',
                            background: browserStatus === 'running'
                                ? 'linear-gradient(135deg, #f85149, #da3633)'
                                : 'linear-gradient(135deg, #2ea043, #238636)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: browserStatus === 'launching' ? 'not-allowed' : 'pointer',
                            opacity: browserStatus === 'launching' ? 0.5 : 1
                        }}
                    >
                        {browserStatus === 'launching' && '⏳ Launching...'}
                        {browserStatus === 'running' && '🛑 Close'}
                        {(browserStatus === 'idle' || browserStatus === 'error') && '🚀 Launch'}
                    </button>

                    {/* Record Button */}
                    <button
                        onClick={handleToggleRecording}
                        disabled={browserStatus !== 'running'}
                        style={{
                            padding: '12px 24px',
                            background: isRecording
                                ? 'linear-gradient(135deg, #f85149, #da3633)'
                                : 'linear-gradient(135deg, #58a6ff, #1f6feb)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: browserStatus !== 'running' ? 'not-allowed' : 'pointer',
                            opacity: browserStatus !== 'running' ? 0.5 : 1,
                            boxShadow: isRecording ? '0 0 20px rgba(248, 81, 73, 0.4)' : 'none'
                        }}
                    >
                        {isRecording ? '⏹️ Stop Recording' : '⏺️ Start Recording'}
                    </button>
                </div>
            </div>

            {/* Recorded Actions */}
            {recordedActions.length > 0 && (
                <div style={{
                    background: '#161b22',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid #30363d'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#e6edf3'
                        }}>
                            📝 Recorded Actions ({recordedActions.length})
                        </div>
                        <button
                            onClick={handleSaveTest}
                            style={{
                                padding: '8px 16px',
                                background: 'linear-gradient(135deg, #2ea043, #238636)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            💾 Save Test
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        maxHeight: '400px',
                        overflowY: 'auto'
                    }}>
                        {recordedActions.map((action, idx) => (
                            <div
                                key={action.id}
                                style={{
                                    padding: '12px',
                                    background: '#0d1117',
                                    borderRadius: '8px',
                                    border: '1px solid #30363d',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                                        {idx + 1}. {action.type.toUpperCase()}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8b949e', fontFamily: 'monospace' }}>
                                        {action.selector.id || action.selector.css || action.selector.xpath}
                                    </div>
                                    {action.value && (
                                        <div style={{ fontSize: '12px', color: '#79c0ff', marginTop: '4px' }}>
                                            Value: {action.value}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setRecordedActions(recordedActions.filter(a => a.id !== action.id))}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'transparent',
                                        border: '1px solid #30363d',
                                        borderRadius: '6px',
                                        color: '#f85149',
                                        fontSize: '12px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Coming Soon Panel */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.1), rgba(121, 192, 255, 0.05))',
                borderRadius: '12px',
                padding: '32px',
                border: '1px solid rgba(88, 166, 255, 0.3)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                    Phase 5.1: Browser Integration
                </div>
                <div style={{ color: '#8b949e', fontSize: '14px' }}>
                    Backend Selenium integration in progress...
                </div>
            </div>
        </div>
    )
}
