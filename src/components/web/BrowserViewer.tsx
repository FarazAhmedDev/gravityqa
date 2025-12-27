import { useState } from 'react'

interface BrowserViewerProps {
    screenshot: string | null
    inspectorMode: boolean
    isLoading: boolean
    onInteract?: (x: number, y: number, type: 'click' | 'tap') => void
    onSwipe?: (direction: 'up' | 'down') => void
}

export default function BrowserViewer({ screenshot, inspectorMode, isLoading, onInteract, onSwipe }: BrowserViewerProps) {
    const [clickDot, setClickDot] = useState<{ x: number, y: number } | null>(null)

    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590',
        primary: '#f97316'
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Stop default browser actions that might cause scrolling/focus jumping
        e.preventDefault()
        e.stopPropagation()

        // Prevent window scrolling
        window.scrollTo(0, 0)

        if (!onInteract || !screenshot) return

        const rect = e.currentTarget.getBoundingClientRect()
        const containerWidth = rect.width
        const containerHeight = rect.height

        const browserAspect = 1280 / 720
        const containerAspect = containerWidth / containerHeight

        let displayedWidth, displayedHeight
        let offsetX = 0
        let offsetY = 0

        if (containerAspect > browserAspect) {
            displayedHeight = containerHeight
            displayedWidth = containerHeight * browserAspect
            offsetX = (containerWidth - displayedWidth) / 2
        } else {
            displayedWidth = containerWidth
            displayedHeight = containerWidth / browserAspect
            offsetY = (containerHeight - displayedHeight) / 2
        }

        const clickX = e.clientX - rect.left - offsetX
        const clickY = e.clientY - rect.top - offsetY

        if (clickX < 0 || clickX > displayedWidth || clickY < 0 || clickY > displayedHeight) return

        const x = Math.round((clickX / displayedWidth) * 1280)
        const y = Math.round((clickY / displayedHeight) * 720)

        // Visual feedback at mouse position
        setClickDot({ x: e.clientX - rect.left, y: e.clientY - rect.top })
        setTimeout(() => setClickDot(null), 600)

        onInteract(x, y, 'click')
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: colors.bgTertiary,
                cursor: screenshot ? 'crosshair' : 'default',
                overflow: 'hidden',
                userSelect: 'none',
                touchAction: 'none',
                WebkitTouchCallout: 'none',
                scrollBehavior: 'auto',
                overscrollBehavior: 'none',
                WebkitOverflowScrolling: 'auto'
            }}
        >
            {screenshot ? (
                <div
                    onClick={handleClick}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        touchAction: 'none',
                        WebkitOverflowScrolling: 'auto'
                    }}
                >
                    <img
                        src={screenshot}
                        alt="Browser screenshot"
                        draggable={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            pointerEvents: 'none',
                            display: 'block',
                            userSelect: 'none',
                            WebkitUserSelect: 'none'
                        }}
                    />

                    {/* Scroll Overlay Buttons */}
                    <div style={{
                        position: 'absolute',
                        left: 20,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        zIndex: 20
                    }}>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSwipe?.('up');
                            }}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '22px',
                                background: 'rgba(22, 27, 34, 0.9)',
                                color: colors.text,
                                border: `2px solid ${colors.border}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(5px)',
                                fontSize: '20px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            ↑
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSwipe?.('down');
                            }}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '22px',
                                background: 'rgba(22, 27, 34, 0.9)',
                                color: colors.text,
                                border: `2px solid ${colors.border}`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backdropFilter: 'blur(5px)',
                                fontSize: '20px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            ↓
                        </button>
                    </div>

                    {clickDot && (
                        <div style={{
                            position: 'absolute',
                            left: clickDot.x - 15,
                            top: clickDot.y - 15,
                            width: '30px',
                            height: '30px',
                            borderRadius: '15px',
                            background: `radial-gradient(circle, ${colors.primary}, transparent)`,
                            border: `2px solid ${colors.primary}`,
                            pointerEvents: 'none',
                            zIndex: 100,
                            animation: 'clickRipple 0.8s ease-out forwards'
                        }} />
                    )}

                    {inspectorMode && (
                        <div style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            padding: '6px 12px',
                            background: 'rgba(249, 115, 22, 0.9)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'white',
                            zIndex: 10,
                            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
                            animation: 'pulse 2s infinite'
                        }}>
                            🔍 INSPECTOR ACTIVE
                        </div>
                    )}
                </div>
            ) : (
                <div style={{
                    textAlign: 'center',
                    color: colors.textSecondary
                }}>
                    {isLoading ? (
                        <div>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
                            <div style={{ fontSize: '16px', fontWeight: 500 }}>Loading...</div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌐</div>
                            <div style={{ fontSize: '16px', fontWeight: 500 }}>
                                Launch browser and navigate to see content
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes clickRipple {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes pulse {
                    0% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 0.8; transform: scale(1); }
                }
            `}</style>
        </div>
    )
}
