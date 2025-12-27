import { useState, useEffect } from 'react'
import RequestBuilder from './RequestBuilder'
import ResponseViewer from './ResponseViewer'
import SavedTests from './SavedTests'
import { runValidations } from './validationRunner'
import { swaggerTheme } from './swagger/swaggerTheme'
import AuthPanel, { injectAuth } from './swagger/AuthPanel'
import EnvironmentSelector, { replaceVariables } from './swagger/EnvironmentSelector'
import CollectionTree from './swagger/CollectionTree'
import ExecutionHistory, { HistoryEntry } from './swagger/ExecutionHistory'
import ScriptEditor, { executeScript } from './swagger/ScriptEditor'
import { useApiTestingPersistence } from '../../hooks/useLocalStorage'

interface Validation {
    id: string
    type: 'status' | 'time' | 'json_path' | 'header'
    field?: string
    operator: '==' | '!=' | '<' | '>' | '<=' | '>=' | 'contains' | 'exists'
    value: any
}

interface ApiTest {
    id?: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    headers: Record<string, string>
    queryParams: Record<string, string>
    body: string
    validations: Validation[]
}

interface ApiResponse {
    status: number
    statusText: string
    body: any
    headers: Record<string, string>
    time: number
}

type RequestTab = 'request' | 'auth' | 'scripts' | 'environment'
type SidebarTab = 'saved' | 'history'

export default function ApiTesting() {
    // ✅ FEATURE 1: LocalStorage Persistence
    const {
        savedTests,
        setSavedTests,
        history,
        setHistory,
        auth,
        setAuth,
        scripts,
        setScripts,
        environments,
        setEnvironments,
        currentEnvId,
        setCurrentEnvId,
        collections,
        setCollections
    } = useApiTestingPersistence()

    // Local UI State
    const [currentTest, setCurrentTest] = useState<ApiTest | null>(null)
    const [response, setResponse] = useState<ApiResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [splitPosition, setSplitPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
    const [requestTab, setRequestTab] = useState<RequestTab>('request')
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('saved')
    const [envVariables, setEnvVariables] = useState<Record<string, string>>({})

    // Mouse tracking for parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const handleExecute = async (test: ApiTest) => {
        setIsLoading(true)
        try {
            const currentEnv = environments.find(e => e.id === currentEnvId)
            const activeVariables = { ...envVariables, ...(currentEnv?.variables || {}) }

            // Pre-request script
            if (scripts.preRequest) {
                const scriptResult = executeScript(scripts.preRequest, {
                    environment: activeVariables,
                    setEnvironment: (key: string, value: string) => {
                        setEnvVariables(prev => ({ ...prev, [key]: value }))
                    }
                })
                console.log('⚡ Pre-Request Script:', scriptResult)
            }

            const startTime = Date.now()

            let processedUrl = replaceVariables(test.url, activeVariables)
            let processedBody = test.body ? replaceVariables(test.body, activeVariables) : ''

            let processedHeaders = { ...test.headers }
            const authResult = injectAuth(auth, processedHeaders, processedUrl)
            processedHeaders = authResult.headers
            processedUrl = authResult.url

            const url = new URL(processedUrl)
            Object.entries(test.queryParams).forEach(([key, value]) => {
                if (value) {
                    const processedValue = replaceVariables(value, activeVariables)
                    url.searchParams.append(key, processedValue)
                }
            })

            const options: RequestInit = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...processedHeaders
                }
            }

            if (processedBody && (test.method === 'POST' || test.method === 'PUT' || test.method === 'PATCH')) {
                options.body = processedBody
            }

            const res = await fetch(url.toString(), options)
            const endTime = Date.now()

            let body
            const contentType = res.headers.get('content-type')
            if (contentType?.includes('application/json')) {
                body = await res.json()
            } else {
                body = await res.text()
            }

            const responseHeaders: Record<string, string> = {}
            res.headers.forEach((value, key) => {
                responseHeaders[key] = value
            })

            const responseData = {
                status: res.status,
                statusText: res.statusText,
                body,
                headers: responseHeaders,
                time: endTime - startTime
            }

            setResponse(responseData)

            // Add to history
            const historyEntry: HistoryEntry = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                method: test.method,
                url: processedUrl,
                status: res.status,
                statusText: res.statusText,
                responseTime: responseData.time,
                success: res.ok
            }
            setHistory(prev => [...prev, historyEntry])

            // Post-response script
            if (scripts.postResponse) {
                const scriptResult = executeScript(scripts.postResponse, {
                    response: responseData,
                    environment: activeVariables,
                    setEnvironment: (key: string, value: string) => {
                        setEnvVariables(prev => ({ ...prev, [key]: value }))
                    }
                })
                console.log('✅ Post-Response Script:', scriptResult)
            }

            // Validations
            if (test.validations && test.validations.length > 0) {
                const results = runValidations(responseData, test.validations)
                console.log('✅ Validation Results:', results)

                const allPassed = results.every(r => r.passed)
                const passedCount = results.filter(r => r.passed).length

                console.log(`📊 ${passedCount}/${results.length} validations passed`)

                if (allPassed) {
                    console.log('%c✅ ALL VALIDATIONS PASSED!', 'color: #10b981; font-weight: bold; font-size: 14px')
                } else {
                    console.log('%c❌ SOME VALIDATIONS FAILED!', 'color: #ef4444; font-weight: bold; font-size: 14px')
                    results.filter(r => !r.passed).forEach(r => {
                        console.log(`  ❌ ${r.message}`)
                    })
                }
            }

        } catch (error: any) {
            setResponse({
                status: 0,
                statusText: 'Error',
                body: { error: error.message },
                headers: {},
                time: 0
            })

            setHistory(prev => [...prev, {
                id: Date.now().toString(),
                timestamp: Date.now(),
                method: test.method,
                url: test.url,
                status: 0,
                statusText: 'Error',
                responseTime: 0,
                success: false
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = (test: ApiTest) => {
        const newTest = { ...test, id: Date.now().toString() }
        setSavedTests(prev => [...prev, newTest])
        alert('Test saved successfully!')
    }

    const handleLoadTest = (test: ApiTest) => {
        setCurrentTest(test)
        setResponse(null)
        setRequestTab('request')
    }

    const handleSelectFromHistory = (entry: HistoryEntry) => {
        const testFromHistory: ApiTest = {
            id: '',
            name: `History: ${entry.method} ${entry.url}`,
            method: entry.method,
            url: entry.url,
            headers: {},
            queryParams: {},
            body: '',
            validations: []
        }
        setCurrentTest(testFromHistory)
        handleExecute(testFromHistory)
    }

    const handleMouseDown = () => {
        setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return

        const container = e.currentTarget as HTMLElement
        const rect = container.getBoundingClientRect()
        const newPosition = ((e.clientY - rect.top) / rect.height) * 100

        if (newPosition >= 20 && newPosition <= 80) {
            setSplitPosition(newPosition)
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const TabButton = ({ label, icon, isActive, onClick }: {
        label: string
        icon: string
        isActive: boolean
        onClick: () => void
    }) => (
        <button
            onClick={onClick}
            style={{
                padding: '12px 20px',
                background: isActive ? swaggerTheme.bgTertiary : 'transparent',
                border: 'none',
                borderBottom: isActive ? `3px solid ${swaggerTheme.primary}` : '3px solid transparent',
                color: isActive ? swaggerTheme.primary : swaggerTheme.textSecondary,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}
        >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            {label}
        </button>
    )

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: swaggerTheme.bg,
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* API-Themed Animated Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at ${25 + mousePos.x * 0.015}% ${35 + mousePos.y * 0.015}%, rgba(97, 175, 254, 0.1) 0%, transparent 50%),
                    radial-gradient(circle at ${75 - mousePos.x * 0.01}% ${65 - mousePos.y * 0.01}%, rgba(73, 204, 144, 0.08) 0%, transparent 50%),
                    radial-gradient(circle at ${50}% ${50}%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
                    linear-gradient(135deg, ${swaggerTheme.bg} 0%, #0d1117 50%, ${swaggerTheme.bg} 100%)
                `,
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
                animation: 'gradientShift 20s ease infinite',
                zIndex: 0
            }}></div>

            {/* HTTP Method Colored Particles */}
            {[...Array(20)].map((_, i) => {
                const colors = ['#61affe', '#49cc90', '#fca130', '#f93e3e', '#50e3c2'] // GET, POST, PUT, DELETE, PATCH
                const color = colors[i % colors.length]
                return (
                    <div
                        key={i}
                        style={{
                            position: 'fixed',
                            width: `${3 + Math.random() * 5}px`,
                            height: `${3 + Math.random() * 5}px`,
                            background: `radial-gradient(circle, ${color}60, transparent)`,
                            borderRadius: '50%',
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `float${i % 3} ${12 + Math.random() * 8}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 4}s`,
                            pointerEvents: 'none',
                            filter: 'blur(0.5px)',
                            boxShadow: `0 0 ${10 + Math.random() * 10}px ${color}40`,
                            zIndex: 0
                        }}
                    />
                )
            })}

            {/* Floating Code Symbols */}
            {['{ }', '< >', '[ ]', '/ /', '* *', '=> '].map((symbol, i) => (
                <div
                    key={symbol}
                    style={{
                        position: 'fixed',
                        left: `${15 + i * 15}%`,
                        top: `${10 + (i % 2) * 40}%`,
                        fontSize: `${16 + Math.random() * 8}px`,
                        fontFamily: 'JetBrains Mono, monospace',
                        color: swaggerTheme.methods[['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'][i] as keyof typeof swaggerTheme.methods] || swaggerTheme.primary,
                        opacity: 0.15,
                        animation: `iconFloat ${10 + i * 2}s ease-in-out infinite, textFloat ${8 + i}s ease-in-out infinite`,
                        animationDelay: `${i * 0.5}s`,
                        pointerEvents: 'none',
                        fontWeight: '700',
                        textShadow: `0 0 20px ${swaggerTheme.primary}40`,
                        zIndex: 0
                    }}
                >
                    {symbol}
                </div>
            ))}

            {/* Grid Pattern Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: `
                    linear-gradient(rgba(139, 92, 246, 0.02) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(139, 92, 246, 0.02) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.4
            }}></div>
            {/* Header */}
            <div style={{
                padding: '20px 32px',
                borderBottom: `1px solid ${swaggerTheme.border}`,
                background: swaggerTheme.bgSecondary,
                position: 'relative',
                zIndex: 1
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        fontSize: '32px',
                        filter: `drop-shadow(0 0 12px ${swaggerTheme.primary})`
                    }}>🔌</div>
                    <div>
                        <h1 style={{
                            margin: 0,
                            fontSize: '26px',
                            fontWeight: '700',
                            background: `linear-gradient(135deg, ${swaggerTheme.primary}, ${swaggerTheme.primary}80)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}>
                            API Testing
                        </h1>
                        <p style={{
                            margin: '4px 0 0',
                            fontSize: '13px',
                            color: swaggerTheme.textSecondary
                        }}>
                            Professional API Testing • Postman-like Experience ✨
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Left Sidebar - Collections */}
                <div style={{
                    width: '280px',
                    borderRight: `1px solid ${swaggerTheme.border}`,
                    background: swaggerTheme.bgSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <CollectionTree
                        collections={collections}
                        onChange={setCollections}
                        onSelectRequest={(request) => {
                            console.log('Selected request:', request)
                        }}
                    />
                </div>

                {/* Center Panel - Request/Response with Tabs */}
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        userSelect: isDragging ? 'none' : 'auto'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Request Section with Tabs */}
                    <div style={{
                        height: `${splitPosition}%`,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            background: swaggerTheme.bgSecondary,
                            borderBottom: `1px solid ${swaggerTheme.border}`,
                            padding: '0 16px'
                        }}>
                            <TabButton
                                label="Request"
                                icon="📝"
                                isActive={requestTab === 'request'}
                                onClick={() => setRequestTab('request')}
                            />
                            <TabButton
                                label="Authorization"
                                icon="🔐"
                                isActive={requestTab === 'auth'}
                                onClick={() => setRequestTab('auth')}
                            />
                            <TabButton
                                label="Scripts"
                                icon="⚡"
                                isActive={requestTab === 'scripts'}
                                onClick={() => setRequestTab('scripts')}
                            />
                            <TabButton
                                label="Environment"
                                icon="🌍"
                                isActive={requestTab === 'environment'}
                                onClick={() => setRequestTab('environment')}
                            />
                        </div>

                        {/* Tab Content */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            background: swaggerTheme.bg
                        }}>
                            {requestTab === 'request' && (
                                <RequestBuilder
                                    test={currentTest}
                                    onExecute={handleExecute}
                                    onSave={handleSave}
                                    isLoading={isLoading}
                                />
                            )}
                            {requestTab === 'auth' && (
                                <div style={{ padding: '24px' }}>
                                    <AuthPanel auth={auth} onChange={setAuth} />
                                </div>
                            )}
                            {requestTab === 'scripts' && (
                                <div style={{ padding: '24px' }}>
                                    <ScriptEditor scripts={scripts} onChange={setScripts} />
                                </div>
                            )}
                            {requestTab === 'environment' && (
                                <div style={{ padding: '24px' }}>
                                    <EnvironmentSelector
                                        environments={environments}
                                        currentEnvId={currentEnvId}
                                        onChange={setEnvironments}
                                        onSelect={setCurrentEnvId}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Draggable Divider */}
                    <div
                        onMouseDown={handleMouseDown}
                        style={{
                            height: '4px',
                            background: isDragging ? swaggerTheme.primary : swaggerTheme.border,
                            cursor: 'ns-resize',
                            transition: isDragging ? 'none' : 'background 0.2s',
                            position: 'relative',
                            zIndex: 10
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '40px',
                            height: '4px',
                            borderRadius: '2px',
                            background: isDragging ? swaggerTheme.primary : swaggerTheme.textSecondary,
                            opacity: 0.6
                        }} />
                    </div>

                    {/* Response Viewer */}
                    <div style={{
                        height: `${100 - splitPosition}%`,
                        overflow: 'auto',
                        background: swaggerTheme.bgTertiary
                    }}>
                        <ResponseViewer response={response} isLoading={isLoading} />
                    </div>
                </div>

                {/* Right Sidebar - Saved Tests & History with Tabs */}
                <div style={{
                    width: '300px',
                    borderLeft: `1px solid ${swaggerTheme.border}`,
                    background: swaggerTheme.bgSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Sidebar Tabs */}
                    <div style={{
                        display: 'flex',
                        background: swaggerTheme.bgTertiary,
                        borderBottom: `1px solid ${swaggerTheme.border}`
                    }}>
                        <button
                            onClick={() => setSidebarTab('saved')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: sidebarTab === 'saved' ? swaggerTheme.bgSecondary : 'transparent',
                                border: 'none',
                                borderBottom: sidebarTab === 'saved' ? `3px solid ${swaggerTheme.primary}` : '3px solid transparent',
                                color: sidebarTab === 'saved' ? swaggerTheme.primary : swaggerTheme.textSecondary,
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            💾 Saved
                        </button>
                        <button
                            onClick={() => setSidebarTab('history')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: sidebarTab === 'history' ? swaggerTheme.bgSecondary : 'transparent',
                                border: 'none',
                                borderBottom: sidebarTab === 'history' ? `3px solid ${swaggerTheme.primary}` : '3px solid transparent',
                                color: sidebarTab === 'history' ? swaggerTheme.primary : swaggerTheme.textSecondary,
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            📜 History
                        </button>
                    </div>

                    {/* Sidebar Content */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {sidebarTab === 'saved' && (
                            <SavedTests
                                tests={savedTests}
                                onLoad={handleLoadTest}
                                onDelete={(id: string) => setSavedTests(prev => prev.filter(t => t.id !== id))}
                            />
                        )}
                        {sidebarTab === 'history' && (
                            <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
                                <ExecutionHistory
                                    history={history}
                                    onSelect={handleSelectFromHistory}
                                    onClear={() => setHistory([])}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
