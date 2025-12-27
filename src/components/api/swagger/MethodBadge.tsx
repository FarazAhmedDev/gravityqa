import { getMethodColor, getMethodGradient, swaggerTheme } from './swaggerTheme'

interface Props {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
    size?: 'sm' | 'md' | 'lg'
}

export default function MethodBadge({ method, size = 'md' }: Props) {
    const sizes = {
        sm: { padding: '4px 10px', fontSize: '11px', borderRadius: '6px' },
        md: { padding: '6px 14px', fontSize: '13px', borderRadius: '8px' },
        lg: { padding: '8px 18px', fontSize: '14px', borderRadius: '10px' }
    }

    const sizeStyle = sizes[size]
    const methodColor = getMethodColor(method)
    const gradient = getMethodGradient(method)

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...sizeStyle,
                background: gradient,
                color: '#ffffff',
                fontWeight: '800',
                fontFamily: 'JetBrains Mono, Monaco, monospace',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                boxShadow: `0 2px 8px ${methodColor}40, 0 0 20px ${methodColor}20`,
                border: `1px solid ${methodColor}60`,
                position: 'relative',
                overflow: 'hidden',
                transition: swaggerTheme.transition.base
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${methodColor}60, 0 0 30px ${methodColor}40`
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${methodColor}40, 0 0 20px ${methodColor}20`
            }}
        >
            {/* Shine effect */}
            <span
                style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'shine 3s infinite'
                }}
            />

            {/* Badge content */}
            <span style={{ position: 'relative', zIndex: 1 }}>
                {method}
            </span>

            {/* Global shine animation */}
            <style>
                {`
                    @keyframes shine {
                        0% { left: -100%; }
                        20%, 100% { left: 100%; }
                    }
                `}
            </style>
        </span>
    )
}
