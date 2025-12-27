import { swaggerTheme } from './swaggerTheme'

export type AuthType = 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2'

interface AuthConfig {
    type: AuthType
    basic?: {
        username: string
        password: string
    }
    bearer?: {
        token: string
    }
    apikey?: {
        key: string
        value: string
        addTo: 'header' | 'query'
    }
    oauth2?: {
        accessToken: string
        tokenType: string
    }
}

interface Props {
    auth: AuthConfig
    onChange: (auth: AuthConfig) => void
}

export default function AuthPanel({ auth, onChange }: Props) {
    const updateAuth = (updates: Partial<AuthConfig>) => {
        onChange({ ...auth, ...updates })
    }

    const authTypes: { value: AuthType; label: string; icon: string; description: string }[] = [
        { value: 'none', label: 'No Auth', icon: '🔓', description: 'No authentication required' },
        { value: 'basic', label: 'Basic Auth', icon: '🔐', description: 'Username and password authentication' },
        { value: 'bearer', label: 'Bearer Token', icon: '🎫', description: 'Authorization with bearer token' },
        { value: 'apikey', label: 'API Key', icon: '🔑', description: 'API key in header or query parameter' },
        { value: 'oauth2', label: 'OAuth 2.0', icon: '🌐', description: 'OAuth 2.0 access token' }
    ]

    return (
        <div>
            {/* Type Selector */}
            <div style={{
                marginBottom: '24px',
                padding: '20px',
                background: swaggerTheme.bgSecondary,
                borderRadius: '8px',
                border: `1px solid ${swaggerTheme.border}`
            }}>
                <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: swaggerTheme.text,
                    marginBottom: '12px'
                }}>
                    Authentication Type
                </label>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                }}>
                    {authTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => updateAuth({ type: type.value })}
                            style={{
                                padding: '16px',
                                background: auth.type === type.value ? swaggerTheme.primary + '20' : swaggerTheme.bgTertiary,
                                border: `2px solid ${auth.type === type.value ? swaggerTheme.primary : swaggerTheme.border}`,
                                borderRadius: '8px',
                                color: swaggerTheme.text,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                textAlign: 'left'
                            }}
                        >
                            <div style={{
                                fontSize: '24px',
                                marginBottom: '8px'
                            }}>{type.icon}</div>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                marginBottom: '4px',
                                color: auth.type === type.value ? swaggerTheme.primary : swaggerTheme.text
                            }}>{type.label}</div>
                            <div style={{
                                fontSize: '12px',
                                color: swaggerTheme.textSecondary,
                                lineHeight: '1.4'
                            }}>{type.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Auth Configuration */}
            {auth.type !== 'none' && (
                <div style={{
                    padding: '24px',
                    background: swaggerTheme.bgSecondary,
                    borderRadius: '8px',
                    border: `1px solid ${swaggerTheme.border}`
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: swaggerTheme.text,
                        marginBottom: '20px'
                    }}>
                        Configuration
                    </div>

                    {/* Basic Auth */}
                    {auth.type === 'basic' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.textSecondary,
                                    marginBottom: '8px'
                                }}>
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={auth.basic?.username || ''}
                                    onChange={(e) => updateAuth({
                                        basic: { ...auth.basic!, username: e.target.value }
                                    })}
                                    placeholder="Enter username"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: swaggerTheme.bg,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '6px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.textSecondary,
                                    marginBottom: '8px'
                                }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={auth.basic?.password || ''}
                                    onChange={(e) => updateAuth({
                                        basic: { ...auth.basic!, password: e.target.value }
                                    })}
                                    placeholder="Enter password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: swaggerTheme.bg,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '6px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Bearer Token */}
                    {auth.type === 'bearer' && (
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: swaggerTheme.textSecondary,
                                marginBottom: '8px'
                            }}>
                                Token
                            </label>
                            <textarea
                                value={auth.bearer?.token || ''}
                                onChange={(e) => updateAuth({
                                    bearer: { token: e.target.value }
                                })}
                                placeholder="Paste your bearer token here"
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px 14px',
                                    background: swaggerTheme.bg,
                                    border: `1px solid ${swaggerTheme.border}`,
                                    borderRadius: '6px',
                                    color: swaggerTheme.text,
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    resize: 'vertical',
                                    outline: 'none',
                                    lineHeight: '1.6'
                                }}
                            />
                        </div>
                    )}

                    {/* API Key */}
                    {auth.type === 'apikey' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.textSecondary,
                                    marginBottom: '8px'
                                }}>
                                    Key
                                </label>
                                <input
                                    type="text"
                                    value={auth.apikey?.key || ''}
                                    onChange={(e) => updateAuth({
                                        apikey: { ...auth.apikey!, key: e.target.value }
                                    })}
                                    placeholder="X-API-Key"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: swaggerTheme.bg,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '6px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.textSecondary,
                                    marginBottom: '8px'
                                }}>
                                    Value
                                </label>
                                <input
                                    type="text"
                                    value={auth.apikey?.value || ''}
                                    onChange={(e) => updateAuth({
                                        apikey: { ...auth.apikey!, value: e.target.value }
                                    })}
                                    placeholder="your-api-key-here"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        background: swaggerTheme.bg,
                                        border: `1px solid ${swaggerTheme.border}`,
                                        borderRadius: '6px',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: swaggerTheme.textSecondary,
                                    marginBottom: '8px'
                                }}>
                                    Add to
                                </label>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        padding: '8px'
                                    }}>
                                        <input
                                            type="radio"
                                            checked={auth.apikey?.addTo === 'header'}
                                            onChange={() => updateAuth({
                                                apikey: { ...auth.apikey!, addTo: 'header' }
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        Header
                                    </label>
                                    <label style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        cursor: 'pointer',
                                        color: swaggerTheme.text,
                                        fontSize: '14px',
                                        padding: '8px'
                                    }}>
                                        <input
                                            type="radio"
                                            checked={auth.apikey?.addTo === 'query'}
                                            onChange={() => updateAuth({
                                                apikey: { ...auth.apikey!, addTo: 'query' }
                                            })}
                                            style={{ cursor: 'pointer' }}
                                        />
                                        Query Param
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OAuth 2.0 */}
                    {auth.type === 'oauth2' && (
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: swaggerTheme.textSecondary,
                                marginBottom: '8px'
                            }}>
                                Access Token
                            </label>
                            <textarea
                                value={auth.oauth2?.accessToken || ''}
                                onChange={(e) => updateAuth({
                                    oauth2: { ...auth.oauth2!, accessToken: e.target.value }
                                })}
                                placeholder="Paste your OAuth 2.0 access token"
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px 14px',
                                    background: swaggerTheme.bg,
                                    border: `1px solid ${swaggerTheme.border}`,
                                    borderRadius: '6px',
                                    color: swaggerTheme.text,
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    resize: 'vertical',
                                    outline: 'none',
                                    lineHeight: '1.6'
                                }}
                            />
                        </div>
                    )}

                    {/* Helper Text */}
                    <div style={{
                        marginTop: '16px',
                        padding: '12px 14px',
                        background: swaggerTheme.bg,
                        borderRadius: '6px',
                        fontSize: '13px',
                        color: swaggerTheme.textSecondary,
                        lineHeight: '1.6',
                        borderLeft: `3px solid ${swaggerTheme.primary}`
                    }}>
                        <strong style={{ color: swaggerTheme.text }}>💡 Note: </strong>
                        This authentication will be automatically applied to all requests
                    </div>
                </div>
            )}
        </div>
    )
}

// Helper function to inject auth into request
export function injectAuth(auth: AuthConfig, headers: Record<string, string>, url: string): { headers: Record<string, string>, url: string } {
    const newHeaders = { ...headers }
    let newUrl = url

    switch (auth.type) {
        case 'basic':
            if (auth.basic?.username && auth.basic?.password) {
                const credentials = btoa(`${auth.basic.username}:${auth.basic.password}`)
                newHeaders['Authorization'] = `Basic ${credentials}`
            }
            break

        case 'bearer':
            if (auth.bearer?.token) {
                newHeaders['Authorization'] = `Bearer ${auth.bearer.token}`
            }
            break

        case 'apikey':
            if (auth.apikey?.key && auth.apikey?.value) {
                if (auth.apikey.addTo === 'header') {
                    newHeaders[auth.apikey.key] = auth.apikey.value
                } else {
                    const separator = url.includes('?') ? '&' : '?'
                    newUrl = `${url}${separator}${auth.apikey.key}=${encodeURIComponent(auth.apikey.value)}`
                }
            }
            break

        case 'oauth2':
            if (auth.oauth2?.accessToken) {
                newHeaders['Authorization'] = `Bearer ${auth.oauth2.accessToken}`
            }
            break
    }

    return { headers: newHeaders, url: newUrl }
}

export type { AuthConfig }
