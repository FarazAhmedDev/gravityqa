import { useState, useEffect } from 'react'
import axios from 'axios'

interface ModalState {
    show: boolean
    type: 'success' | 'error'
    title: string
    message: string
}

interface HeaderProps {
    activeTab: string
}

export default function Header({ activeTab }: HeaderProps) {
    const [appiumRunning, setAppiumRunning] = useState(false)
    const [isStarting, setIsStarting] = useState(false)
    const [modal, setModal] = useState<ModalState>({
        show: false,
        type: 'success',
        title: '',
        message: ''
    })

    useEffect(() => {
        checkAppiumStatus()
        const interval = setInterval(checkAppiumStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    const checkAppiumStatus = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/appium/status')
            setAppiumRunning(res.data.status === 'running')
        } catch (error) {
            setAppiumRunning(false)
        }
    }

    const showModal = (type: 'success' | 'error', title: string, message: string) => {
        setModal({ show: true, type, title, message })
    }

    const closeModal = () => {
        setModal({ ...modal, show: false })
    }

    const handleStartAppium = async () => {
        setIsStarting(true)
        try {
            await axios.post('http://localhost:8000/api/appium/start')
            setTimeout(checkAppiumStatus, 2000)
            showModal('success', 'Success', 'Appium started successfully!')
        } catch (error: any) {
            showModal('error', 'Failed to start Appium', error.response?.data?.detail || error.message)
        } finally {
            setIsStarting(false)
        }
    }

    const handleStopAppium = async () => {
        try {
            await axios.post('http://localhost:8000/api/appium/stop')
            checkAppiumStatus()
            showModal('error', 'Appium Stopped', 'Appium server has been stopped')
        } catch (error: any) {
            showModal('error', 'Failed to stop Appium', error.response?.data?.detail || error.message)
        }
    }

    return (
        <>
            <div style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.95), rgba(13, 17, 23, 0.95))',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(48, 54, 61, 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                {/* App Title */}
                <h1 style={{
                    fontSize: '28px',
                    fontWeight: 900,
                    margin: 0,
                    background: 'linear-gradient(135deg, #ffffff 0%, #58a6ff 50%, #a78bfa 100%)',
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-1px',
                    animation: 'gradientFlow 8s ease infinite, textFloat 4s ease-in-out infinite',
                    textShadow: '0 0 40px rgba(88, 166, 255, 0.3)'
                }}>
                    GravityQA
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {/* Appium Status Badge - Hide on Web tab */}
                    {activeTab !== 'web' && (
                        <div style={{
                            padding: '10px 18px',
                            background: appiumRunning
                                ? 'linear-gradient(135deg, rgba(63, 185, 80, 0.15), rgba(46, 160, 67, 0.12))'
                                : 'linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(218, 54, 51, 0.12))',
                            borderRadius: '12px',
                            border: appiumRunning
                                ? '1.5px solid rgba(63, 185, 80, 0.3)'
                                : '1.5px solid rgba(248, 81, 73, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: appiumRunning
                                ? '0 0 20px rgba(63, 185, 80, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                                : '0 0 20px rgba(248, 81, 73, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                        }}>
                            <div style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: appiumRunning
                                    ? 'radial-gradient(circle, #3fb950, #238636)'
                                    : 'radial-gradient(circle, #f85149, #da3633)',
                                boxShadow: appiumRunning
                                    ? '0 0 16px rgba(63, 185, 80, 1), 0 0 30px rgba(63, 185, 80, 0.5)'
                                    : '0 0 16px rgba(248, 81, 73, 1), 0 0 30px rgba(248, 81, 73, 0.5)',
                                animation: appiumRunning ? 'statusPulse 2.5s ease-in-out infinite' : 'none'
                            }}></div>
                            <span style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: appiumRunning ? '#3fb950' : '#f85149',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                Appium
                            </span>
                        </div>
                    )}

                    {/* Control Button - Hide on Web tab */}
                    {activeTab !== 'web' && (appiumRunning ? (
                        <button
                            onClick={handleStopAppium}
                            style={{
                                padding: '10px 18px',
                                height: '44px',
                                fontSize: '14px',
                                fontWeight: 700,
                                position: 'relative',
                                background: 'linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                overflow: 'hidden',
                                boxShadow: `
                                    0 1px 0 0 rgba(255,255,255,0.4) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 6px 20px -4px rgba(239,68,68,0.5),
                                    0 12px 40px -8px rgba(239,68,68,0.3)
                                `,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.5) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 8px 28px -4px rgba(239,68,68,0.6),
                                    0 16px 50px -8px rgba(239,68,68,0.4)
                                `
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = `
                                    0 1px 0 0 rgba(255,255,255,0.4) inset,
                                    0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                    0 6px 20px -4px rgba(239,68,68,0.5),
                                    0 12px 40px -8px rgba(239,68,68,0.3)
                                `
                            }}
                        >
                            {/* iOS Glossy Overlay */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '50%',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                                borderRadius: '12px 12px 0 0',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: '-100%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                animation: 'shimmerGloss 3s infinite',
                                pointerEvents: 'none'
                            }} />

                            <span style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                            }}>
                                {/* SVG Stop Icon - Octagon */}
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}>
                                    <path d="M3.5 0.5H7.5L10.5 3.5V7.5L7.5 10.5H3.5L0.5 7.5V3.5L3.5 0.5Z" fill="white" stroke="white" strokeWidth="0.5" />
                                </svg>
                                Stop
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={handleStartAppium}
                            disabled={isStarting}
                            style={{
                                padding: '10px 18px',
                                fontSize: '14px',
                                fontWeight: 700,
                                position: 'relative',
                                background: isStarting
                                    ? 'linear-gradient(135deg, rgba(48, 54, 61, 0.5), rgba(39, 44, 50, 0.5))'
                                    : 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: isStarting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                overflow: 'hidden',
                                boxShadow: isStarting
                                    ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                    : `
                                        0 1px 0 0 rgba(255,255,255,0.4) inset,
                                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                        0 6px 20px -4px rgba(16,185,129,0.5),
                                        0 12px 40px -8px rgba(16,185,129,0.3)
                                    `,
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={(e) => {
                                if (!isStarting) {
                                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'
                                    e.currentTarget.style.boxShadow = `
                                        0 1px 0 0 rgba(255,255,255,0.5) inset,
                                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                        0 8px 28px -4px rgba(16,185,129,0.6),
                                        0 16px 50px -8px rgba(16,185,129,0.4)
                                    `
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isStarting) {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                    e.currentTarget.style.boxShadow = `
                                        0 1px 0 0 rgba(255,255,255,0.4) inset,
                                        0 -1px 0 0 rgba(0,0,0,0.2) inset,
                                        0 6px 20px -4px rgba(16,185,129,0.5),
                                        0 12px 40px -8px rgba(16,185,129,0.3)
                                    `
                                }
                            }}
                        >
                            {/* iOS Glossy Overlay */}
                            {!isStarting && (
                                <>
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        height: '50%',
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)',
                                        borderRadius: '12px 12px 0 0',
                                        pointerEvents: 'none'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: '-100%',
                                        width: '100%',
                                        height: '100%',
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                        animation: 'shimmerGloss 3s infinite',
                                        pointerEvents: 'none'
                                    }} />
                                </>
                            )}

                            <span style={{
                                position: 'relative',
                                zIndex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                            }}>
                                {isStarting ? (
                                    <>
                                        <span style={{ animation: 'spin 1s linear infinite', fontSize: '11px' }}>⏳</span>
                                        Starting
                                    </>
                                ) : (
                                    <>
                                        {/* SVG Play Icon - Circle with triangle */}
                                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))' }}>
                                            <circle cx="5.5" cy="5.5" r="5" fill="white" fillOpacity="0.95" />
                                            <path d="M4.5 3.5L7.5 5.5L4.5 7.5V3.5Z" fill="#10b981" />
                                        </svg>
                                        Start
                                    </>
                                )}
                            </span>
                        </button>
                    ))}
                </div>

                {/* CSS Animations */}
                <style>{`
                    @keyframes gradientFlow {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    @keyframes textFloat {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-3px); }
                    }
                    @keyframes statusPulse {
                        0%, 100% { 
                            opacity: 1; 
                            transform: scale(1);
                            box-shadow: 0 0 16px rgba(63, 185, 80, 1), 0 0 30px rgba(63, 185, 80, 0.5);
                        }
                        50% { 
                            opacity: 0.7; 
                            transform: scale(0.9);
                            box-shadow: 0 0 10px rgba(63, 185, 80, 0.8), 0 0 20px rgba(63, 185, 80, 0.3);
                        }
                    }
                    @keyframes buttonPulse {
                        0%, 100% {
                            box-shadow: 0 0 30px rgba(88, 166, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
                        }
                        50% {
                            box-shadow: 0 0 45px rgba(88, 166, 255, 0.6), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25);
                        }
                    }
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes shimmerGloss {
                        0% { left: -100%; }
                        50%, 100% { left: 200%; }
                    }
                `}</style>
            </div>

            {/* Premium Modal Dialog */}
            {modal.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        width: '90%',
                        maxWidth: '500px',
                        background: 'linear-gradient(135deg, rgba(22, 27, 34, 0.98), rgba(13, 17, 23, 0.98))',
                        backdropFilter: 'blur(30px)',
                        borderRadius: '24px',
                        border: modal.type === 'error'
                            ? '2px solid rgba(248, 81, 73, 0.5)'
                            : '2px solid rgba(63, 185, 80, 0.5)',
                        boxShadow: modal.type === 'error'
                            ? '0 0 60px rgba(248, 81, 73, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                            : '0 0 60px rgba(63, 185, 80, 0.4), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                        padding: '40px',
                        textAlign: 'center',
                        animation: 'modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}>
                        {/* Icon */}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            background: modal.type === 'error'
                                ? 'linear-gradient(135deg, rgba(248, 81, 73, 0.2), rgba(218, 54, 51, 0.15))'
                                : 'linear-gradient(135deg, rgba(63, 185, 80, 0.2), rgba(46, 160, 67, 0.15))',
                            borderRadius: '50%',
                            border: modal.type === 'error'
                                ? '2px solid rgba(248, 81, 73, 0.4)'
                                : '2px solid rgba(63, 185, 80, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '40px',
                            boxShadow: modal.type === 'error'
                                ? '0 0 40px rgba(248, 81, 73, 0.3)'
                                : '0 0 40px rgba(63, 185, 80, 0.3)',
                            animation: 'iconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
                        }}>
                            {modal.type === 'error' ? '❌' : '✅'}
                        </div>

                        {/* Title */}
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: 800,
                            marginBottom: '16px',
                            background: modal.type === 'error'
                                ? 'linear-gradient(135deg, #f85149, #da3633)'
                                : 'linear-gradient(135deg, #3fb950, #238636)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px'
                        }}>
                            {modal.title}
                        </h2>

                        {/* Message */}
                        <p style={{
                            fontSize: '15px',
                            color: '#c9d1d9',
                            lineHeight: '1.6',
                            marginBottom: '32px',
                            fontWeight: 500
                        }}>
                            {modal.message}
                        </p>

                        {/* OK Button */}
                        <button
                            onClick={closeModal}
                            style={{
                                padding: '14px 40px',
                                fontSize: '16px',
                                fontWeight: 700,
                                background: modal.type === 'error'
                                    ? 'linear-gradient(135deg, #f85149 0%, #da3633 50%, #f85149 100%)'
                                    : 'linear-gradient(135deg, #3fb950 0%, #238636 50%, #3fb950 100%)',
                                backgroundSize: '200% 100%',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: modal.type === 'error'
                                    ? '0 0 30px rgba(248, 81, 73, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : '0 0 30px rgba(63, 185, 80, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                width: '100%'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                                e.currentTarget.style.boxShadow = modal.type === 'error'
                                    ? '0 0 40px rgba(248, 81, 73, 0.7), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                    : '0 0 40px rgba(63, 185, 80, 0.7), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                e.currentTarget.style.backgroundPosition = '100% 0'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = modal.type === 'error'
                                    ? '0 0 30px rgba(248, 81, 73, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                    : '0 0 30px rgba(63, 185, 80, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.backgroundPosition = '0% 0'
                            }}
                        >
                            OK
                        </button>
                    </div>

                    {/* Modal Animations */}
                    <style>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes modalSlideIn {
                            from { 
                                opacity: 0;
                                transform: translateY(-30px) scale(0.9);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }
                        @keyframes iconBounce {
                            0% { transform: scale(0); }
                            50% { transform: scale(1.1); }
                            100% { transform: scale(1); }
                        }
                    `}</style>
                </div>
            )}
        </>
    )
}
