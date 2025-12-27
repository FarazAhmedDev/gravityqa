import React, { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface Props {
    toasts: Toast[]
    onRemove: (id: string) => void
}

export default function PremiumToast({ toasts, onRemove }: Props) {
    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return '✓'
            case 'error': return '✕'
            case 'warning': return '⚠'
            case 'info': return 'ℹ'
        }
    }

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success': return { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.4)' }
            case 'error': return { bg: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' }
            case 'warning': return { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)' }
            case 'info': return { bg: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)' }
        }
    }

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxWidth: '400px'
        }}>
            {toasts.map((toast, index) => {
                const colors = getColors(toast.type)

                return (
                    <ToastItem
                        key={toast.id}
                        toast={toast}
                        colors={colors}
                        icon={getIcon(toast.type)}
                        onRemove={onRemove}
                        index={index}
                    />
                )
            })}
        </div>
    )
}

function ToastItem({ toast, colors, icon, onRemove, index }: {
    toast: Toast
    colors: { bg: string, glow: string }
    icon: string
    onRemove: (id: string) => void
    index: number
}) {
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true)
            setTimeout(() => onRemove(toast.id), 300)
        }, toast.duration || 4000)

        return () => clearTimeout(timer)
    }, [toast.id, toast.duration, onRemove])

    return (
        <div
            style={{
                padding: '16px 20px',
                background: 'rgba(26, 26, 36, 0.95)',
                backdropFilter: 'blur(20px)',
                border: `2px solid ${colors.bg}`,
                borderRadius: '12px',
                boxShadow: `0 8px 24px ${colors.glow}, 0 0 0 1px rgba(255,255,255,0.05)`,
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                cursor: 'pointer',
                animation: `slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both ${isExiting ? ', slideOutRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' : ''}`,
                transform: isExiting ? 'translateX(400px)' : 'translateX(0)',
                opacity: isExiting ? 0 : 1,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            onClick={() => {
                setIsExiting(true)
                setTimeout(() => onRemove(toast.id), 300)
            }}
        >
            {/* Icon */}
            <div
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors.bg}, ${colors.bg}dd)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${colors.glow}`
                }}
            >
                {icon}
            </div>

            {/* Message */}
            <div style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: '500',
                color: '#f5f5f7',
                lineHeight: '1.5'
            }}>
                {toast.message}
            </div>

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExiting(true)
                    setTimeout(() => onRemove(toast.id), 300)
                }}
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'all 0.2s',
                    flexShrink: 0
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.color = '#9ca3af'
                }}
            >
                ✕
            </button>

            {/* Animations */}
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}

// Hook for using toasts
export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (type: ToastType, message: string, duration?: number) => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, type, message, duration }])
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return {
        toasts,
        addToast,
        removeToast,
        success: (message: string, duration?: number) => addToast('success', message, duration),
        error: (message: string, duration?: number) => addToast('error', message, duration),
        warning: (message: string, duration?: number) => addToast('warning', message, duration),
        info: (message: string, duration?: number) => addToast('info', message, duration)
    }
}
