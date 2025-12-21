interface BrowserViewerProps {
    screenshot: string | null
    inspectorMode: boolean
    isLoading: boolean
}

export default function BrowserViewer({ screenshot, inspectorMode, isLoading }: BrowserViewerProps) {
    const colors = {
        bg: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        border: '#30363d',
        text: '#e6edf3',
        textSecondary: '#7d8590'
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            background: colors.bgTertiary
        }}>
            {screenshot ? (
                <>
                    <img
                        src={`data:image/png;base64,${screenshot}`}
                        alt="Browser screenshot"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                        }}
                    />
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
                            color: 'white'
                        }}>
                            🔍 INSPECTOR ACTIVE
                        </div>
                    )}
                </>
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
        </div>
    )
}
