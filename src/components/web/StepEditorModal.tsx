import { useState } from 'react'

interface StepEditorModalProps {
    action: {
        id: number
        type: string
        selector?: string
        data?: any
        timestamp: string
    }
    onSave: (updatedAction: any) => void
    onCancel: () => void
}

export default function StepEditorModal({ action, onSave, onCancel }: StepEditorModalProps) {
    const [stepName, setStepName] = useState(getDefaultName(action))
    const [selector, setSelector] = useState(action.selector || '')
    const [value, setValue] = useState(action.data?.text || action.data?.seconds || '')

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        blue: '#58a6ff',
        success: '#3fb950'
    }

    function getDefaultName(action: any) {
        switch (action.type) {
            case 'click':
                return `Click "${action.selector?.split('>').pop()?.trim() || 'element'}"`
            case 'type':
                return `Type into ${action.selector?.split('>').pop()?.trim() || 'element'}`
            case 'scroll':
                return `Scroll ${action.data?.direction || ''}`
            case 'wait':
                return `Wait ${action.data?.seconds || 0}s`
            default:
                return action.type
        }
    }

    const handleSave = () => {
        const updatedAction = {
            ...action,
            name: stepName,
            selector: selector,
            data: {
                ...action.data,
                text: action.type === 'type' ? value : action.data?.text,
                seconds: action.type === 'wait' ? Number(value) : action.data?.seconds
            }
        }
        onSave(updatedAction)
    }

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
                maxWidth: '600px',
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
                        background: `linear-gradient(135deg, ${colors.blue}, #4090dd)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        boxShadow: `0 8px 20px ${colors.blue}40`
                    }}>
                        ✏️
                    </div>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '22px',
                            fontWeight: 700,
                            color: colors.text
                        }}>
                            Edit Step
                        </h2>
                        <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: colors.textSecondary
                        }}>
                            Step #{action.id} • {action.type.toUpperCase()}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    {/* Step Name */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '13px',
                            fontWeight: 700,
                            color: colors.text,
                            marginBottom: '8px'
                        }}>
                            Step Name
                        </label>
                        <input
                            type="text"
                            value={stepName}
                            onChange={(e) => setStepName(e.target.value)}
                            placeholder="Enter step description"
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
                                e.target.style.borderColor = colors.blue
                                e.target.style.boxShadow = `0 0 0 4px ${colors.blue}20`
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = colors.border
                                e.target.style.boxShadow = 'none'
                            }}
                        />
                    </div>

                    {/* Selector */}
                    {action.selector && (
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: colors.text,
                                marginBottom: '8px'
                            }}>
                                CSS Selector
                            </label>
                            <input
                                type="text"
                                value={selector}
                                onChange={(e) => setSelector(e.target.value)}
                                placeholder="CSS selector"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: colors.bg,
                                    border: `2px solid ${colors.border}`,
                                    borderRadius: '10px',
                                    color: colors.text,
                                    fontSize: '13px',
                                    fontFamily: 'monospace',
                                    outline: 'none',
                                    transition: 'all 0.3s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = colors.blue
                                    e.target.style.boxShadow = `0 0 0 4px ${colors.blue}20`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = colors.border
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                        </div>
                    )}

                    {/* Type/Wait Value */}
                    {(action.type === 'type' || action.type === 'wait') && (
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '13px',
                                fontWeight: 700,
                                color: colors.text,
                                marginBottom: '8px'
                            }}>
                                {action.type === 'type' ? 'Text Value' : 'Wait Duration (seconds)'}
                            </label>
                            <input
                                type={action.type === 'wait' ? 'number' : 'text'}
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder={action.type === 'type' ? 'Enter text' : '3'}
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
                                    e.target.style.borderColor = colors.blue
                                    e.target.style.boxShadow = `0 0 0 4px ${colors.blue}20`
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = colors.border
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                        </div>
                    )}

                    {/* Info Box */}
                    <div style={{
                        padding: '12px 16px',
                        background: `${colors.blue}10`,
                        border: `1px solid ${colors.blue}30`,
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: colors.textSecondary
                    }}>
                        💡 <strong>Tip:</strong> Changes will be applied to this step only. The original recording remains unchanged.
                    </div>
                </div>

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '24px'
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
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: `linear-gradient(135deg, ${colors.success}, #2ea043)`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 8px 20px ${colors.success}60`
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <span style={{ fontSize: '16px' }}>✓</span>
                        Save Changes
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
