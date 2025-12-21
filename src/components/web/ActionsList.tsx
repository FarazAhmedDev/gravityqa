interface WebAction {
    id: number
    type: 'click' | 'type' | 'scroll'
    selector?: string
    data?: any
    timestamp: string
}

interface ActionsListProps {
    actions: WebAction[]
    isRecording: boolean
}

export default function ActionsList({ actions, isRecording }: ActionsListProps) {
    const colors = {
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316'
    }

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'click': return '🖱️'
            case 'type': return '⌨️'
            case 'scroll': return '📜'
            default: return '●'
        }
    }

    const getActionDescription = (action: WebAction) => {
        switch (action.type) {
            case 'click':
                return `Click "${action.selector}"`
            case 'type':
                return `Type "${action.data?.text}" into "${action.selector}"`
            case 'scroll':
                return `Scroll ${action.data?.direction} ${action.data?.amount}px`
            default:
                return action.type
        }
    }

    return (
        <div style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '16px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                    Recorded Actions
                </h3>
                <div style={{
                    padding: '4px 8px',
                    background: isRecording ? '#f8514920' : colors.bgTertiary,
                    border: `1px solid ${isRecording ? '#f85149' : colors.border}`,
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isRecording ? '#f85149' : colors.textSecondary
                }}>
                    {actions.length} {actions.length === 1 ? 'action' : 'actions'}
                </div>
            </div>

            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {actions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '32px',
                        color: colors.textSecondary,
                        fontSize: '14px'
                    }}>
                        {isRecording ? (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏺️</div>
                                <div>Recording... Perform actions in the browser</div>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📝</div>
                                <div>No actions recorded yet</div>
                                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                    Click "Start Recording" to begin
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    actions.map((action, index) => (
                        <div
                            key={action.id}
                            style={{
                                background: colors.bgTertiary,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '8px',
                                padding: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.2s',
                                cursor: 'default'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = colors.primary
                                e.currentTarget.style.background = `${colors.primary}10`
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = colors.border
                                e.currentTarget.style.background = colors.bgTertiary
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                background: `${colors.primary}20`,
                                border: `1px solid ${colors.primary}40`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                color: colors.primary
                            }}>
                                {index + 1}
                            </div>

                            <div style={{
                                fontSize: '20px'
                            }}>
                                {getActionIcon(action.type)}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    color: colors.text,
                                    marginBottom: '2px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {getActionDescription(action)}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: colors.textSecondary
                                }}>
                                    {new Date(action.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
