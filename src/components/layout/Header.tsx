import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Header() {
    const [appiumRunning, setAppiumRunning] = useState(false)
    const [isStarting, setIsStarting] = useState(false)

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

    const handleStartAppium = async () => {
        setIsStarting(true)
        try {
            await axios.post('http://localhost:8000/api/appium/start')
            setTimeout(checkAppiumStatus, 2000)
            alert('✅ Appium started!')
        } catch (error: any) {
            alert('❌ Failed to start Appium: ' + (error.response?.data?.detail || error.message))
        } finally {
            setIsStarting(false)
        }
    }

    const handleStopAppium = async () => {
        try {
            await axios.post('http://localhost:8000/api/appium/stop')
            checkAppiumStatus()
            alert('✅ Appium stopped')
        } catch (error: any) {
            alert('❌ Failed to stop Appium: ' + (error.response?.data?.detail || error.message))
        }
    }

    return (
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
                {/* Appium Status Badge */}
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

                {/* Control Button */}
                {appiumRunning ? (
                    <button
                        onClick={handleStopAppium}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #f85149 0%, #da3633 50%, #f85149 100%)',
                            backgroundSize: '200% 100%',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: '0 0 30px rgba(248, 81, 73, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 0 40px rgba(248, 81, 73, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                            e.currentTarget.style.backgroundPosition = '100% 0'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 0 30px rgba(248, 81, 73, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                            e.currentTarget.style.backgroundPosition = '0% 0'
                        }}
                    >
                        ⏹️ Stop Appium
                    </button>
                ) : (
                    <button
                        onClick={handleStartAppium}
                        disabled={isStarting}
                        style={{
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: 700,
                            background: isStarting
                                ? 'rgba(48, 54, 61, 0.5)'
                                : 'linear-gradient(135deg, #58a6ff 0%, #1f6feb 50%, #58a6ff 100%)',
                            backgroundSize: '200% 100%',
                            color: isStarting ? '#6e7681' : 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: isStarting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s',
                            boxShadow: isStarting
                                ? 'none'
                                : '0 0 30px rgba(88, 166, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                            animation: isStarting ? 'none' : 'buttonPulse 2.5s ease-in-out infinite'
                        }}
                        onMouseEnter={(e) => {
                            if (!isStarting) {
                                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 0 40px rgba(88, 166, 255, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
                                e.currentTarget.style.backgroundPosition = '100% 0'
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isStarting) {
                                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                                e.currentTarget.style.boxShadow = '0 0 30px rgba(88, 166, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                e.currentTarget.style.backgroundPosition = '0% 0'
                            }
                        }}
                    >
                        {isStarting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                                Starting...
                            </span>
                        ) : (
                            '▶️ Start Appium'
                        )}
                    </button>
                )}
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
            `}</style>
        </div>
    )
}
