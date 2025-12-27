import React from 'react'

interface Props {
    icon?: string
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
    variant?: 'default' | 'grid' | 'hero'
}

export default function PremiumEmptyState({
    icon = '📦',
    title,
    description,
    action,
    variant = 'default'
}: Props) {
    if (variant === 'hero') {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                padding: '60px 40px',
                textAlign: 'center'
            }}>
                {/* Animated icon */}
                <div style={{
                    position: 'relative',
                    marginBottom: '32px'
                }}>
                    {/* Glow rings */}
                    <div style={{
                        position: 'absolute',
                        inset: '-40px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1), transparent 70%)',
                        animation: 'pulse 3s ease-in-out infinite'
                    }} />

                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))',
                        border: '2px solid rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '64px',
                        position: 'relative',
                        boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)',
                        animation: 'float 4s ease-in-out infinite'
                    }}>
                        {icon}
                    </div>
                </div>

                {/* Title */}
                <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '32px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #f5f5f7, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    letterSpacing: '-1px'
                }}>
                    {title}
                </h2>

                {/* Description */}
                {description && (
                    <p style={{
                        margin: '0 0 32px 0',
                        fontSize: '16px',
                        color: '#9ca3af',
                        maxWidth: '500px',
                        lineHeight: '1.6'
                    }}>
                        {description}
                    </p>
                )}

                {/* Action button */}
                {action && (
                    <button
                        onClick={action.onClick}
                        style={{
                            padding: '14px 32px',
                            background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#ffffff',
                            fontSize: '15px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 8px 20px rgba(139, 92, 246, 0.4)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(139, 92, 246, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(139, 92, 246, 0.4)'
                        }}
                    >
                        <span style={{ position: 'relative', zIndex: 1 }}>
                            {action.label}
                        </span>

                        {/* Shimmer effect */}
                        <span style={{
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            animation: 'shimmer 3s infinite'
                        }} />
                    </button>
                )}

                {/* Animations */}
                <style>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.1); }
                    }
                    
                    @keyframes shimmer {
                        0% { left: -100%; }
                        20%, 100% { left: 100%; }
                    }
                `}</style>
            </div>
        )
    }

    // Default/Grid variant
    return (
        <div style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: 'rgba(26, 26, 36, 0.5)',
            borderRadius: '16px',
            border: '1px dashed rgba(139, 92, 246, 0.3)'
        }}>
            <div style={{
                fontSize: '56px',
                marginBottom: '20px',
                opacity: 0.3
            }}>
                {icon}
            </div>

            <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#f5f5f7'
            }}>
                {title}
            </h3>

            {description && (
                <p style={{
                    margin: '0 0 24px 0',
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5'
                }}>
                    {description}
                </p>
            )}

            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        padding: '10px 24px',
                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                    }}
                >
                    {action.label}
                </button>
            )}
        </div>
    )
}
