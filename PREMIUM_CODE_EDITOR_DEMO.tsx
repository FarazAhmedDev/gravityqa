import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

// ... (keep all interfaces and templates same) ...
// For brevity, I'll focus on the premium UI parts

export default function CodeEditorPremium() {
    // ... (keep all state same) ...

    const [files, setFiles] = useState([])
    const [code, setCode] = useState('')
    const [language, setLanguage] = useState('python')
    const [isRunning, setIsRunning] = useState(false)
    const [output, setOutput] = useState('')
    const [fileName, setFileName] = useState('test_script.py')
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)
    const [theme, setTheme] = useState('dark')

    // Premium Colors with Gradients
    const premiumColors = {
        bg: 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)',
        bgCard: 'linear-gradient(135deg, #161b22 0%, #1c2128 100%)',
        bgHover: 'linear-gradient(135deg, rgba(88,166,255,0.1) 0%, rgba(167,139,250,0.05) 100%)',
        border: '#30363d',
        text: '#e6edf3',
        textMuted: '#8b949e',
        accent: 'linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%)',
        accentBlue: 'linear-gradient(135deg, #1f6feb 0%, #1158c7 100%)',
        success: 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
        danger: 'linear-gradient(135deg, #f85149 0%, #da3633 100%)',
        glow: '0 0 20px rgba(88,166,255,0.3)',
        shadow: '0 8px 32px rgba(0,0,0,0.4)'
    }

    return (
        <div style={{
            height: '100vh',
            background: premiumColors.bg,
            display: 'flex',
            flexDirection: 'column',
            color: premiumColors.text,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Animated Background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 50%, rgba(88,166,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(167,139,250,0.05) 0%, transparent 50%)',
                animation: 'float 20s ease-in-out infinite',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            {/* Premium Top Bar */}
            <div style={{
                background: premiumColors.bgCard,
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${premiumColors.border}`,
                boxShadow: premiumColors.shadow,
                backdropFilter: 'blur(20px)',
                zIndex: 10,
                position: 'relative'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    {/* Logo with Gradient */}
                    <h1 style={{
                        margin: 0,
                        fontSize: '28px',
                        fontWeight: 800,
                        background: premiumColors.accent,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '32px', animation: 'iconFloat 3s ease-in-out infinite' }}>💻</span>
                        Code Editor
                    </h1>

                    {/* Language Selector - Premium */}
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{
                        background: 'rgba(88,166,255,0.1)',
                        color: premiumColors.text,
                        border: `2px solid rgba(88,166,255,0.3)`,
                        padding: '12px 20px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(88,166,255,0.2)',
                        transition: 'all 0.3s',
                        outline: 'none'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(88,166,255,0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(88,166,255,0.2)'
                        }}>
                        <option value="python">🐍 Python</option>
                        <option value="javascript">📜 JavaScript</option>
                    </select>

                    {/* File Name Input - Premium */}
                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="filename.py"
                        style={{
                            background: 'rgba(30,30,30,0.5)',
                            color: premiumColors.text,
                            border: `1px solid ${premiumColors.border}`,
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            width: '280px',
                            outline: 'none',
                            backdropFilter: 'blur(10px)',
                            transition: 'all 0.3s'
                        }}
                    />
                </div>

                {/* Right Side Buttons */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {/* Save Success Indicator */}
                    {showSaveSuccess && (
                        <div style={{
                            background: premiumColors.success,
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(46,160,67,0.4)',
                            animation: 'slideIn 0.3s ease-out'
                        }}>
                            ✓ Saved Successfully!
                        </div>
                    )}

                    {/* Save Button - Premium */}
                    <button style={{
                        background: premiumColors.accentBlue,
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '15px',
                        boxShadow: '0 4px 16px rgba(31,111,235,0.4)',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(31,111,235,0.6)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(31,111,235,0.4)'
                        }}>
                        <span style={{ fontSize: '18px' }}>💾</span>
                        Save
                    </button>

                    {/* Run Button - Premium */}
                    <button disabled={isRunning} style={{
                        background: isRunning ? '#555' : premiumColors.success,
                        color: 'white',
                        border: 'none',
                        padding: '14px 28px',
                        borderRadius: '12px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '15px',
                        boxShadow: isRunning ? 'none' : '0 4px 16px rgba(46,160,67,0.4)',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                        onMouseEnter={(e) => {
                            if (!isRunning) {
                                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(46,160,67,0.6)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = isRunning ? 'none' : '0 4px 16px rgba(46,160,67,0.4)'
                        }}>
                        <span style={{ fontSize: '18px', animation: isRunning ? 'spin 1s linear infinite' : 'none' }}>
                            {isRunning ? '⏳' : '▶️'}
                        </span>
                        {isRunning ? 'Running...' : 'Run Test'}
                    </button>
                </div>
            </div>

            {/* Add CSS Animations */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(120deg); }
                    66% { transform: translate(-20px, 20px) rotate(240deg); }
                }
                
                @keyframes inconFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    )
}
