import { useState, useRef, useEffect } from 'react'

interface Environment {
    id: string
    name: string
    baseUrl: string
    color: string
}

interface EnvironmentSelectorProps {
    currentEnv: string
    environments: Environment[]
    onChange: (envId: string) => void
    disabled?: boolean
}

export default function EnvironmentSelector({
    currentEnv,
    environments,
    onChange,
    disabled = false
}: EnvironmentSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        blue: '#58a6ff'
    }

    const currentEnvironment = environments.find(env => env.id === currentEnv) || environments[0]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <div
            ref={dropdownRef}
            style={{
                position: 'relative',
                opacity: disabled ? 0.5 : 1,
                pointerEvents: disabled ? 'none' : 'auto'
            }}
        >
            {/* Dropdown Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: colors.bgTertiary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    color: colors.text,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = colors.bgSecondary
                    e.currentTarget.style.borderColor = colors.blue
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = colors.bgTertiary
                    e.currentTarget.style.borderColor = colors.border
                }}
            >
                <span style={{
                    fontSize: '11px',
                    color: colors.textSecondary,
                    fontWeight: 700,
                    letterSpacing: '0.5px'
                }}>
                    ENV:
                </span>
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: currentEnvironment.color,
                    boxShadow: `0 0 8px ${currentEnvironment.color}80`
                }} />
                <span style={{ flex: 1 }}>
                    {currentEnvironment.name}
                </span>
                <span style={{
                    fontSize: '10px',
                    transition: 'transform 0.3s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                    ▼
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: `linear-gradient(135deg, ${colors.bgSecondary}, ${colors.bgTertiary})`,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                    overflow: 'hidden',
                    zIndex: 1000,
                    animation: 'slideDown 0.2s ease-out'
                }}>
                    {environments.map((env) => (
                        <button
                            key={env.id}
                            onClick={() => {
                                onChange(env.id)
                                setIsOpen(false)
                            }}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 16px',
                                background: currentEnv === env.id ? `${env.color}15` : 'transparent',
                                border: 'none',
                                borderBottom: `1px solid ${colors.border}`,
                                color: colors.text,
                                fontSize: '13px',
                                fontWeight: currentEnv === env.id ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = `${env.color}20`
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = currentEnv === env.id ? `${env.color}15` : 'transparent'
                            }}
                        >
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: env.color,
                                boxShadow: `0 0 10px ${env.color}80`,
                                flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontSize: '13px',
                                    marginBottom: '2px'
                                }}>
                                    {env.name}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: colors.textSecondary,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {env.baseUrl}
                                </div>
                            </div>
                            {currentEnv === env.id && (
                                <span style={{
                                    color: env.color,
                                    fontSize: '14px',
                                    flexShrink: 0
                                }}>
                                    ✓
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
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
