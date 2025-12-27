import { useState } from 'react'

interface VisualAssertCaptureProps {
    screenshot: string | null
    onCapture: () => void
    disabled?: boolean
}

export default function VisualAssertCapture({ screenshot, onCapture, disabled = false }: VisualAssertCaptureProps) {
    const [isCapturing, setIsCapturing] = useState(false)
    const [showTooltip, setShowTooltip] = useState(false)

    const colors = {
        primary: '#f97316',
        success: '#3fb950',
        blue: '#58a6ff',
        purple: '#a78bfa',
        bg: '#0d1117',
        bgSecondary: '#161b22',
        border: '#30363d',
        text: '#e6edf3'
    }

    const handleCapture = async () => {
        if (disabled || !screenshot) return

        setIsCapturing(true)

        // Trigger capture
        onCapture()

        // Visual feedback
        setTimeout(() => {
            setIsCapturing(false)
        }, 1000)
    }

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                zIndex: 100
            }}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Tooltip */}
            {showTooltip && (
                <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    marginBottom: '12px',
                    padding: '12px 16px',
                    background: `linear-gradient(135deg, ${colors.bgSecondary}, ${colors.bg})`,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                    animation: 'slideUp 0.2s ease-out'
                }}>
                    <div style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: colors.text,
                        marginBottom: '4px'
                    }}>
                        📷 Visual Assertion
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: '#7d8590'
                    }}>
                        Capture UI baseline for regression testing
                    </div>
                    {/* Arrow */}
                    <div style={{
                        position: 'absolute',
                        bottom: '-6px',
                        right: '24px',
                        width: '12px',
                        height: '12px',
                        background: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderTop: 'none',
                        borderLeft: 'none',
                        transform: 'rotate(45deg)'
                    }} />
                </div>
            )}

            {/* Camera Button */}
            <button
                onClick={handleCapture}
                disabled={disabled || !screenshot}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: isCapturing
                        ? `linear-gradient(135deg, ${colors.success}, #2ea043)`
                        : `linear-gradient(135deg, ${colors.purple}, #8b5cf6)`,
                    border: `3px solid ${colors.bg}`,
                    boxShadow: isCapturing
                        ? `0 0 0 8px ${colors.success}20, 0 8px 32px ${colors.success}60`
                        : `0 0 0 4px ${colors.purple}20, 0 8px 32px ${colors.purple}60`,
                    cursor: disabled || !screenshot ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    transition: 'all 0.3s ease',
                    opacity: disabled || !screenshot ? 0.5 : 1,
                    position: 'relative',
                    overflow: 'hidden',
                    animation: isCapturing ? 'pulse 0.6s ease-in-out' : 'float 3s ease-in-out infinite'
                }}
                onMouseEnter={(e) => {
                    if (!disabled && screenshot) {
                        e.currentTarget.style.transform = 'scale(1.1) translateY(-4px)'
                        e.currentTarget.style.boxShadow = `0 0 0 6px ${colors.purple}30, 0 12px 40px ${colors.purple}80`
                    }
                }}
                onMouseLeave={(e) => {
                    if (!disabled && screenshot) {
                        e.currentTarget.style.transform = 'scale(1) translateY(0)'
                        e.currentTarget.style.boxShadow = `0 0 0 4px ${colors.purple}20, 0 8px 32px ${colors.purple}60`
                    }
                }}
            >
                {/* Animated Ring */}
                {isCapturing && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderRadius: '50%',
                        border: `4px solid white`,
                        animation: 'expandRing 1s ease-out'
                    }} />
                )}

                {/* Icon */}
                <span style={{
                    filter: isCapturing ? 'brightness(1.2)' : 'none',
                    transform: isCapturing ? 'scale(0.8)' : 'scale(1)',
                    transition: 'all 0.3s'
                }}>
                    {isCapturing ? '✓' : '📷'}
                </span>

                {/* Flash Effect */}
                {isCapturing && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'white',
                        borderRadius: '50%',
                        animation: 'flash 0.4s ease-out',
                        pointerEvents: 'none'
                    }} />
                )}
            </button>

            {/* Capture Count Badge */}
            {!disabled && screenshot && (
                <div style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    minWidth: '24px',
                    height: '24px',
                    padding: '0 6px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${colors.primary}, #e65b00)`,
                    border: `2px solid ${colors.bg}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: 'white',
                    boxShadow: `0 4px 12px ${colors.primary}60`,
                    animation: 'bounce 0.5s ease-out'
                }}>
                    0
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.05);
                    }
                }

                @keyframes expandRing {
                    0% {
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.5);
                        opacity: 0;
                    }
                }

                @keyframes flash {
                    0% {
                        opacity: 0.8;
                    }
                    100% {
                        opacity: 0;
                    }
                }

                @keyframes bounce {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.2);
                    }
                }
            `}</style>
        </div>
    )
}
