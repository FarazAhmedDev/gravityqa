import { swaggerTheme } from './swagger/swaggerTheme'
import MethodBadge from './swagger/MethodBadge'

interface ApiTest {
    id: string
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    url: string
    headers: Record<string, string>
    queryParams: Record<string, string>
    body: string
    validations: any[]
}

interface Props {
    tests: ApiTest[]
    onLoad: (test: ApiTest) => void
    onDelete: (id: string) => void
}

export default function SavedTests({ tests, onLoad, onDelete }: Props) {

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                borderBottom: `1px solid ${swaggerTheme.border}`
            }}>
                <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: swaggerTheme.text,
                    letterSpacing: '0.3px'
                }}>
                    💾 Saved Tests
                </div>
                <div style={{
                    fontSize: '13px',
                    color: swaggerTheme.textSecondary,
                    marginTop: '4px'
                }}>
                    {tests.length} test{tests.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Tests List */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: '12px'
            }}>
                {tests.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: swaggerTheme.textSecondary
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: '12px',
                            opacity: 0.3
                        }}>
                            📭
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            No saved tests yet
                        </div>
                        <div style={{
                            fontSize: '12px',
                            marginTop: '8px',
                            opacity: 0.7
                        }}>
                            Create and save your first API test
                        </div>
                    </div>
                ) : (
                    tests.map((test) => (
                        <div
                            key={test.id}
                            style={{
                                marginBottom: '12px',
                                padding: '14px',
                                background: swaggerTheme.bgTertiary,
                                border: `1px solid ${swaggerTheme.border}`,
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => onLoad(test)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = swaggerTheme.primary
                                e.currentTarget.style.background = swaggerTheme.bgTertiary + 'dd'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = swaggerTheme.border
                                e.currentTarget.style.background = swaggerTheme.bgTertiary
                            }}
                        >
                            {/* Method Badge */}
                            <div style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                background: methodColors[test.method] + '20',
                                border: `1px solid ${methodColors[test.method]}`,
                                borderRadius: '6px',
                                color: methodColors[test.method],
                                fontSize: '11px',
                                fontWeight: '800',
                                marginBottom: '10px',
                                letterSpacing: '0.5px'
                            }}>
                                {test.method}
                            </div>

                            {/* Test Name */}
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: swaggerTheme.text,
                                marginBottom: '6px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {test.name}
                            </div>

                            {/* URL */}
                            <div style={{
                                fontSize: '12px',
                                color: swaggerTheme.textSecondary,
                                fontFamily: 'monospace',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginBottom: '10px'
                            }}>
                                {test.url}
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm('Delete this test?')) {
                                        onDelete(test.id)
                                    }
                                }}
                                style={{
                                    padding: '6px 12px',
                                    background: 'transparent',
                                    border: `1px solid ${swaggerTheme.border}`,
                                    borderRadius: '6px',
                                    color: swaggerTheme.error,
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = swaggerTheme.error + '20'
                                    e.currentTarget.style.borderColor = swaggerTheme.error
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.borderColor = swaggerTheme.border
                                }}
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
