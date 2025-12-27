import { swaggerTheme, getStatusColor } from './swagger/swaggerTheme'
import CodeBlock from './swagger/CodeBlock'

interface ApiResponse {
    status: number
    statusText: string
    body: any
    headers: Record<string, string>
    time: number
}

interface Props {
    response: ApiResponse | null
    isLoading: boolean
}

export default function ResponseViewer({ response, isLoading }: Props) {

    if (isLoading) {
        return (
            <div style={{
                padding: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
            }}>
                <div style={{
                    fontSize: '48px',
                    animation: 'spin 1s linear infinite'
                }}>⚡</div>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: swaggerTheme.text
                }}>
                    Executing request...
                </div>
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        )
    }

    if (!response) {
        return (
            <div style={{
                padding: '60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px'
            }}>
                <div style={{ fontSize: '64px', opacity: 0.3 }}>📡</div>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: swaggerTheme.textSecondary
                }}>
                    No response yet
                </div>
                <div style={{
                    fontSize: '14px',
                    color: swaggerTheme.textSecondary,
                    opacity: 0.7
                }}>
                    Execute a request to see the response
                </div>
            </div>
        )
    }

    return (
        <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
        }}>
            {/* Status Bar */}
            <div style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                background: swaggerTheme.bgSecondary,
                borderRadius: '12px',
                border: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: swaggerTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Status
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        background: getStatusColor(response.status) + '20',
                        border: `2px solid ${getStatusColor(response.status)}`,
                        borderRadius: '8px',
                        color: getStatusColor(response.status),
                        fontSize: '14px',
                        fontWeight: '700'
                    }}>
                        {response.status} {response.statusText}
                    </div>
                </div>

                <div style={{
                    width: '1px',
                    background: swaggerTheme.border
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: swaggerTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Time
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        background: swaggerTheme.bgTertiary,
                        borderRadius: '8px',
                        color: swaggerTheme.text,
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                    }}>
                        {response.time}ms
                    </div>
                </div>

                <div style={{
                    width: '1px',
                    background: swaggerTheme.border
                }} />

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: swaggerTheme.textSecondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Size
                    </div>
                    <div style={{
                        padding: '6px 12px',
                        background: swaggerTheme.bgTertiary,
                        borderRadius: '8px',
                        color: swaggerTheme.text,
                        fontSize: '14px',
                        fontWeight: '600',
                        fontFamily: 'monospace'
                    }}>
                        {JSON.stringify(response.body).length} bytes
                    </div>
                </div>
            </div>

            {/* Response Body */}
            <div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: swaggerTheme.text,
                    marginBottom: '12px',
                    letterSpacing: '0.3px'
                }}>
                    Response Body
                </div>
                <div style={{
                    padding: '20px',
                    background: swaggerTheme.bg,
                    border: `1px solid ${swaggerTheme.border}`,
                    borderRadius: '12px',
                    overflow: 'auto',
                    maxHeight: '400px'
                }}>
                    <pre style={{
                        margin: 0,
                        color: swaggerTheme.text,
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {JSON.stringify(response.body, null, 2)}
                    </pre>
                </div>
            </div>

            {/* Response Headers */}
            <div>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: swaggerTheme.text,
                    marginBottom: '12px',
                    letterSpacing: '0.3px'
                }}>
                    Response Headers
                </div>
                <div style={{
                    padding: '16px',
                    background: swaggerTheme.bg,
                    border: `1px solid ${swaggerTheme.border}`,
                    borderRadius: '12px',
                    maxHeight: '300px',
                    overflow: 'auto'
                }}>
                    {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '8px 0',
                            borderBottom: `1px solid ${swaggerTheme.border}40`,
                            fontSize: '13px',
                            fontFamily: 'monospace'
                        }}>
                            <div style={{
                                flex: '0 0 200px',
                                color: swaggerTheme.primary,
                                fontWeight: '600'
                            }}>
                                {key}
                            </div>
                            <div style={{
                                flex: 1,
                                color: swaggerTheme.textSecondary,
                                wordBreak: 'break-all'
                            }}>
                                {value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
