import { useState } from 'react'
import { useAutoCleanup } from './hooks/useAutoCleanup'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import DeviceManager from './components/device/DeviceManager'
import Inspector from './components/inspector/AutomationWizard'
import CodeEditor from './components/editor/CodeEditor'
import TestRunner from './components/test-runner/TestRunner'
import FlowManager from './components/flow/FlowManager'
import AIConsole from './components/ai/AIConsole'
import AIAssistant from './components/ai/AIAssistant'
import './index.css'

function App() {
    // Auto-cleanup corrupted data
    useAutoCleanup()

    const [activeTab, setActiveTab] = useState<'devices' | 'inspector' | 'editor' | 'flows' | 'tests' | 'ai'>('devices')

    return (
        <div className="app-container">
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
            <div className="main-content">
                <Header />
                {activeTab === 'devices' && <DeviceManager />}
                {activeTab === 'inspector' && <Inspector />}
                {activeTab === 'editor' && <CodeEditor />}
                {activeTab === 'flows' && <FlowManager />}
                {activeTab === 'tests' && <TestRunner />}
                {activeTab === 'ai' && <AIConsole />}
            </div>
        </div>
    )
}

export default App
