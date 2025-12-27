import React from 'react'

interface Props {
    variant?: 'default' | 'gradient' | 'glow'
    placeholder?: string
    value?: string
    onChange?: (value: string) => void
    type?: 'text' | 'email' | 'password' | 'number' | 'url'
    icon?: string
    error?: string
    disabled?: boolean
    autoFocus?: boolean
}

export default function PremiumInput({
    variant = 'default',
    placeholder,
    value,
    onChange,
    type = 'text',
    icon,
    error,
    disabled,
    autoFocus
}: Props) {
    const [isFocused, setIsFocused] = React.useState(false)

    const getVariantStyles = () => {
        switch (variant) {
            case 'gradient':
                return {
                    border: '2px solid transparent',
                    background: 'linear-gradient(#1a1a24, #1a1a24) padding-box, linear-gradient(135deg, #8b5cf6, #06b6d4) border-box',
                    boxShadow: isFocused ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none'
                }
            case 'glow':
                return {
                    border: `2px solid ${isFocused ? '#8b5cf6' : '#2a2a3a'}`,
                    background: '#1a1a24',
                    boxShadow: isFocused ? '0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1)' : 'none'
                }
            default:
                return {
                    border: `1px solid ${isFocused ? '#8b5cf6' : '#2a2a3a'}`,
                    background: '#1a1a24',
                    boxShadow: isFocused ? '0 4px 12px rgba(139, 92, 246, 0.2)' : 'none'
                }
        }
    }

    const variantStyles = getVariantStyles()

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {/* Input container */}
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    ...variantStyles,
                    borderRadius: '12px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* Icon */}
                {icon && (
                    <div style={{
                        padding: '0 16px',
                        fontSize: '18px',
                        color: isFocused ? '#8b5cf6' : '#6b7280',
                        transition: 'color 0.3s'
                    }}>
                        {icon}
                    </div>
                )}

                {/* Input */}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        flex: 1,
                        padding: '14px 16px',
                        paddingLeft: icon ? '0' : '16px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#f5f5f7',
                        fontSize: '15px',
                        fontWeight: '500',
                        fontFamily: 'Inter, sans-serif'
                    }}
                />

                {/* Focus glow effect */}
                {isFocused && variant === 'glow' && (
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-2px',
                            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                            opacity: 0.2,
                            filter: 'blur(10px)',
                            animation: 'pulse 2s ease-in-out infinite',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </div>

            {/* Error message */}
            {error && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'shake 0.3s'
                }}>
                    <span>⚠</span>
                    {error}
                </div>
            )}

            {/* Animations */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `}</style>
        </div>
    )
}
