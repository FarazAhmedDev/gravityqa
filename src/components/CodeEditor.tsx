import React, { useState, useEffect } from 'react'
import axios from 'axios'

interface SavedFile {
    name: string
    language: string
    content: string
    path: string
}

export default function CodeEditor() {
    const [files, setFiles] = useState<SavedFile[]>([])
    const [currentFile, setCurrentFile] = useState<SavedFile | null>(null)
    const [code, setCode] = useState('')
    const [language, setLanguage] = useState<'python' | 'javascript'>('python')
    const [isRunning, setIsRunning] = useState(false)
    const [output, setOutput] = useState('')
    const [fileName, setFileName] = useState('test_script.py')

    // Load saved files on mount
    useEffect(() => {
        loadSavedFiles()

        // Check if there's generated code from "Convert to Code"
        const generatedCode = localStorage.getItem('generatedCode')
        const generatedLanguage = localStorage.getItem('generatedLanguage')

        if (generatedCode) {
            setCode(generatedCode)
            setLanguage(generatedLanguage as 'python' | 'javascript' || 'python')
            setFileName(`generated_test.${generatedLanguage === 'python' ? 'py' : 'js'}`)

            // Clear localStorage
            localStorage.removeItem('generatedCode')
            localStorage.removeItem('generatedLanguage')
        }
    }, [])

    const loadSavedFiles = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/code/files')
            setFiles(res.data.files || [])
        } catch (error) {
            console.error('Failed to load files:', error)
        }
    }

    const saveFile = async () => {
        try {
            const res = await axios.post('http://localhost:8000/api/code/save', {
                name: fileName,
                content: code,
                language: language
            })

            alert('✅ File saved successfully!')
            loadSavedFiles()
        } catch (error: any) {
            alert('❌ Save failed: ' + (error.response?.data?.detail || error.message))
        }
    }

    const openFile = async (file: SavedFile) => {
        setCurrentFile(file)
        setCode(file.content)
        setLanguage(file.language as 'python' | 'javascript')
        setFileName(file.name)
    }

    const runCode = async () => {
        setIsRunning(true)
        setOutput('🔄 Executing code on device...\n')

        try {
            const res = await axios.post('http://localhost:8000/api/code/execute', {
                code: code,
                language: language
            })

            setOutput(res.data.output || '✅ Execution completed!')
            setIsRunning(false)
        } catch (error: any) {
            setOutput('❌ Execution failed: ' + (error.response?.data?.detail || error.message))
            setIsRunning(false)
        }
    }

    const createNewFile = () => {
        setCode(`# GravityQA Test Script
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy

def run_test():
    driver = webdriver.Remote(
        'http://localhost:4723',
        {
            'platformName': 'Android',
            'appium:automationName': 'UiAutomator2',
        }
    )
    
    try:
        # Your test code here
        print("✅ Test started")
        
    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
`)
        setFileName('new_test.py')
        setCurrentFile(null)
    }

    return (
        <div style={{
            height: '100vh',
            background: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            color: '#d4d4d4'
        }}>
            {/* Top Bar */}
            <div style={{
                background: '#2d2d30',
                padding: '12px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #3e3e42'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#58a6ff'
                    }}>
                        GravityQA
                    </h1>

                    <select
                        value={language}
                        onChange={(e) => {
                            setLanguage(e.target.value as 'python' | 'javascript')
                            setFileName(e.target.value === 'python' ? 'test_script.py' : 'test_script.js')
                        }}
                        style={{
                            background: '#3c3c3c',
                            color: '#d4d4d4',
                            border: '1px solid #555',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '13px'
                        }}
                    >
                        <option value="python">Python</option>
                        <option value="javascript">JavaScript</option>
                    </select>

                    <input
                        type="text"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        style={{
                            background: '#3c3c3c',
                            color: '#d4d4d4',
                            border: '1px solid #555',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            width: '200px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={saveFile}
                        style={{
                            background: '#238636',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        💾 Save
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        style={{
                            background: isRunning ? '#555' : '#2ea043',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '6px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        {isRunning ? '⏳ Running...' : '▶️ Run Test'}
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        style={{
                            background: '#3c3c3c',
                            color: '#d4d4d4',
                            border: '1px solid #555',
                            padding: '8px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar - File List */}
                <div style={{
                    width: '250px',
                    background: '#252526',
                    borderRight: '1px solid #3e3e42',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #3e3e42',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#888' }}>
                            SAVED FILES
                        </span>
                        <button
                            onClick={createNewFile}
                            style={{
                                background: '#238636',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            + New
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {files.map((file, index) => (
                            <div
                                key={index}
                                onClick={() => openFile(file)}
                                style={{
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    background: currentFile?.name === file.name ? '#37373d' : 'transparent',
                                    borderLeft: currentFile?.name === file.name ? '2px solid #58a6ff' : '2px solid transparent',
                                    color: currentFile?.name === file.name ? '#fff' : '#ccc',
                                    fontSize: '13px'
                                }}
                            >
                                📄 {file.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Code Editor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '8px 16px',
                        background: '#2d2d30',
                        borderBottom: '1px solid #3e3e42',
                        fontSize: '13px',
                        color: '#ccc'
                    }}>
                        {fileName} {currentFile && <span style={{ color: '#888' }}>• {language.toUpperCase()}</span>}
                    </div>

                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        style={{
                            flex: 1,
                            background: '#1e1e1e',
                            color: '#d4d4d4',
                            border: 'none',
                            padding: '16px',
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            resize: 'none',
                            outline: 'none'
                        }}
                        spellCheck={false}
                    />

                    {/* Output Panel */}
                    {output && (
                        <div style={{
                            height: '200px',
                            background: '#1e1e1e',
                            borderTop: '1px solid #3e3e42',
                            padding: '16px',
                            overflow: 'auto',
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '13px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            <div style={{ marginBottom: '8px', color: '#888', fontSize: '12px' }}>
                                OUTPUT:
                            </div>
                            {output}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
