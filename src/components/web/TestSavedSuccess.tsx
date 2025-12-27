interface TestSavedSuccessProps {
    testId: string
    testName: string
    actionsCount: number
    onRunTest: () => void
    onConvertToCode: () => void
    onStartNewTest: () => void
}

export default function TestSavedSuccess({
    testId,
    testName,
    actionsCount,
    onRunTest,
    onConvertToCode,
    onStartNewTest
}: TestSavedSuccessProps) {
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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(15px)',
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
                maxWidth: '550px',
                width: '90%',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8)',
                animation: 'scaleIn 0.4s ease-out'
            }}>
                {/* Success Icon */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '24px'
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '24px',
                        background: `linear-gradient(135deg, ${colors.success}, #2ea043)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '64px',
                        boxShadow: `0 20px 50px ${colors.success}40`,
                        animation: 'successPulse 2s ease-in-out infinite'
                    }}>
                        ✓
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
                    Test Saved Successfully!
                </h2>

                {/* Description */}
                <p style={{
                    textAlign: 'center',
                    fontSize: '15px',
                    color: colors.textSecondary,
                    marginBottom: '32px'
                }}>
                    Your test "{testName}" is saved and ready to run
                </p>

                {/* Test Details */}
                <div style={{
                    background: colors.bg,
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '32px',
                    border: `1px solid ${colors.border}`
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Test ID:</span>
                            <span style={{ color: colors.blue, fontSize: '14px', fontWeight: 700 }}>
                                #{testId}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Name:</span>
                            <span style={{ color: colors.text, fontSize: '14px', fontWeight: 600 }}>
                                {testName}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Steps:</span>
                            <span style={{ color: colors.text, fontSize: '14px', fontWeight: 600 }}>
                                {actionsCount}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>Device:</span>
                            <span style={{ color: colors.text, fontSize: '14px', fontWeight: 600 }}>
                                Web Browser
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '16px'
                }}>
                    <button
                        onClick={onRunTest}
                        style={{
                            flex: 1,
                            padding: '18px',
                            background: `linear-gradient(135deg, ${colors.success}, #2ea043)`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 20px ${colors.success}40`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 8px 30px ${colors.success}60`
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.success}40`
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>▶</span>
                        Run Test
                    </button>

                    <button
                        onClick={onConvertToCode}
                        style={{
                            flex: 1,
                            padding: '18px',
                            background: `linear-gradient(135deg, ${colors.blue}, #4090dd)`,
                            border: 'none',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: `0 4px 20px ${colors.blue}40`
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 8px 30px ${colors.blue}60`
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = `0 4px 20px ${colors.blue}40`
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>{'</>'}</span>
                        Convert to Code
                    </button>
                </div>

                {/* Start New Test Button */}
                <button
                    onClick={onStartNewTest}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: colors.bgTertiary,
                        border: `2px solid ${colors.border}`,
                        borderRadius: '12px',
                        color: colors.text,
                        fontSize: '15px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = colors.border
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = colors.bgTertiary
                    }}
                >
                    <span style={{ fontSize: '18px' }}>🆕</span>
                    Start New Test
                </button>
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
                @keyframes successPulse {
                    0%, 100% { box-shadow: 0 20px 50px ${colors.success}40; }
                    50% { box-shadow: 0 20px 60px ${colors.success}60; }
                }
            `}</style>
        </div>
    )
}
