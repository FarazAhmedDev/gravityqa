interface ModeSwitchProps {
    mode: 'record' | 'assert' | 'debug'
    onChange: (mode: 'record' | 'assert' | 'debug') => void
    disabled?: boolean
}

export default function ModeSwitch({ mode, onChange, disabled = false }: ModeSwitchProps) {
    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316',
        success: '#3fb950',
        blue: '#58a6ff',
        warning: '#d29922'
    }

    const modes = [
        { value: 'record' as const, label: 'Record', icon: '⏺', color: colors.primary },
        { value: 'assert' as const, label: 'Assert', icon: '✓', color: colors.success },
        { value: 'debug' as const, label: 'Debug', icon: '🔍', color: colors.warning }
    ]

    return (
        <div style={{
            display: 'flex',
            gap: '4px',
            background: colors.bgTertiary,
            border: `1px solid ${colors.border}`,
            borderRadius: '10px',
            padding: '4px',
            opacity: disabled ? 0.5 : 1,
            pointerEvents: disabled ? 'none' : 'auto'
        }}>
            {modes.map((m) => (
                <button
                    key={m.value}
                    onClick={() => onChange(m.value)}
                    style={{
                        background: mode === m.value
                            ? `linear-gradient(135deg, ${m.color}, ${m.color}dd)`
                            : 'transparent',
                        border: mode === m.value
                            ? `1px solid ${m.color}`
                            : '1px solid transparent',
                        color: mode === m.value ? 'white' : colors.textSecondary,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: mode === m.value ? `0 0 15px ${m.color}40` : 'none'
                    }}
                    onMouseEnter={(e) => {
                        if (mode !== m.value) {
                            e.currentTarget.style.background = `${m.color}15`
                            e.currentTarget.style.color = colors.text
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (mode !== m.value) {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = colors.textSecondary
                        }
                    }}
                >
                    <span style={{
                        fontSize: '14px',
                        opacity: mode === m.value ? 1 : 0.7
                    }}>
                        {m.icon}
                    </span>
                    {m.label}
                </button>
            ))}
        </div>
    )
}
