import React from 'react'

interface Props {
    icon: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'gradient' | 'glow' | 'float' | 'spin' | 'pulse'
    color?: string
    onClick?: () => void
}

export default function PremiumIcon({
    icon,
    size = 'md',
    variant = 'default',
    color,
    onClick
}: Props) {
    const sizes = {
        xs: { width: 20, fontSize: 12, padding: 6 },
        sm: { width: 32, fontSize: 16, padding: 8 },
        md: { width: 48, fontSize: 24, padding: 12 },
        lg: { width: 64, fontSize: 32, padding: 16 },
        xl: { width: 80, fontSize: 40, padding: 20 }
    }

    const { width, fontSize, padding } = sizes[size]

    const getVariantStyles = () => {
        const baseColor = color || '#8b5cf6'

        switch (variant) {
            case 'gradient':
                return {
                    background: `linear-gradient(135deg, ${baseColor}, #06b6d4)`,
                    boxShadow: `0 4px 15px ${baseColor}40, 0 0 30px ${baseColor}20`,
                    border: `2px solid ${baseColor}60`
                }
            case 'glow':
                return {
                    background: `rgba(139, 92, 246, 0.1)`,
                    boxShadow: `0 0 30px ${baseColor}, inset 0 0 20px ${baseColor}40`,
                    border: `2px solid ${baseColor}`,
                    animation: 'glow-pulse 2s ease-in-out infinite'
                }
            case 'float':
                return {
                    background: `linear-gradient(135deg, ${baseColor}20, ${baseColor}10)`,
                    border: `2px solid ${baseColor}40`,
                    animation: 'float 3s ease-in-out infinite'
                }
            case 'spin':
                return {
                    background: `linear-gradient(135deg, ${baseColor}, #06b6d4)`,
                    boxShadow: `0 0 20px ${baseColor}60`,
                    animation: 'spin 3s linear infinite'
                }
            case 'pulse':
                return {
                    background: `linear-gradient(135deg, ${baseColor}30, ${baseColor}10)`,
                    border: `2px solid ${baseColor}`,
                    animation: 'scale-pulse 2s ease-in-out infinite'
                }
            default:
                return {
                    background: 'rgba(26, 26, 36, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }
        }
    }

    const variantStyles = getVariantStyles()

    return (
        <div
            onClick={onClick}
            style={{
                width: `${width}px`,
                height: `${width}px`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${fontSize}px`,
                cursor: onClick ? 'pointer' : 'default',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(10px)',
                ...variantStyles
            }}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)'
                    if (variant === 'gradient' || variant === 'spin') {
                        e.currentTarget.style.boxShadow = `0 8px 25px ${color || '#8b5cf6'}60, 0 0 40px ${color || '#8b5cf6'}40`
                    }
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                }
            }}
        >
            {/* Shimmer effect overlay */}
            {variant === 'gradient' && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        animation: 'shimmer 3s infinite'
                    }}
                />
            )}

            {/* Rotating ring for glow variant */}
            {variant === 'glow' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: '-4px',
                        borderRadius: '18px',
                        background: `linear-gradient(45deg, ${color || '#8b5cf6'}, transparent, ${color || '#8b5cf6'})`,
                        opacity: 0.5,
                        animation: 'rotate 4s linear infinite',
                        filter: 'blur(8px)'
                    }}
                />
            )}

            {/* Icon content */}
            <span style={{
                position: 'relative',
                zIndex: 1,
                filter: variant === 'gradient' || variant === 'spin' ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}>
                {icon}
            </span>

            {/* Animations */}
            <style>{`
                @keyframes shimmer {
                    0% { left: -100%; }
                    20%, 100% { left: 100%; }
                }
                
                @keyframes glow-pulse {
                    0%, 100% {
                        box-shadow: 0 0 30px ${color || '#8b5cf6'}, inset 0 0 20px ${color || '#8b5cf6'}40;
                    }
                    50% {
                        box-shadow: 0 0 50px ${color || '#8b5cf6'}, inset 0 0 30px ${color || '#8b5cf6'}60;
                    }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes scale-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

// Premium Icon Grid Component
interface GridProps {
    icons: Array<{
        icon: string
        label?: string
        variant?: 'default' | 'gradient' | 'glow' | 'float' | 'spin' | 'pulse'
        onClick?: () => void
    }>
    columns?: number
}

export function PremiumIconGrid({ icons, columns = 4 }: GridProps) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '20px',
            padding: '20px'
        }}>
            {icons.map((item, index) => (
                <div
                    key={index}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                    }}
                >
                    <PremiumIcon
                        icon={item.icon}
                        variant={item.variant}
                        onClick={item.onClick}
                    />
                    {item.label && (
                        <span style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#9ca3af',
                            textAlign: 'center'
                        }}>
                            {item.label}
                        </span>
                    )}
                </div>
            ))}

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    )
}
