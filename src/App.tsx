
import { useState, useEffect } from 'react'
import { useAutoCleanup } from './hooks/useAutoCleanup'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import DeviceManager from './components/device/DeviceManager'
import Inspector from './components/inspector/AutomationWizard'
import CodeEditor from './components/CodeEditor'
import TestRunner from './components/test-runner/TestRunner'
import FlowManager from './components/flow/FlowManager'
import AIConsole from './components/ai/AIConsole'
import WebAutomation from './components/web/WebAutomation'
import ApiTesting from './components/api/ApiTesting'
import TestManagement from './components/test-management/TestManagement'
import './index.css'

function App() {
    useAutoCleanup()

    const [activeTab, setActiveTab] = useState<'devices' | 'inspector' | 'editor' | 'flows' | 'tests' | 'testmgmt' | 'ai' | 'web' | 'api'>('devices')
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Track mouse for parallax background
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    useEffect(() => {
        const handleOpenCodeEditor = () => {
            setActiveTab('editor')
        }

        window.addEventListener('openCodeEditor', handleOpenCodeEditor)
        return () => window.removeEventListener('openCodeEditor', handleOpenCodeEditor)
    }, [])

    return (
        <div className="app-container">
            {/* Animated Mesh Gradient Background - Device Hub Style */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `
                    radial-gradient(circle at ${20 + mousePos.x * 0.02}% ${30 + mousePos.y * 0.02}%, rgba(139, 92, 246, 0.12) 0%, transparent 50%),
                    radial-gradient(circle at ${80 - mousePos.x * 0.01}% ${70 - mousePos.y * 0.01}%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
                    linear-gradient(135deg, var(--bg-primary) 0%, #0d1117 50%, var(--bg-primary) 100%)
                `,
                pointerEvents: 'none',
                transition: 'background 0.3s ease',
                animation: 'gradientShift 15s ease infinite',
                zIndex: 0
            }}></div>

            {/* Floating Particles - Device Hub Style */}
            {[...Array(15)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'fixed',
                        width: `${4 + Math.random() * 6}px`,
                        height: `${4 + Math.random() * 6}px`,
                        background: `radial-gradient(circle, ${i % 2 === 0 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(6, 182, 212, 0.3)'}, transparent)`,
                        borderRadius: '50%',
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float${i % 3} ${15 + Math.random() * 10}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 5}s`,
                        pointerEvents: 'none',
                        filter: 'blur(1px)',
                        zIndex: 0
                    }}
                />
            ))}

            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="main-content">
                <Header activeTab={activeTab} />
                {activeTab === 'devices' && <DeviceManager />}
                {activeTab === 'inspector' && <Inspector />}
                {activeTab === 'editor' && <CodeEditor />}
                {activeTab === 'flows' && <FlowManager />}
                {activeTab === 'tests' && <TestRunner />}
                {activeTab === 'testmgmt' && <TestManagement />}
                {activeTab === 'ai' && <AIConsole />}
                {activeTab === 'web' && <WebAutomation />}
                {activeTab === 'api' && <ApiTesting />}
            </div>
        </div>
    )
}

export default App
