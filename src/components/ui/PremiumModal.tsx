import React, { useEffect, useState } from 'react'

interface Props {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showCloseButton?: boolean
}

export default function PremiumModal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true
}: Props) {
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true)
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }

        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [isOpen])

    if (!isOpen && !isAnimating) return null

    const sizes = {
        sm: '400px',
        md: '600px',
        lg: '800px',
        xl: '1000px'
    }

    const handleClose = () => {
        setIsAnimating(false)
        setTimeout(onClose, 300)
    }

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9998,
                    animation: `fadeIn 0.3s ${isOpen ? 'forwards' : 'reverse'}`,
                    opacity: isOpen ? 1 : 0
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: sizes[size],
                    maxHeight: '90vh',
                    background: 'linear-gradient(135deg, #1e1e2e, #1a1a24)',
                    border: '2px solid transparent',
                    backgroundImage: `
                        linear-gradient(#1e1e2e, #1a1a24),
                        linear-gradient(135deg, #8b5cf6, #06b6d4)
                    `,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    borderRadius: '20px',
                    boxShadow: `
                        0 20px 60px rgba(0, 0, 0, 0.8),
                        0 0 40px rgba(139, 92, 246, 0.3),
                        inset 0 0 60px rgba(139, 92, 246, 0.05)
                    `,
                    zIndex: 9999,
                    animation: `scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${isOpen ? 'forwards' : 'reverse'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div style={{
                        padding: '24px 28px',
                        borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(139, 92, 246, 0.05)'
                    }}>
                        {title && (
                            <h2 style={{
                                margin: 0,
                                fontSize: '22px',
                                fontWeight: '700',
                                background: 'linear-gradient(135deg, #f5f5f7, #8b5cf6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                letterSpacing: '-0.5px'
                            }}>
                                {title}
                            </h2>
                        )}

                        {showCloseButton && (
                            <button
                                onClick={handleClose}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    transition: 'all 0.2s',
                                    marginLeft: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                                    e.currentTarget.style.borderColor = '#ef4444'
                                    e.currentTarget.style.color = '#ef4444'
                                    e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)'
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                                    e.currentTarget.style.color = '#9ca3af'
                                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)'
                                }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div style={{
                    flex: 1,
                    padding: '28px',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>
                    {children}
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `}</style>
        </>
    )
}
