interface SidebarProps {
    activeTab: string
    onTabChange: (tab: 'devices' | 'inspector' | 'editor' | 'flows' | 'tests' | 'testmgmt' | 'ai' | 'web' | 'api') => void
}

const tabs = [
    { id: 'devices', name: 'Devices', icon: '📱', color: '#58a6ff' },
    { id: 'inspector', name: 'Inspector', icon: '🔍', color: '#ff7518' },
    { id: 'editor', name: 'Editor', icon: '💻', color: '#e6edf3' },
    { id: 'flows', name: 'Flows', icon: '🎬', color: '#3fb950' },
    { id: 'tests', name: 'Tests', icon: '▶️', color: '#a78bfa' },
    { id: 'testmgmt', name: 'Test Management', icon: '📋', color: '#8b5cf6' },
    { id: 'ai', name: 'AI', icon: '✨', color: '#56d4dd' },
    { id: 'web', name: 'Web', icon: '🌐', color: '#f97316' },
    { id: 'api', name: 'API', icon: '🔌', color: '#06b6d4' },
]

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <div style={{
            width: '72px',
            background: 'linear-gradient(180deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.95))',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(48, 54, 61, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0',
            gap: '12px',
            boxShadow: '4px 0 20px rgba(0, 0, 0, 0.3), inset -1px 0 0 rgba(255, 255, 255, 0.05)',
            height: '100vh',
            position: 'sticky',
            top: 0,
            zIndex: 99
        }}>
            {tabs.map((tab, index) => {
                const isActive = activeTab === tab.id
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id as any)}
                        title={tab.name}
                        style={{
                            position: 'relative',
                            width: '52px',
                            height: '52px',
                            background: isActive
                                ? `linear-gradient(135deg, ${tab.color}20, ${tab.color}15)`
                                : 'transparent',
                            border: isActive
                                ? `1.5px solid ${tab.color}40`
                                : '1.5px solid transparent',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: '24px',
                            boxShadow: isActive
                                ? `0 0 30px ${tab.color}30, 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                                : '0 2px 8px rgba(0, 0, 0, 0.2)',
                            animation: `fadeIn 0.6s ease-out ${index * 0.1}s backwards`,
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = `linear-gradient(135deg, ${tab.color}15, ${tab.color}10)`
                                e.currentTarget.style.borderColor = `${tab.color}30`
                            }
                            e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)'
                            e.currentTarget.style.boxShadow = `0 0 40px ${tab.color}40, 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
                        }}
                        onMouseLeave={(e) => {
                            if (!isActive) {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.borderColor = 'transparent'
                            }
                            e.currentTarget.style.transform = 'scale(1) translateY(0)'
                            e.currentTarget.style.boxShadow = isActive
                                ? `0 0 30px ${tab.color}30, 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
                                : '0 2px 8px rgba(0, 0, 0, 0.2)'
                        }}
                    >
                        {/* Shimmer effect on active */}
                        {isActive && (
                            <>
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: '-100%',
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                                    animation: 'shimmer 3s infinite'
                                }}></div>
                                <div style={{
                                    position: 'absolute',
                                    top: '-50%',
                                    left: '-50%',
                                    width: '200%',
                                    height: '200%',
                                    background: `conic-gradient(from 0deg, transparent, ${tab.color}15, transparent)`,
                                    animation: 'rotate 6s linear infinite'
                                }}></div>
                            </>
                        )}

                        <span style={{
                            position: 'relative',
                            zIndex: 1,
                            filter: isActive
                                ? `drop-shadow(0 0 8px ${tab.color}80)`
                                : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                            animation: isActive ? 'iconGlow 3s ease-in-out infinite' : 'none'
                        }}>
                            {tab.icon}
                        </span>

                        {/* Active indicator bar */}
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                left: '-1.5px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '3px',
                                height: '30px',
                                background: `linear-gradient(180deg, ${tab.color}, ${tab.color}80)`,
                                borderRadius: '0 2px 2px 0',
                                boxShadow: `0 0 12px ${tab.color}`
                            }}></div>
                        )}
                    </button>
                )
            })}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes iconGlow {
                    0%, 100% { filter: drop-shadow(0 0 8px ${tabs.find(t => t.id === activeTab)?.color}80); }
                    50% { filter: drop-shadow(0 0 14px ${tabs.find(t => t.id === activeTab)?.color}); }
                }
            `}</style>
        </div>
    )
}
