interface ControlPanelProps {
    browserLaunched: boolean
    isRecording: boolean
    isLoading: boolean
    onStartRecording: () => void
    onStopRecording: () => void
    onPlay: () => void
    hasActions: boolean
}

export default function ControlPanel({
    browserLaunched,
    isRecording,
    isLoading,
    onStartRecording,
    onStopRecording,
    onPlay,
    hasActions
}: ControlPanelProps) {
    const colors = {
        bgSecondary: '#161b22',
        border: '#30363d',
        text: '#e6edf3',
        primary: '#f97316',
        success: '#3fb950',
        error: '#f85149'
    }

    return (
        <div style={{
            background: colors.bgSecondary,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '16px'
        }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
                Controls
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Record Button */}
                {!isRecording ? (
                    <button
                        onClick={onStartRecording}
                        disabled={!browserLaunched || isLoading}
                        style={{
                            background: 'linear-gradient(135deg, #f85149, #da3633)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: (!browserLaunched || isLoading) ? 'not-allowed' : 'pointer',
                            opacity: (!browserLaunched || isLoading) ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>●</span>
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={onStopRecording}
                        style={{
                            background: colors.error,
                            color: 'white',
                            border: 'none',
                            padding: '12px 20px',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            animation: 'pulse 2s infinite'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>■</span>
                        Stop Recording
                    </button>
                )}

                {/* Play Button */}
                <button
                    onClick={onPlay}
                    disabled={!browserLaunched || !hasActions || isLoading || isRecording}
                    style={{
                        background: 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: (!browserLaunched || !hasActions || isLoading || isRecording) ? 'not-allowed' : 'pointer',
                        opacity: (!browserLaunched || !hasActions || isLoading || isRecording) ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <span style={{ fontSize: '16px' }}>▶️</span>
                    {isLoading ? 'Playing...' : 'Play Actions'}
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    )
}
