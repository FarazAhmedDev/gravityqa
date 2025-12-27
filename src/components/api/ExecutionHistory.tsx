import { swaggerTheme } from './swagger/swaggerTheme'
import MethodBadge from './swagger/MethodBadge'

export interface ExecutionRecord {
    id: string
    testName: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    status: number
    statusText: string
    responseTime: number
    timestamp: string
    validationsPassed: number
    validationsTotal: number
    success: boolean
}

interface Props {
    history: ExecutionRecord[]
    onClearHistory: () => void
    onViewDetails: (record: ExecutionRecord) => void
}

export default function ExecutionHistory({ history, onClearHistory, onViewDetails }: Props) {
    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return swaggerTheme.status.success
        if (status >= 300 && status < 400) return swaggerTheme.status.redirect
        if (status >= 400) return swaggerTheme.status.error
        return swaggerTheme.status.info
    }

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(2)}s`
    }

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: swaggerTheme.bgSecondary
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: swaggerTheme.text
                    }}>
                        📊 Execution History
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={onClearHistory}
                            style={{
                                padding: '6px 12px',
                                background: 'transparent',
                                border: `1px solid ${swaggerTheme.border}`,
                                borderRadius: '4px',
                                color: swaggerTheme.methods.delete,
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Clear All
                        </button>
                    )}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: swaggerTheme.textSecondary
                }}>
                    {history.length} execution{history.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* History List */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px'
            }}>
                {history.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: swaggerTheme.textSecondary
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>
                            📋
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            No execution history yet
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                            Run API tests to see execution history
                        </div>
                    </div>
                ) : (
                    history.map((record) => (
                        <div
                            key={record.id}
                            onClick={() => onViewDetails(record)}
                            style={{
                                marginBottom: '12px',
                                padding: '14px',
                                background: swaggerTheme.bgCard,
                                border: `1px solid ${swaggerTheme.border}`,
                                borderLeft: `4px solid ${getStatusColor(record.status)}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderLeftWidth = '6px'
                                e.currentTarget.style.transform = 'translateX(2px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderLeftWidth = '4px'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            {/* Header Row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '10px'
                            }}>
                                <MethodBadge method={record.method} size="small" />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: swaggerTheme.text,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {record.testName}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: swaggerTheme.textMuted,
                                        fontFamily: 'monospace',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginTop: '2px'
                                    }}>
                                        {record.url}
                                    </div>
                                </div>

                                <div style={{
                                    padding: '4px 10px',
                                    background: getStatusColor(record.status),
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    fontFamily: 'monospace'
                                }}>
                                    {record.status}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div style={{
                                display: 'flex',
                                gap: '16px',
                                flexWrap: 'wrap',
                                fontSize: '12px',
                                color: swaggerTheme.textSecondary
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>⏱️</span>
                                    <span>{formatTime(record.responseTime)}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🕐</span>
                                    <span>{formatTimestamp(record.timestamp)}</span>
                                </div>

                                {record.validationsTotal > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>{record.validationsPassed === record.validationsTotal ? '✅' : '❌'}</span>
                                        <span>
                                            {record.validationsPassed}/{record.validationsTotal} validations
                                        </span>
                                    </div>
                                )}

                                <div style={{
                                    marginLeft: 'auto',
                                    padding: '2px 8px',
                                    background: record.success ? swaggerTheme.status.success + '20' : swaggerTheme.status.error + '20',
                                    color: record.success ? swaggerTheme.status.success : swaggerTheme.status.error,
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                }}>
                                    {record.success ? 'PASSED' : 'FAILED'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
