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
    smartWaitEnabled?: boolean
    onSmartWaitToggle?: (enabled: boolean) => void
}

export default function ControlPanel({
    browserLaunched,
    isRecording,
    isLoading,
    onStartRecording,
    onStopRecording,
    onPlay,
    onWait,
    hasActions,
    smartWaitEnabled = false,
    onSmartWaitToggle
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
        error: '#f85149',
        cyan: '#56d4dd'
    }

    return (
        <div style={{
            background: `linear-gradient(135deg, ${colors.bgSecondary}dd, ${colors.bgTertiary}dd)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${colors.border}`,
            borderRadius: '16px',
            padding: '24px',
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.5)`,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingBottom: '16px',
                borderBottom: `1px solid ${colors.border}`
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `linear-gradient(135deg, ${colors.primary}, #e65b00)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: `0 0 20px ${colors.primary}40`
                }}>
                    🎬
                </div>
                <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 700,
                    color: colors.text
                }}>
                    Recording Studio
                </h3>
            </div>

            {/* Instructions */}
            {!isRecording && !hasActions && (
                <div style={{
                    padding: '16px',
                    background: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}30`,
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <div style={{ fontSize: '24px' }}>💡</div>
                    <div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: colors.primary,
                            marginBottom: '6px'
                        }}>
                            How to Record
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: colors.textSecondary,
                            lineHeight: 1.5
                        }}>
                            Click <strong>Start Recording</strong>, then interact with the browser.
                            All your clicks and scrolls will be captured automatically.
                        </div>
                    </div>
                </div>
            )}

            {/* Recording Status */}
            {isRecording && (
                <div style={{
                    padding: '16px',
                    background: `${colors.error}15`,
                    border: `2px solid ${colors.error}`,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    animation: 'recordPulse 2s ease-in-out infinite'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: colors.error,
                            boxShadow: `0 0 20px ${colors.error}`,
                            animation: 'blink 1s infinite'
                        }} />
                        <span style={{ fontSize: '14px', fontWeight: 700, color: colors.error }}>
                            Recording in Progress...
                        </span>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {!isRecording ? (
                    <button
                        onClick={onStartRecording}
                        disabled={!browserLaunched || isLoading}
                        style={{
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
                                : `0 4px 20px ${colors.error}40`,
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (browserLaunched && !isLoading) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 6px 30px ${colors.error}60`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (browserLaunched && !isLoading) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = `0 4px 20px ${colors.error}40`;
                            }
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>⏺</span>
                        Start Recording
                    </button>
                ) : (
                    <button
                        onClick={onStopRecording}
                        style={{
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
                            boxShadow: `0 6px 30px ${colors.error}60`,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>⏹</span>
                        Stop Recording
                    </button>
                )}

                <button
                    onClick={onPlay}
                    disabled={!browserLaunched || !hasActions || isLoading || isRecording}
                    style={{
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
                            : `0 4px 20px ${colors.success}40`,
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (browserLaunched && hasActions && !isLoading && !isRecording) {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = `0 6px 30px ${colors.success}60`;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (browserLaunched && hasActions && !isLoading && !isRecording) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.success}40`;
                        }
                    }}
                >
                    <span style={{ fontSize: '20px' }}>💾</span>
                    {isLoading ? 'Saving...' : 'Save Test'}
                </button>

                {/* Wait Button */}
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
                            e.target.style.borderColor = colors.primary;
                            e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = colors.border;
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        onClick={() => onWait(waitTime)}
                        disabled={!browserLaunched || !isRecording}
                        style={{
                            flex: 1,
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
                                : '0 4px 20px #a78bfa40',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (browserLaunched && isRecording) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 30px #a78bfa60';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (browserLaunched && isRecording) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 20px #a78bfa40';
                            }
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>⏱️</span>
                        Wait {waitTime}s
                    </button>
                </div>

                {/* Smart Wait (AI) Toggle */}
                <div style={{
                    padding: '16px',
                    background: `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bgSecondary})`,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    marginTop: '12px'
                }}>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: onSmartWaitToggle ? 'pointer' : 'default',
                        opacity: onSmartWaitToggle ? 1 : 0.5
                    }}>
                        <input
                            type="checkbox"
                            checked={smartWaitEnabled}
                            onChange={(e) => onSmartWaitToggle?.(e.target.checked)}
                            disabled={!onSmartWaitToggle}
                            style={{
                                width: '20px',
                                height: '20px',
                                cursor: onSmartWaitToggle ? 'pointer' : 'not-allowed',
                                accentColor: colors.cyan
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: colors.text,
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span>Smart Wait (AI)</span>
                                {smartWaitEnabled && (
                                    <span style={{
                                        fontSize: '10px',
                                        padding: '2px 8px',
                                        background: `${colors.cyan}20`,
                                        color: colors.cyan,
                                        borderRadius: '6px',
                                        fontWeight: 800
                                    }}>
                                        ACTIVE
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontSize: '12px',
                                color: colors.textSecondary
                            }}>
                                Auto-detect network requests and DOM changes
                            </div>
                        </div>
                    </label>
                </div>
            </div>

            <style>{`
                @keyframes recordPulse {
                    0%, 100% { box-shadow: 0 0 0 0 ${colors.error}40; }
                    50% { box-shadow: 0 0 0 8px ${colors.error}00; }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    )
}
