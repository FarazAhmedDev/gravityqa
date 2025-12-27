import React from 'react'

interface Props {
    size?: 'sm' | 'md' | 'lg'
    text?: string
}

export default function PremiumLoader({ size = 'md', text }: Props) {
    const sizes = {
        sm: { width: 40, height: 40, border: 3 },
        md: { width: 60, height: 60, border: 4 },
        lg: { width: 80, height: 80, border: 5 }
    }

    const { width, height, border } = sizes[size]

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
        }}>
            {/* Spinning loader */}
            <div style={{
                position: 'relative',
                width: `${width}px`,
                height: `${height}px`
            }}>
                {/* Outer ring */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        border: `${border}px solid transparent`,
                        borderTopColor: '#8b5cf6',
                        borderRightColor: '#06b6d4',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))'
                    }}
                />

                {/* Inner ring */}
                <div
                    style={{
                        position: 'absolute',
                        inset: `${border * 2}px`,
                        border: `${border - 1}px solid transparent`,
                        borderBottomColor: '#a78bfa',
                        borderLeftColor: '#10b981',
                        borderRadius: '50%',
                        animation: 'spin-reverse 0.8s linear infinite'
                    }}
                />

                {/* Center glow */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '35%',
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent)',
                        borderRadius: '50%',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}
                />
            </div>

            {/* Loading text */}
            {text && (
                <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    animation: 'pulse 2s ease-in-out infinite'
                }}>
                    {text}
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes spin-reverse {
                    from { transform: rotate(360deg); }
                    to { transform: rotate(0deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.1); }
                }
            `}</style>
        </div>
    )
}
