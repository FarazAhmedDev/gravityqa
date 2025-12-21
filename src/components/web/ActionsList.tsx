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
        primary: '#f97316',
        blue: '#58a6ff',
        purple: '#a78bfa',
        success: '#3fb950'
    }

    const getActionIcon = (type: string) => {
        switch (type) {
            case 'click': return '🖱️'
            case 'type': return '⌨️'
            case 'scroll': return '📜'
            default: return '●'
        }
    }

    const getActionColor = (type: string) => {
        switch (type) {
            case 'click': return colors.blue
            case 'type': return colors.purple
            case 'scroll': return colors.success
            default: return colors.primary
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
            background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
            animation: 'scaleIn 0.5s ease-out 0.2s backwards',
            minHeight: 0
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: `1px solid ${colors.border}`
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.primary}dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        boxShadow: `0 0 20px ${colors.primary}40`
                    }}>
                        📝
                    </div>
                    <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${colors.text}, ${colors.textSecondary})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Actions
                    </h3>
                </div>
                <div style={{
                    padding: '6px 14px',
                    background: isRecording
                        ? `linear-gradient(135deg, #f8514920, #f8514910)`
                        : `${colors.bgTertiary}`,
                    border: `2px solid ${isRecording ? '#f85149' : colors.border}`,
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isRecording ? '#f85149' : colors.textSecondary,
                    boxShadow: isRecording ? `0 0 15px #f8514940` : 'none',
                    animation: isRecording ? 'countPulse 2s ease-in-out infinite' : 'none'
                }}>
                    {actions.length} {actions.length === 1 ? 'action' : 'actions'}
                </div>
            </div>

            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                paddingRight: '4px'
            }}>
                {actions.length === 0 ? (
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '40px 20px',
                        color: colors.textSecondary,
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        {isRecording ? (
                            <>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    animation: 'ping 2s ease-in-out infinite'
                                }}>
                                    ⏺️
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: colors.text,
                                    marginBottom: '8px'
                                }}>
                                    Recording in Progress...
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    Interact with the browser to record actions
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    fontSize: '48px',
                                    marginBottom: '16px',
                                    opacity: 0.5
                                }}>
                                    📝
                                </div>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: colors.text,
                                    marginBottom: '8px'
                                }}>
                                    No Actions Yet
                                </div>
                                <div style={{ fontSize: '13px' }}>
                                    Start recording to capture actions
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    actions.map((action, index) => {
                        const actionColor = getActionColor(action.type)
                        return (
                            <div
                                key={action.id}
                                style={{
                                    background: `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary})`,
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '12px',
                                    padding: '14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    transition: 'all 0.3s ease',
                                    cursor: 'default',
                                    animation: `slideInAction 0.4s ease-out ${index * 0.05}s backwards`,
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = actionColor
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${actionColor}10, ${actionColor}05)`
                                    e.currentTarget.style.boxShadow = `0 4px 16px ${actionColor}30`
                                    e.currentTarget.style.transform = 'translateX(4px)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = colors.border
                                    e.currentTarget.style.background = `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary})`
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
                                    e.currentTarget.style.transform = 'translateX(0)'
                                }}
                            >
                                <div style={{
                                    minWidth: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    background: `linear-gradient(135deg, ${actionColor}25, ${actionColor}15)`,
                                    border: `2px solid ${actionColor}40`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: actionColor,
                                    boxShadow: `0 0 15px ${actionColor}30`
                                }}>
                                    {index + 1}
                                </div>

                                <div style={{
                                    fontSize: '22px',
                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                                }}>
                                    {getActionIcon(action.type)}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: colors.text,
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {getActionDescription(action)}
                                    </div>
                                    <div style={{
                                        fontSize: '11px',
                                        color: colors.textSecondary,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}>
                                        <span>⏱️</span>
                                        {new Date(action.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>

                                {/* Action type badge */}
                                <div style={{
                                    padding: '4px 10px',
                                    background: `${actionColor}15`,
                                    border: `1px solid ${actionColor}30`,
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: actionColor,
                                    textTransform: 'uppercase'
                                }}>
                                    {action.type}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            <style>{`
                @keyframes slideInAction {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes countPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes ping {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
            `}</style>
        </div>
    )
}
