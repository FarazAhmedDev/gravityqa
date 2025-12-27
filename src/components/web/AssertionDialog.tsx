import { useState } from 'react'

interface AssertionDialogProps {
    element: {
        selector: string
        text?: string
        visible?: boolean
    }
    onSave: (assertion: any) => void
    onCancel: () => void
}

export default function AssertionDialog({ element, onSave, onCancel }: AssertionDialogProps) {
    const [assertionType, setAssertionType] = useState<'text' | 'visible' | 'enabled' | 'value'>('visible')
    const [expectedValue, setExpectedValue] = useState(element.text || '')

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        success: '#3fb950',
        blue: '#58a6ff'
    }

    const assertionTypes = [
        {
            value: 'visible' as const,
            label: 'Element Visible',
            icon: '👁️',
            description: 'Assert element is visible on the page',
            needsValue: false
        },
        {
            value: 'text' as const,
            label: 'Text Content',
            icon: '📝',
            description: 'Assert element contains specific text',
            needsValue: true
        },
        {
            value: 'enabled' as const,
            label: 'Element Enabled',
            icon: '✅',
            description: 'Assert element is clickable/enabled',
            needsValue: false
        },
        {
            value: 'value' as const,
            label: 'Input Value',
            icon: '🔤',
            description: 'Assert input has specific value',
            needsValue: true
        }
    ]

    const handleSave = () => {
        const assertion = {
            type: assertionType,
            selector: element.selector,
            expectedValue: assertionTypes.find(t => t.value === assertionType)?.needsValue ? expectedValue : undefined,
            timestamp: new Date().toISOString()
        }
        onSave(assertion)
    }

    const selectedType = assertionTypes.find(t => t.value === assertionType)

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: `linear-gradient(135deg, ${colors.bgSecondary}, ${colors.bgTertiary})`,
                border: `1px solid ${colors.border}`,
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '550px',
                width: '90%',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
                animation: 'scaleIn 0.4s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${colors.success}, #2ea043)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        boxShadow: `0 8px 20px ${colors.success}40`
                    }}>
                        ✓
                    </div>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: 700,
                            color: colors.text
                        }}>
                            Add Assertion
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: colors.textSecondary,
                            fontFamily: 'monospace'
                        }}>
                            {element.selector}
                        </p>
                    </div>
                </div>

                {/* Assertion Type Selector */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: colors.text,
                        marginBottom: '12px'
                    }}>
                        Assertion Type
                    </label>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                    }}>
                        {assertionTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setAssertionType(type.value)}
                                style={{
                                    padding: '16px',
                                    background: assertionType === type.value
                                        ? `linear-gradient(135deg, ${colors.success}20, ${colors.success}10)`
                                        : colors.bgTertiary,
                                    border: `2px solid ${assertionType === type.value ? colors.success : colors.border}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    textAlign: 'left'
                                }}
                                onMouseEnter={(e) => {
                                    if (assertionType !== type.value) {
                                        e.currentTarget.style.borderColor = colors.success + '60'
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (assertionType !== type.value) {
                                        e.currentTarget.style.borderColor = colors.border
                                    }
                                }}
                            >
                                <div style={{
                                    fontSize: '24px',
                                    marginBottom: '8px'
                                }}>
                                    {type.icon}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    color: colors.text,
                                    marginBottom: '4px'
                                }}>
                                    {type.label}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: colors.textSecondary
                                }}>
                                    {type.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Expected Value Input */}
                {selectedType?.needsValue && (
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: colors.text,
                            marginBottom: '8px'
                        }}>
                            Expected Value
                        </label>
                        <input
                            type="text"
                            value={expectedValue}
                            onChange={(e) => setExpectedValue(e.target.value)}
                            placeholder={assertionType === 'text' ? 'Enter expected text' : 'Enter expected value'}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: colors.bg,
                                border: `2px solid ${colors.border}`,
                                borderRadius: '10px',
                                color: colors.text,
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = colors.success
                                e.target.style.boxShadow = `0 0 0 4px ${colors.success}20`
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border
                                e.target.style.boxShadow = 'none'
                            }}
                        />
                    </div>
                )}

                {/* Preview */}
                <div style={{
                    padding: '16px',
                    background: `${colors.success}10`,
                    border: `1px solid ${colors.success}30`,
                    borderRadius: '12px',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: colors.success,
                        marginBottom: '8px'
                    }}>
                        📋 Assertion Preview:
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: colors.text,
                        fontFamily: 'monospace',
                        background: colors.bg,
                        padding: '12px',
                        borderRadius: '8px'
                    }}>
                        {assertionType === 'visible' && `Assert element is visible`}
                        {assertionType === 'text' && `Assert text equals "${expectedValue}"`}
                        {assertionType === 'enabled' && `Assert element is enabled`}
                        {assertionType === 'value' && `Assert value equals "${expectedValue}"`}
                    </div>
                </div>

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: colors.bgTertiary,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '12px',
                            color: colors.text,
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = colors.border
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = colors.bgTertiary
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={selectedType?.needsValue && !expectedValue.trim()}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: (selectedType?.needsValue && !expectedValue.trim())
                                ? colors.bgTertiary
                                : `linear-gradient(135deg, ${colors.success}, #2ea043)`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: (selectedType?.needsValue && !expectedValue.trim()) ? 'not-allowed' : 'pointer',
                            opacity: (selectedType?.needsValue && !expectedValue.trim()) ? 0.5 : 1,
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (!(selectedType?.needsValue && !expectedValue.trim())) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = `0 8px 20px ${colors.success}60`
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>✓</span>
                        Add Assertion
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
