/**
 * Premium Green Button Component
 * Consistent premium styling across entire app
 */

export const PremiumGreenButton = ({
    onClick,
    children,
    disabled = false,
    icon = null,
    fullWidth = false,
    size = 'medium'
}: {
    onClick?: () => void
    children: React.ReactNode
    disabled?: boolean
    icon?: React.ReactNode
    fullWidth?: boolean
    size?: 'small' | 'medium' | 'large'
}) => {
    const sizeStyles = {
        small: { padding: '8px 16px', fontSize: '13px', height: '36px' },
        medium: { padding: '12px 28px', fontSize: '14px', height: '44px' },
        large: { padding: '14px 32px', fontSize: '16px', height: '50px' }
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                position: 'relative',
                background: disabled
                    ? 'linear-gradient(135deg, #6e7681 0%, #57606a 100%)'
                    : 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
                color: 'white',
                border: 'none',
                ...sizeStyles[size],
                borderRadius: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                width: fullWidth ? '100%' : 'auto',
                boxShadow: disabled
                    ? '0 2px 8px rgba(0,0,0,0.2)'
                    : `
                        0 1px 0 0 rgba(255,255,255,0.4) inset,
                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                        0 6px 20px -4px rgba(62,185,80,0.5),
                        0 12px 40px -8px rgba(62,185,80,0.3)
                    `,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                opacity: disabled ? 0.6 : 1,
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                    e.currentTarget.style.boxShadow = `
                        0 1px 0 0 rgba(255,255,255,0.5) inset,
                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                        0 8px 28px -4px rgba(62,185,80,0.6),
                        0 16px 50px -8px rgba(62,185,80,0.4)
                    `
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                    e.currentTarget.style.boxShadow = `
                        0 1px 0 0 rgba(255,255,255,0.4) inset,
                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                        0 6px 20px -4px rgba(62,185,80,0.5),
                        0 12px 40px -8px rgba(62,185,80,0.3)
                    `
                }
            }}
        >
            {/* Glossy Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '50%',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                borderRadius: '12px 12px 0 0',
                pointerEvents: 'none'
            }} />

            {/* Content */}
            <span style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
            }}>
                {icon}
                {children}
            </span>
        </button>
    )
}

// Inline style version for quick use
export const premiumGreenButtonStyle = (disabled = false) => ({
    position: 'relative' as const,
    background: disabled
        ? 'linear-gradient(135deg, #6e7681 0%, #57606a 100%)'
        : 'linear-gradient(135deg, #3fb950 0%, #2ea043 50%, #238636 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 28px',
    height: '44px',
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: '14px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    boxShadow: disabled
        ? '0 2px 8px rgba(0,0,0,0.2)'
        : `
            0 1px 0 0 rgba(255,255,255,0.4) inset,
            0 -1px 0 0 rgba(0,0,0,0.2) inset,
            0 6px 20px -4px rgba(62,185,80,0.5),
            0 12px 40px -8px rgba(62,185,80,0.3)
        `,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden' as const,
    opacity: disabled ? 0.6 : 1
})
