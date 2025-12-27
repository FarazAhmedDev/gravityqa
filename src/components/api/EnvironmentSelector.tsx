import { useState } from 'react'
import { swaggerTheme } from './swagger/swaggerTheme'

export interface Environment {
    id: string
    name: string
    baseUrl: string
    variables: Record<string, string>
}

interface Props {
    environments: Environment[]
    activeEnvironment: Environment | null
    onSelect: (env: Environment) => void
    onAdd: () => void
    onEdit: (env: Environment) => void
    onDelete: (id: string) => void
}

export default function EnvironmentSelector({
    environments,
    activeEnvironment,
    onSelect,
    onAdd,
    onEdit,
    onDelete
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div style={{
            position: 'relative',
            minWidth: '250px'
        }}>
            {/* Selector Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: swaggerTheme.bgTertiary,
                    border: `1px solid ${swaggerTheme.border}`,
                    borderRadius: '6px',
                    color: swaggerTheme.text,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🌍</span>
                    <span style={{ fontWeight: '600' }}>
                        {activeEnvironment ? activeEnvironment.name : 'No Environment'}
                    </span>
                </div>
                <span style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}>
                    ▼
                </span>
            </button>

            {/* Dropdown */}
            {isExpanded && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: swaggerTheme.bgCard,
                    border: `1px solid ${swaggerTheme.border}`,
                    borderRadius: '6px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflow: 'auto'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 14px',
                        borderBottom: `1px solid ${swaggerTheme.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{
                            fontSize: '13px',
                            fontWeight: '700',
                            color: swaggerTheme.text
                        }}>
                            Environments
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onAdd()
                                setIsExpanded(false)
                            }}
                            style={{
                                padding: '4px 10px',
                                background: swaggerTheme.primary,
                                border: 'none',
                                borderRadius: '4px',
                                color: '#fff',
                                fontSize: '18px',
                                cursor: 'pointer',
                                lineHeight: '1'
                            }}
                        >
                            +
                        </button>
                    </div>

                    {/* Environments List */}
                    {environments.length === 0 ? (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: swaggerTheme.textSecondary,
                            fontSize: '13px'
                        }}>
                            No environments yet
                        </div>
                    ) : (
                        environments.map((env) => {
                            const isActive = activeEnvironment?.id === env.id

                            return (
                                <div
                                    key={env.id}
                                    style={{
                                        padding: '12px 14px',
                                        borderBottom: `1px solid ${swaggerTheme.border}`,
                                        cursor: 'pointer',
                                        background: isActive ? swaggerTheme.bgTertiary : 'transparent',
                                        transition: 'background 0.2s'
                                    }}
                                    onClick={() => {
                                        onSelect(env)
                                        setIsExpanded(false)
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) e.currentTarget.style.background = swaggerTheme.hover
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) e.currentTarget.style.background = 'transparent'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '10px'
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: isActive ? swaggerTheme.methods.post : swaggerTheme.border,
                                            marginTop: '4px',
                                            flexShrink: 0
                                        }} />

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: swaggerTheme.text,
                                                marginBottom: '4px'
                                            }}>
                                                {env.name}
                                            </div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: swaggerTheme.textSecondary,
                                                fontFamily: 'monospace',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {env.baseUrl}
                                            </div>
                                            {Object.keys(env.variables).length > 0 && (
                                                <div style={{
                                                    fontSize: '11px',
                                                    color: swaggerTheme.textMuted,
                                                    marginTop: '4px'
                                                }}>
                                                    {Object.keys(env.variables).length} variable{Object.keys(env.variables).length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            gap: '6px'
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onEdit(env)
                                                }}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'transparent',
                                                    border: `1px solid ${swaggerTheme.border}`,
                                                    borderRadius: '3px',
                                                    color: swaggerTheme.textSecondary,
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (confirm('Delete this environment?')) {
                                                        onDelete(env.id)
                                                    }
                                                }}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'transparent',
                                                    border: `1px solid ${swaggerTheme.border}`,
                                                    borderRadius: '3px',
                                                    color: swaggerTheme.methods.delete,
                                                    fontSize: '12px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

// Variable replacement utility
export function replaceVariables(text: string, env: Environment | null): string {
    if (!env) return text

    let result = text

    // Replace {{baseUrl}}
    result = result.replace(/\{\{baseUrl\}\}/g, env.baseUrl)

    // Replace custom variables
    Object.entries(env.variables).forEach(([key, value]) => {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        result = result.replace(pattern, value)
    })

    return result
}
