import { useState } from 'react'
import { swaggerTheme, getStatusColor } from './swaggerTheme'
import MethodBadge from './MethodBadge'

export interface HistoryEntry {
    id: string
    timestamp: number
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    status: number
    statusText: string
    responseTime: number
    success: boolean
}

interface Props {
    history: HistoryEntry[]
    onSelect: (entry: HistoryEntry) => void
    onClear: () => void
}

export default function ExecutionHistory({ history, onSelect, onClear }: Props) {
    const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all')

    const filteredHistory = history.filter(entry => {
        if (filter === 'success') return entry.success
        if (filter === 'error') return !entry.success
        return true
    })

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp)
        const today = new Date()
        const isToday = date.toDateString() === today.toDateString()

        if (isToday) {
            return 'Today'
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Filters */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'success', 'error'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '8px 16px',
                                background: filter === f ? swaggerTheme.primary : swaggerTheme.bgTertiary,
                                border: `1px solid ${filter === f ? swaggerTheme.primary : swaggerTheme.border}`,
                                borderRadius: '6px',
                                color: filter === f ? 'white' : swaggerTheme.text,
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s'
                            }}
                        >
                            {f === 'all' ? `All (${history.length})` :
                                f === 'success' ? `✓ Success (${history.filter(h => h.success).length})` :
                                    `✗ Error (${history.filter(h => !h.success).length})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* History List */}
            <div style={{
                flex: 1,
                overflow: 'auto'
            }}>
                {filteredHistory.length === 0 ? (
                    <div style={{
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: swaggerTheme.textSecondary
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>
                            📜
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '8px', fontWeight: '600' }}>
                            {filter === 'all' ? 'No history yet' :
                                filter === 'success' ? 'No successful requests' :
                                    'No failed requests'}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>
                            Execute requests to see them here
                        </div>
                    </div>
                ) : (
                    [...filteredHistory].reverse().map((entry, index, arr) => {
                        const showDate = index === 0 || formatDate(entry.timestamp) !== formatDate(arr[index - 1].timestamp)

                        return (
                            <div key={entry.id}>
                                {/* Date Divider */}
                                {showDate && (
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: swaggerTheme.textSecondary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        marginTop: index === 0 ? '0' : '20px',
                                        marginBottom: '12px',
                                        paddingTop: index === 0 ? '0' : '16px',
                                        borderTop: index === 0 ? 'none' : `1px solid ${swaggerTheme.border}`
                                    }}>
                                        {formatDate(entry.timestamp)}
                                    </div>
                                )}

                                {/* Entry */}
                                <div
                                    onClick={() => onSelect(entry)}
                                    style={{
                                        padding: '14px',
                                        marginBottom: '8px',
                                        background: swaggerTheme.bgTertiary,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = swaggerTheme.hover
                                        e.currentTarget.style.borderColor = swaggerTheme.primary
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = swaggerTheme.bgTertiary
                                        e.currentTarget.style.borderColor = swaggerTheme.border
                                    }}
                                >
                                    {/* Time */}
                                    <div style={{
                                        fontSize: '11px',
                                        color: swaggerTheme.textSecondary,
                                        marginBottom: '8px',
                                        fontFamily: 'monospace'
                                    }}>
                                        ⏰ {formatTime(entry.timestamp)}
                                    </div>

                                    {/* Method + URL */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{ fontSize: '11px' }}>
                                            <MethodBadge method={entry.method} />
                                        </div>
                                        <div style={{
                                            flex: 1,
                                            fontSize: '13px',
                                            color: swaggerTheme.text,
                                            fontFamily: 'monospace',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {entry.url}
                                        </div>
                                    </div>

                                    {/* Status + Time */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '10px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{
                                            padding: '4px 10px',
                                            background: getStatusColor(entry.status) + '20',
                                            border: `1px solid ${getStatusColor(entry.status)}`,
                                            borderRadius: '4px',
                                            color: getStatusColor(entry.status),
                                            fontWeight: '700',
                                            fontFamily: 'monospace'
                                        }}>
                                            {entry.status} {entry.statusText}
                                        </div>
                                        <div style={{
                                            padding: '4px 10px',
                                            background: swaggerTheme.bg,
                                            borderRadius: '4px',
                                            color: swaggerTheme.textSecondary,
                                            fontFamily: 'monospace'
                                        }}>
                                            ⏱️ {entry.responseTime}ms
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
