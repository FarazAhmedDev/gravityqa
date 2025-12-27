import { useState } from 'react'
import { swaggerTheme } from './swagger/swaggerTheme'

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey'

export interface AuthConfig {
    type: AuthType
    token?: string
    username?: string
    password?: string
    apiKey?: string
    apiKeyHeader?: string
}

interface Props {
    authConfig: AuthConfig
    onChange: (config: AuthConfig) => void
}

export default function AuthPanel({ authConfig, onChange }: Props) {
    const [isExpanded, setIsExpanded] = useState(false)

    const authTypes: { value: AuthType; label: string; icon: string }[] = [
        { value: 'none', label: 'No Auth', icon: '🚫' },
        { value: 'bearer', label: 'Bearer Token', icon: '🔑' },
        { value: 'basic', label: 'Basic Auth', icon: '👤' },
        { value: 'apikey', label: 'API Key', icon: '🗝️' }
    ]

    const currentAuthType = authTypes.find(t => t.value === authConfig.type) || authTypes[0]

    return (
        <div style={{
            background: swaggerTheme.bgSecondary,
            border: `1px solid ${swaggerTheme.border}`,
            borderRadius: '8px',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: swaggerTheme.bgCard
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '18px' }}>{currentAuthType.icon}</span>
                    <div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: '700',
                            color: swaggerTheme.text
                        }}>
                            Authentication
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: swaggerTheme.textSecondary,
                            marginTop: '2px'
                        }}>
                            {currentAuthType.label}
                        </div>
                    </div>
                </div>
                <span style={{
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    color: swaggerTheme.textSecondary
                }}>
                    ▼
                </span>
            </div>

            {/* Content */}
            {isExpanded && (
                <div style={{ padding: '16px' }}>
                    {/* Auth Type Selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: swaggerTheme.text
                        }}>
                            Type
                        </label>
                        <select
                            value={authConfig.type}
                            onChange={(e) => onChange({ ...authConfig, type: e.target.value as AuthType })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: swaggerTheme.bgTertiary,
                                border: `1px solid ${swaggerTheme.border}`,
                                borderRadius: '4px',
                                color: swaggerTheme.text,
                                fontSize: '14px',
                                cursor: 'pointer'
                            }}
                        >
                            {authTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Bearer Token */}
                    {authConfig.type === 'bearer' && (
                        <div>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: swaggerTheme.text
                            }}>
                                Token
                            </label>
                            <input
                                type="text"
                                value={authConfig.token || ''}
                                onChange={(e) => onChange({ ...authConfig, token: e.target.value })}
                                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    background: swaggerTheme.bgTertiary,
                                    border: `1px solid ${swaggerTheme.border}`,
                                    borderRadius: '4px',
                                    color: swaggerTheme.text,
                                    fontSize: '13px',
                                    fontFamily: 'monospace'
                                }}
                            />
                            <div style={{
                                marginTop: '8px',
                                padding: '10px',
                                background: swaggerTheme.bgTertiary,
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: swaggerTheme.textSecondary,
                                fontFamily: 'monospace'
                            }}>
                                Header: <span style={{ color: swaggerTheme.methods.post }}>
                                    Authorization: Bearer {authConfig.token || '&lt;token&gt;'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Basic Auth */}
                    {authConfig.type === 'basic' && (
                        <div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.text
                                }}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={authConfig.username || ''}
                                    onChange={(e) => onChange({ ...authConfig, username: e.target.value })}
                                    placeholder="username"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: swaggerTheme.bgTertiary,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '4px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.text
                                }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={authConfig.password || ''}
                                    onChange={(e) => onChange({ ...authConfig, password: e.target.value })}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: swaggerTheme.bgTertiary,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '4px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                            <div style={{
                                marginTop: '12px',
                                padding: '10px',
                                background: swaggerTheme.bgTertiary,
                                borderRadius: '4px',
                                fontSize: '12px',
                                color: swaggerTheme.textSecondary,
                                fontFamily: 'monospace'
                            }}>
                                Encoded: <span style={{ color: swaggerTheme.methods.post }}>
                                    {authConfig.username && authConfig.password
                                        ? btoa(`${authConfig.username}:${authConfig.password}`)
                                        : '&lt;base64&gt;'
                                    }
                                </span>
                            </div>
                        </div>
                    )}

                    {/* API Key */}
                    {authConfig.type === 'apikey' && (
                        <div>
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.text
                                }}>
                                    Header Name
                                </label>
                                <input
                                    type="text"
                                    value={authConfig.apiKeyHeader || ''}
                                    onChange={(e) => onChange({ ...authConfig, apiKeyHeader: e.target.value })}
                                    placeholder="X-API-Key"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: swaggerTheme.bgTertiary,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '4px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.text
                                }}>
                                    API Key
                                </label>
                                <input
                                    type="text"
                                    value={authConfig.apiKey || ''}
                                    onChange={(e) => onChange({ ...authConfig, apiKey: e.target.value })}
                                    placeholder="your-api-key-here"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        background: swaggerTheme.bgTertiary,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '4px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace'
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Auth injection utility
export function injectAuth(headers: Record<string, string>, authConfig: AuthConfig): Record<string, string> {
    const newHeaders = { ...headers }

    switch (authConfig.type) {
        case 'bearer':
            if (authConfig.token) {
                newHeaders['Authorization'] = `Bearer ${authConfig.token}`
            }
            break

        case 'basic':
            if (authConfig.username && authConfig.password) {
                const encoded = btoa(`${authConfig.username}:${authConfig.password}`)
                newHeaders['Authorization'] = `Basic ${encoded}`
            }
            break

        case 'apikey':
            if (authConfig.apiKeyHeader && authConfig.apiKey) {
                newHeaders[authConfig.apiKeyHeader] = authConfig.apiKey
            }
            break
    }

    return newHeaders
}
