import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import axios from 'axios'

export default function CodeEditor() {
    const [code, setCode] = useState(`# GravityQA Test Script
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Setup
caps = {
    "platformName": "Android",
    "deviceName": "emulator-5554",
    "automationName": "UiAutomator2"
}

driver = webdriver.Remote("http://localhost:4723", caps)

try:
    # Your test code here
    element = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((AppiumBy.XPATH, "//android.widget.Button"))
    )
    element.click()
    
    print("✅ Test passed!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    
finally:
    driver.quit()
`)
    const [language, setLanguage] = useState('python')
    const [isRunning, setIsRunning] = useState(false)

    // Load code from Inspector if available
    useEffect(() => {
        const generatedCode = localStorage.getItem('generated_test_code')
        if (generatedCode) {
            setCode(generatedCode)
            localStorage.removeItem('generated_test_code') // Clear after loading
        }
    }, [])

    const runCode = async () => {
        setIsRunning(true)
        try {
            await axios.post('http://localhost:8000/api/tests/run-code', {
                code: code,
                language: language
            })
            alert('✅ Test started! Check console for output')
        } catch (error: any) {
            alert('❌ Failed to run: ' + (error.response?.data?.detail || error.message))
        } finally {
            setIsRunning(false)
        }
    }

    const saveCode = async () => {
        try {
            localStorage.setItem('saved_test_code', code)
            alert('✅ Code saved locally!')
        } catch (error) {
            alert('❌ Failed to save')
        }
    }

    return (
        <div className="content-area" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)' }}>
            {/* Toolbar */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #21262d', background: '#161b22', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select className="btn" value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: '6px 12px' }}>
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                        <option value="java">Java</option>
                    </select>
                    <span style={{ fontSize: '12px', color: '#7d8590', marginLeft: '8px' }}>
                        test_script.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'java'}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" onClick={saveCode}>
                        💾 Save
                    </button>
                    <button className="btn btn-primary" onClick={runCode} disabled={isRunning}>
                        {isRunning ? '⏳ Running...' : '▶️ Run Test'}
                    </button>
                </div>
            </div>

            {/* Editor */}
            <div style={{ flex: 1 }}>
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        lineNumbers: 'on',
                        renderWhitespace: 'selection',
                    }}
                />
            </div>

            {/* Status Bar */}
            <div style={{ padding: '6px 16px', background: '#161b22', borderTop: '1px solid #21262d', fontSize: '12px', color: '#7d8590', display: 'flex', justifyContent: 'space-between' }}>
                <div>Ready to run</div>
                <div>{language.toUpperCase()} • UTF-8</div>
            </div>
        </div>
    )
}
