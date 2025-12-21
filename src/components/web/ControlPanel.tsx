import { useState } from 'react'

interface ControlPanelProps {
    browserLaunched: boolean
    isRecording: boolean
    isLoading: boolean
    onStartRecording: () => void
    onStopRecording: () => void
    onPlay: () => void
    onWait: (seconds: number) => void
    hasActions: boolean
}

export default function ControlPanel({
    browserLaunched,
    isRecording,
    isLoading,
    onStartRecording,
    onStopRecording,
    onPlay,
    onWait,
    hasActions
}: ControlPanelProps) {
    const [waitTime, setWaitTime] = useState(3)
    const colors = {
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        success: '#3fb950',
        error: '#f85149'
    }

    return (
        <div style={{
            background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '20px',
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5), 
                        inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
            animation: 'scaleIn 0.5s ease-out 0.1s backwards'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
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
                    🎮
                </div>
                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    background: `linear-gradient(135deg, ${colors.text}, ${colors.textSecondary})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Controls
                </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Record Button */}
                {!isRecording ? (
                    <button
                        onClick={onStartRecording}
                        disabled={!browserLaunched || isLoading}
                        style={{
                            position: 'relative',
                            background: (!browserLaunched || isLoading)
                                ? colors.bgTertiary
                                : 'linear-gradient(135deg, #f85149, #da3633)',
                            color: 'white',
                            border: 'none',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: (!browserLaunched || isLoading) ? 'not-allowed' : 'pointer',
                            opacity: (!browserLaunched || isLoading) ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: (!browserLaunched || isLoading)
                                ? 'none'
                                : `0 4px 20px ${colors.error}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                            transition: 'all 0.3s ease',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            if (browserLaunched && !isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = `0 6px 30px ${colors.error}60`
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (browserLaunched && !isLoading) {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = `0 4px 20px ${colors.error}40`
                            }
                        }}
                    >
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                        }} />
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={onStopRecording}
                        style={{
                            position: 'relative',
                            background: `linear-gradient(135deg, ${colors.error}, ${colors.error}dd)`,
                            color: 'white',
                            border: 'none',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: `0 6px 30px ${colors.error}60, inset 0 1px 0 rgba(255,255,255,0.2)`,
                            animation: 'recordPulse 2s ease-in-out infinite',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '2px',
                            background: 'white',
                            boxShadow: '0 0 10px rgba(255,255,255,0.8)'
                        }} />
                        Stop Recording

                        {/* Ripple effect */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '20px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: '2px solid white',
                            transform: 'translate(-50%, -50%)',
                            animation: 'ripple 2s ease-out infinite'
                        }} />
                    </button>
                )}

                {/* Play Button */}
                <button
                    onClick={onPlay}
                    disabled={!browserLaunched || !hasActions || isLoading || isRecording}
                    style={{
                        position: 'relative',
                        background: (!browserLaunched || !hasActions || isLoading || isRecording)
                            ? colors.bgTertiary
                            : 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: (!browserLaunched || !hasActions || isLoading || isRecording) ? 'not-allowed' : 'pointer',
                        opacity: (!browserLaunched || !hasActions || isLoading || isRecording) ? 0.4 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: (!browserLaunched || !hasActions || isLoading || isRecording)
                            ? 'none'
                            : `0 4px 20px ${colors.success}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                        if (browserLaunched && hasActions && !isLoading && !isRecording) {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 6px 30px ${colors.success}60`
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (browserLaunched && hasActions && !isLoading && !isRecording) {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.success}40`
                        }
                    }}
                >
                    {/* Glossy overlay */}
                    {browserLaunched && hasActions && !isLoading && !isRecording && (
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '50%',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                            borderRadius: '12px 12px 0 0',
                            pointerEvents: 'none'
                        }} />
                    )}

                    <span style={{ fontSize: '18px' }}>▶</span>
                    {isLoading ? 'Playing...' : 'Play Actions'}
                </button>

                {/* Wait/Sleep Button */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                }}>
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={waitTime}
                        onChange={(e) => setWaitTime(Number(e.target.value))}
                        style={{
                            width: '70px',
                            background: colors.bgTertiary,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '10px',
                            padding: '12px',
                            color: colors.text,
                            fontSize: '14px',
                            fontWeight: 600,
                            textAlign: 'center',
                            outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = colors.primary
                            e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.border
                            e.target.style.boxShadow = 'none'
                        }}
                    />
                    <button
                        onClick={() => onWait(waitTime)}
                        disabled={!browserLaunched || !isRecording}
                        style={{
                            flex: 1,
                            position: 'relative',
                            background: (!browserLaunched || !isRecording)
                                ? colors.bgTertiary
                                : 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: (!browserLaunched || !isRecording) ? 'not-allowed' : 'pointer',
                            opacity: (!browserLaunched || !isRecording) ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: (!browserLaunched || !isRecording)
                                ? 'none'
                                : '0 4px 20px #a78bfa40, inset 0 1px 0 rgba(255,255,255,0.2)',
                            transition: 'all 0.3s ease',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            if (browserLaunched && isRecording) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 30px #a78bfa60'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (browserLaunched && isRecording) {
                                e.currentTarget.style.transform = 'translateY(0)'
                                e.currentTarget.style.boxShadow = '0 4px 20px #a78bfa40'
                            }
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>⏱️</span>
                        Wait {waitTime}s
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes recordPulse {
                    0%, 100% { box-shadow: 0 6px 30px ${colors.error}60, inset 0 1px 0 rgba(255,255,255,0.2); }
                    50% { box-shadow: 0 8px 40px ${colors.error}80, inset 0 1px 0 rgba(255,255,255,0.3); }
                }
                @keyframes ripple {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}
