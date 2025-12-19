import { useState } from 'react'
import axios from 'axios'

interface TestStep {
    step_number: number
    description: string
    status: 'pending' | 'running' | 'success' | 'failed'
    screenshot?: string
    duration_ms?: number
}

export default function TestRunner() {
    const [isRunning, setIsRunning] = useState(false)
    const [testSteps, setTestSteps] = useState<TestStep[]>([])
    const [currentRun, setCurrentRun] = useState<any>(null)

    const startAITest = async () => {
        setIsRunning(true)
        setTestSteps([])

        try {
            // Start AI exploration
            const response = await axios.post('http://localhost:8000/api/tests/start-ai-exploration', {
                project_id: 1,
                device_id: '17301JECB05706',
                test_type: 'mobile',
                max_steps: 20
            })

            setCurrentRun(response.data)

            // Simulate steps (replace with WebSocket in real implementation)
            const demoSteps: TestStep[] = [
                { step_number: 1, description: 'Opening app...', status: 'success', duration_ms: 1200 },
                { step_number: 2, description: 'Analyzing home screen', status: 'success', duration_ms: 800 },
                { step_number: 3, description: 'Clicking "Login" button', status: 'success', duration_ms: 600 },
                { step_number: 4, description: 'Entering username', status: 'success', duration_ms: 500 },
                { step_number: 5, description: 'Entering password', status: 'success', duration_ms: 500 },
                { step_number: 6, description: 'Submitting form', status: 'running', duration_ms: 0 },
            ]

            for (let i = 0; i < demoSteps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                setTestSteps(prev => [...prev, demoSteps[i]])
            }

            alert('✅ AI Test completed!')

        } catch (error) {
            console.error('Test failed:', error)
            alert('❌ Test failed to start')
        } finally {
            setIsRunning(false)
        }
    }

    const stopTest = () => {
        setIsRunning(false)
        alert('⏸️ Test stopped')
    }

    return (
        <div className="content-area">
            <div className="page-header">
                <h2 className="page-title">Test Runner</h2>
                <p className="page-description">Run automated tests with AI-powered exploration</p>
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                padding: '16px',
                background: '#161b22',
                borderRadius: '8px',
                border: '1px solid #30363d'
            }}>
                <button
                    className="btn btn-primary"
                    onClick={startAITest}
                    disabled={isRunning}
                >
                    {isRunning ? '⏳ Running...' : '🤖 Start AI Test'}
                </button>

                {isRunning && (
                    <button className="btn" onClick={stopTest}>
                        ⏹️ Stop
                    </button>
                )}

                <button className="btn">
                    📋 Manual Test
                </button>

                <button className="btn">
                    🌐 Web Test
                </button>
            </div>

            {/* Test Progress */}
            {testSteps.length > 0 && (
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #21262d',
                        background: '#0d1117',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3' }}>
                                Test Execution
                            </span>
                            <span style={{ fontSize: '12px', color: '#7d8590', marginLeft: '12px' }}>
                                {testSteps.filter(s => s.status === 'success').length} / {testSteps.length} steps completed
                            </span>
                        </div>

                        {isRunning && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: '#58a6ff'
                            }}>
                                <div className="status-dot" style={{ background: '#58a6ff' }}></div>
                                <span style={{ fontSize: '12px' }}>Running...</span>
                            </div>
                        )}
                    </div>

                    {/* Steps List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {testSteps.map((step) => (
                            <div
                                key={step.step_number}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #21262d',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: step.status === 'running' ? '#0d1117' : 'transparent'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        background: step.status === 'success' ? '#238636' :
                                            step.status === 'failed' ? '#da3633' :
                                                step.status === 'running' ? '#58a6ff' : '#30363d',
                                        color: 'white'
                                    }}>
                                        {step.status === 'success' ? '✓' :
                                            step.status === 'failed' ? '✗' :
                                                step.status === 'running' ? '⋯' : step.step_number}
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '13px', color: '#e6edf3' }}>
                                            {step.description}
                                        </div>
                                        {step.duration_ms && (
                                            <div style={{ fontSize: '12px', color: '#7d8590', marginTop: '2px' }}>
                                                {step.duration_ms}ms
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {step.screenshot && (
                                        <button className="btn" style={{ padding: '4px 8px', fontSize: '12px' }}>
                                            📸 View
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {testSteps.length === 0 && !isRunning && (
                <div className="empty-state">
                    <div className="empty-state-icon">
                        <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <h3>No tests running</h3>
                    <p>Start an AI-powered test or create a manual test suite</p>
                </div>
            )}
        </div>
    )
}
