export default function AIConsole() {
    return (
        <div className="content-area">
            <div className="page-header">
                <h2 className="page-title">AI Console</h2>
                <p className="page-description">AI-powered test generation and analysis</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* AI Status */}
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px'
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3', marginBottom: '12px' }}>
                        🤖 AI Status
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#7d8590' }}>Model:</span>
                            <span style={{ color: '#e6edf3' }}>GPT-4 Vision</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#7d8590' }}>Status:</span>
                            <span style={{ color: '#3fb950' }}>● Ready</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: '#7d8590' }}>Tests Generated:</span>
                            <span style={{ color: '#e6edf3' }}>12</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{
                    background: '#161b22',
                    border: '1px solid #30363d',
                    borderRadius: '8px',
                    padding: '16px'
                }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e6edf3', marginBottom: '12px' }}>
                        ⚡ Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button className="btn btn-primary" style={{ textAlign: 'left' }}>
                            🎯 Auto-generate test from UI
                        </button>
                        <button className="btn" style={{ textAlign: 'left' }}>
                            💡 Suggest test scenarios
                        </button>
                        <button className="btn" style={{ textAlign: 'left' }}>
                            🔧 Fix failing tests
                        </button>
                    </div>
                </div>
            </div>

            {/* Activity Log */}
            <div style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #21262d',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#e6edf3'
                }}>
                    📝 Recent Activity
                </div>
                <div style={{ padding: '12px' }}>
                    {[
                        { time: '2 min ago', action: 'Generated test for Login flow', success: true },
                        { time: '15 min ago', action: 'Analyzed 12 UI elements', success: true },
                        { time: '1 hour ago', action: 'Suggested 5 test scenarios', success: true },
                        { time: '2 hours ago', action: 'Fixed 2 failing tests', success: true },
                    ].map((log, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '10px 12px',
                                borderRadius: '6px',
                                marginBottom: '6px',
                                background: '#0d1117',
                                border: '1px solid #21262d',
                                fontSize: '13px'
                            }}
                        >
                            <div style={{ color: '#e6edf3', marginBottom: '4px' }}>
                                {log.success && '✅ '}{log.action}
                            </div>
                            <div style={{ color: '#7d8590', fontSize: '12px' }}>
                                {log.time}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
