import { useState } from 'react'

interface SaveTestDialogProps {
    actionsCount: number
    onSave: (testName: string) => void
    onCancel: () => void
}

export default function SaveTestDialog({ actionsCount, onSave, onCancel }: SaveTestDialogProps) {
    const [testName, setTestName] = useState('')

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

    const handleSave = () => {
        if (testName.trim()) {
            onSave(testName.trim())
        }
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
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div style={{
                background: `linear-gradient(135deg, ${colors.bgSecondary}, ${colors.bgTertiary})`,
                border: `1px solid ${colors.border}`,
                borderRadius: '24px',
                padding: '48px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
                animation: 'scaleIn 0.4s ease-out'
            }}>
                {/* Icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '24px',
                        background: `linear-gradient(135deg, ${colors.bgTertiary}, ${colors.bg})`,
                        border: `2px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '64px',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                    }}>
                        💾
                    </div>
                </div>

                {/* Title */}
                <h2 style={{
                    textAlign: 'center',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: colors.text,
                    marginBottom: '12px'
                }}>
                    Save Your Test
                </h2>

                {/* Description */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '15px',
                    color: colors.textSecondary,
                    marginBottom: '32px'
                }}>
                    Give your test a name and save it for later playback
                </p>

                {/* Actions Count Badge */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '32px'
                }}>
                    <div style={{
                        padding: '10px 20px',
                        background: `${colors.blue}20`,
                        border: `2px solid ${colors.blue}40`,
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: colors.blue,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span style={{ fontSize: '18px' }}>📋</span>
                        {actionsCount} actions recorded
                    </div>
                </div>

                {/* Input */}
                <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Enter test name (e.g., login_flow)"
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        background: colors.bg,
                        border: `2px solid ${colors.border}`,
                        borderRadius: '12px',
                        color: colors.text,
                        fontSize: '15px',
                        marginBottom: '24px',
                        outline: 'none',
                        transition: 'all 0.3s',
                        boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                        e.target.style.borderColor = colors.primary
                        e.target.style.boxShadow = `0 0 0 4px ${colors.primary}20`
                    }}
                    onBlur={(e) => {
                        e.target.style.borderColor = colors.border
                        e.target.style.boxShadow = 'none'
                    }}
                />

                {/* Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: colors.bgTertiary,
                            border: `2px solid ${colors.border}`,
                            borderRadius: '12px',
                            color: colors.text,
                            fontSize: '15px',
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
                        disabled={!testName.trim()}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: testName.trim()
                                ? `linear-gradient(135deg, ${colors.success}, #2ea043)`
                                : colors.bgTertiary,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: testName.trim() ? 'pointer' : 'not-allowed',
                            opacity: testName.trim() ? 1 : 0.5,
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            if (testName.trim()) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = `0 8px 20px ${colors.success}60`
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = 'none'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>💾</span>
                        Save Test Flow
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    )
}
