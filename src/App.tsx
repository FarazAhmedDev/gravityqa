
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
import './index.css'

function App() {
    // Auto-cleanup corrupted data
    useAutoCleanup()

    const [activeTab, setActiveTab] = useState<'devices' | 'inspector' | 'editor' | 'flows' | 'tests' | 'ai' | 'web'>('devices')

    // Listen for code editor open event
    useEffect(() => {
        const handleOpenCodeEditor = () => {
            setActiveTab('editor')
        }

        window.addEventListener('openCodeEditor', handleOpenCodeEditor)
        return () => window.removeEventListener('openCodeEditor', handleOpenCodeEditor)
    }, [])

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="main-content">
                <Header activeTab={activeTab} />
                {activeTab === 'devices' && <DeviceManager />}
                {activeTab === 'inspector' && <Inspector />}
                {activeTab === 'editor' && <CodeEditor />}
                {activeTab === 'flows' && <FlowManager />}
                {activeTab === 'tests' && <TestRunner />}
                {activeTab === 'ai' && <AIConsole />}
                {activeTab === 'web' && <WebAutomation />}
            </div>
        </div>
    )
}

export default App
