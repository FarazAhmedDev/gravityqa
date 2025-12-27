import { useState } from 'react'
import { swaggerTheme } from './swaggerTheme'

export interface Environment {
    id: string
    name: string
    variables: Record<string, string>
}

interface Props {
    environments: Environment[]
    currentEnvId: string | null
    onChange: (environments: Environment[]) => void
    onSelect: (envId: string | null) => void
}

export default function EnvironmentSelector({ environments, currentEnvId, onChange, onSelect }: Props) {
    const [editingId, setEditingId] = useState<string | null>(null)

    const currentEnv = environments.find(e => e.id === currentEnvId)

    const addEnvironment = () => {
        const newEnv: Environment = {
            id: Date.now().toString(),
            name: 'New Environment',
            variables: {
                'baseUrl': 'https://api.example.com',
                'apiKey': 'your-api-key'
            }
        }
        onChange([...environments, newEnv])
        setEditingId(newEnv.id)
    }

    const updateEnvironment = (id: string, updates: Partial<Environment>) => {
        onChange(environments.map(env => env.id === id ? { ...env, ...updates } : env))
    }

    const deleteEnvironment = (id: string) => {
        if (!confirm('Delete this environment?')) return
        onChange(environments.filter(env => env.id !== id))
        if (currentEnvId === id) {
            onSelect(null)
        }
    }

    const addVariable = (envId: string) => {
        const env = environments.find(e => e.id === envId)
        if (env) {
            updateEnvironment(envId, {
                variables: { ...env.variables, 'newVariable': '' }
            })
        }
    }

    const updateVariable = (envId: string, oldKey: string, newKey: string, value: string) => {
        const env = environments.find(e => e.id === envId)
        if (env) {
            const newVars = { ...env.variables }
            if (oldKey !== newKey) {
                delete newVars[oldKey]
            }
            newVars[newKey] = value
            updateEnvironment(envId, { variables: newVars })
        }
    }

    const deleteVariable = (envId: string, key: string) => {
        const env = environments.find(e => e.id === envId)
        if (env) {
            const newVars = { ...env.variables }
            delete newVars[key]
            updateEnvironment(envId, { variables: newVars })
        }
    }

    return (
        <div>
            {/* Current Environment Selector */}
            <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: swaggerTheme.bgSecondary,
                borderRadius: '8px',
                border: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px'
                }}>
                    <div>
                        <div style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            color: swaggerTheme.text,
                            marginBottom: '4px'
                        }}>
                            Active Environment
                        </div>
                        <div style={{
                            fontSize: '13px',
                            color: swaggerTheme.textSecondary
                        }}>
                            Select which environment to use for requests
                        </div>
                    </div>
                    <button
                        onClick={addEnvironment}
                        style={{
                            padding: '10px 16px',
                            background: swaggerTheme.primary,
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <span>+</span> New Environment
                    </button>
                </div>

                <select
                    value={currentEnvId || ''}
                    onChange={(e) => onSelect(e.target.value || null)}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: swaggerTheme.bg,
                        border: `2px solid ${currentEnv ? swaggerTheme.primary : swaggerTheme.border}`,
                        borderRadius: '6px',
                        color: swaggerTheme.text,
                        fontSize: '15px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                >
                    <option value="">🌍 No Environment</option>
                    {environments.map(env => (
                        <option key={env.id} value={env.id}>
                            {env.name} ({Object.keys(env.variables).length} variables)
                        </option>
                    ))}
                </select>

                {currentEnv && (
                    <div style={{
                        marginTop: '12px',
                        padding: '12px 14px',
                        background: swaggerTheme.primary + '10',
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: swaggerTheme.textSecondary,
                        borderLeft: `3px solid ${swaggerTheme.primary}`
                    }}>
                        <strong style={{ color: swaggerTheme.text }}>✓ Active:</strong> {currentEnv.name} with {Object.keys(currentEnv.variables).length} variable(s)
                    </div>
                )}
            </div>

            {/* Environment List */}
            {environments.length > 0 && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: swaggerTheme.text
                    }}>
                        Manage Environments
                    </div>

                    {environments.map(env => (
                        <div
                            key={env.id}
                            style={{
                                padding: '20px',
                                background: env.id === currentEnvId ? swaggerTheme.primary + '10' : swaggerTheme.bgSecondary,
                                border: `2px solid ${env.id === currentEnvId ? swaggerTheme.primary : swaggerTheme.border}`,
                                borderRadius: '8px'
                            }}
                        >
                            {/* Env Name & Actions */}
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '16px',
                                alignItems: 'center'
                            }}>
                                {editingId === env.id ? (
                                    <input
                                        type="text"
                                        value={env.name}
                                        onChange={(e) => updateEnvironment(env.id, { name: e.target.value })}
                                        onBlur={() => setEditingId(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                        autoFocus
                                        style={{
                                            flex: 1,
                                            padding: '10px 12px',
                                            background: swaggerTheme.bg,
                                            border: `2px solid ${swaggerTheme.primary}`,
                                            borderRadius: '6px',
                                            color: swaggerTheme.text,
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            outline: 'none'
                                        }}
                                    />
                                ) : (
                                    <div
                                        onClick={() => setEditingId(env.id)}
                                        style={{
                                            flex: 1,
                                            fontSize: '16px',
                                            fontWeight: '700',
                                            color: swaggerTheme.text,
                                            cursor: 'pointer',
                                            padding: '8px 0'
                                        }}
                                    >
                                        🌍 {env.name}
                                        {env.id === currentEnvId && (
                                            <span style={{
                                                marginLeft: '8px',
                                                fontSize: '12px',
                                                color: swaggerTheme.primary,
                                                fontWeight: '600'
                                            }}>
                                                (Active)
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => onSelect(env.id)}
                                    disabled={env.id === currentEnvId}
                                    style={{
                                        padding: '8px 16px',
                                        background: env.id === currentEnvId ? swaggerTheme.border : swaggerTheme.primary,
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: env.id === currentEnvId ? 'not-allowed' : 'pointer',
                                        opacity: env.id === currentEnvId ? 0.5 : 1
                                    }}
                                >
                                    {env.id === currentEnvId ? '✓ Active' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => deleteEnvironment(env.id)}
                                    style={{
                                        padding: '8px 16px',
                                        background: swaggerTheme.status.error + '20',
                                        border: `1px solid ${swaggerTheme.status.error}`,
                                        borderRadius: '6px',
                                        color: swaggerTheme.status.error,
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🗑️ Delete
                                </button>
                            </div>

                            {/* Variables */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '12px'
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: swaggerTheme.textSecondary
                                    }}>
                                        Variables ({Object.keys(env.variables).length})
                                    </div>
                                    <button
                                        onClick={() => addVariable(env.id)}
                                        style={{
                                            padding: '6px 12px',
                                            background: swaggerTheme.bgTertiary,
                                            border: `1px solid ${swaggerTheme.border}`,
                                            borderRadius: '4px',
                                            color: swaggerTheme.text,
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Add Variable
                                    </button>
                                </div>

                                {Object.entries(env.variables).length === 0 ? (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: swaggerTheme.textSecondary,
                                        background: swaggerTheme.bg,
                                        borderRadius: '6px',
                                        fontSize: '13px'
                                    }}>
                                        No variables. Click "+ Add Variable" to create one.
                                    </div>
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px'
                                    }}>
                                        {Object.entries(env.variables).map(([key, value]) => (
                                            <div key={key} style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 2fr auto',
                                                gap: '10px',
                                                alignItems: 'center',
                                                padding: '10px',
                                                background: swaggerTheme.bg,
                                                borderRadius: '6px'
                                            }}>
                                                <input
                                                    type="text"
                                                    value={key}
                                                    onChange={(e) => updateVariable(env.id, key, e.target.value, value)}
                                                    placeholder="variableName"
                                                    style={{
                                                        padding: '8px 10px',
                                                        background: swaggerTheme.bgTertiary,
                                                        border: `1px solid ${swaggerTheme.border}`,
                                                        borderRadius: '4px',
                                                        color: swaggerTheme.primary,
                                                        fontSize: '13px',
                                                        fontFamily: 'monospace',
                                                        fontWeight: '600',
                                                        outline: 'none'
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(e) => updateVariable(env.id, key, key, e.target.value)}
                                                    placeholder="value"
                                                    style={{
                                                        padding: '8px 10px',
                                                        background: swaggerTheme.bgTertiary,
                                                        border: `1px solid ${swaggerTheme.border}`,
                                                        borderRadius: '4px',
                                                        color: swaggerTheme.text,
                                                        fontSize: '13px',
                                                        fontFamily: 'monospace',
                                                        outline: 'none'
                                                    }}
                                                />
                                                <button
                                                    onClick={() => deleteVariable(env.id, key)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: 'transparent',
                                                        border: `1px solid ${swaggerTheme.border}`,
                                                        borderRadius: '4px',
                                                        color: swaggerTheme.textSecondary,
                                                        fontSize: '14px',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Delete variable"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Usage Guide */}
            <div style={{
                marginTop: '24px',
                padding: '16px',
                background: swaggerTheme.bgSecondary,
                borderRadius: '8px',
                border: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: swaggerTheme.text,
                    marginBottom: '12px'
                }}>
                    💡 How to use variables
                </div>
                <div style={{
                    fontSize: '13px',
                    color: swaggerTheme.textSecondary,
                    lineHeight: '1.7'
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        Use double curly braces to reference variables in your requests:
                    </p>
                    <code style={{
                        display: 'block',
                        padding: '12px',
                        background: swaggerTheme.bg,
                        borderRadius: '4px',
                        color: swaggerTheme.primary,
                        fontFamily: 'monospace',
                        marginBottom: '8px'
                    }}>
                        {'{{'} baseUrl {'}}'}/users/{'{{'} userId {'}}'}
                    </code>
                    <p style={{ margin: '8px 0 0 0' }}>
                        Variables work in: URLs, headers, query parameters, and request bodies
                    </p>
                </div>
            </div>
        </div>
    )
}

// Helper function to replace variables in text
export function replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
        result = result.replace(regex, value)
    })
    return result
}
