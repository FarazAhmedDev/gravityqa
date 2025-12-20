import { useState, useEffect } from 'react'
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
    const [showSaveSuccess, setShowSaveSuccess] = useState(false)
    const [lineCount, setLineCount] = useState(1)
    const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })

    useEffect(() => {
        loadSavedFiles()

        const generatedCode = localStorage.getItem('generatedCode')
        const generatedLanguage = localStorage.getItem('generatedLanguage')

        if (generatedCode) {
            setCode(generatedCode)
            setLanguage(generatedLanguage as 'python' | 'javascript' || 'python')
            setFileName(`generated_test.${generatedLanguage === 'python' ? 'py' : 'js'}`)
            localStorage.removeItem('generatedCode')
            localStorage.removeItem('generatedLanguage')
        }
    }, [])

    useEffect(() => {
        setLineCount(code.split('\n').length)
    }, [code])

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
            await axios.post('http://localhost:8000/api/code/save', {
                name: fileName,
                content: code,
                language: language
            })

            setShowSaveSuccess(true)
            setTimeout(() => setShowSaveSuccess(false), 2000)
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
        setOutput('🚀 Executing code on device...\n\n')

        try {
            const res = await axios.post('http://localhost:8000/api/code/execute', {
                code: code,
                language: language
            })

            setOutput(prev => prev + (res.data.output || '✅ Execution completed!'))
            setIsRunning(false)
        } catch (error: any) {
            setOutput(prev => prev + '\n\n❌ Execution failed: ' + (error.response?.data?.detail || error.message))
            setIsRunning(false)
        }
    }

    const createNewFile = () => {
        const template = language === 'python' ? `# GravityQA Test Script
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy

def run_test():
    """
    Main test function
    """
    driver = webdriver.Remote(
        'http://localhost:4723',
        {
            'platformName': 'Android',
            'appium:automationName': 'UiAutomator2',
        }
    )
    
    try:
        print("✅ Test started")
        
        # Your test code here
        
        print("✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
    finally:
        driver.quit()

if __name__ == '__main__':
    run_test()
` : `// GravityQA Test Script
const { remote } = require('webdriverio');

async function runTest() {
    const driver = await remote({
        hostname: 'localhost',
        port: 4723,
        capabilities: {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
        }
    });
    
    try {
        console.log('✅ Test started');
        
        // Your test code here
        
        console.log('✅ Test completed!');
    } finally {
        await driver.deleteSession();
    }
}

runTest();
`
        setCode(template)
        setFileName(`new_test.${language === 'python' ? 'py' : 'js'}`)
        setCurrentFile(null)
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCode(e.target.value)

        // Calculate cursor position
        const textarea = e.target
        const text = textarea.value.substring(0, textarea.selectionStart)
        const lines = text.split('\n')
        setCursorPosition({
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        })
    }

    const getFileIcon = (filename: string) => {
        if (filename.endsWith('.py')) return '🐍'
        if (filename.endsWith('.js')) return '📜'
        return '📄'
    }

    return (
        <div style={{
            height: '100vh',
            background: '#1e1e1e',
            display: 'flex',
            flexDirection: 'column',
            color: '#d4d4d4',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Top Bar */}
            <div style={{
                background: 'linear-gradient(135deg, #2d2d30 0%, #252527 100%)',
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #3e3e42',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '24px'
                }}>
                    <h1 style={{
                        margin: 0,
                        fontSize: '26px',
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #58a6ff 0%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.5px'
                    }}>
                        Code Editor
                    </h1>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={language}
                            onChange={(e) => {
                                const newLang = e.target.value as 'python' | 'javascript'
                                setLanguage(newLang)
                                setFileName(newLang === 'python' ? 'test_script.py' : 'test_script.js')
                            }}
                            style={{
                                background: '#3c3c3c',
                                color: '#ffffff',
                                border: '1px solid #555',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#454545'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#3c3c3c'}
                        >
                            <option value="python">🐍 Python</option>
                            <option value="javascript">📜 JavaScript</option>
                        </select>

                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            style={{
                                background: '#3c3c3c',
                                color: '#ffffff',
                                border: '1px solid #555',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                width: '220px',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#58a6ff'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#555'}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {showSaveSuccess && (
                        <span style={{
                            color: '#3fb950',
                            fontSize: '14px',
                            fontWeight: 600,
                            animation: 'fadeIn 0.3s ease-out'
                        }}>
                            ✓ Saved!
                        </span>
                    )}

                    <button
                        onClick={saveFile}
                        title="Save File (Cmd+S)"
                        style={{
                            background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            boxShadow: '0 4px 12px rgba(35, 134, 54, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 134, 54, 0.4)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 134, 54, 0.3)'
                        }}
                    >
                        💾 Save
                    </button>

                    <button
                        onClick={runCode}
                        disabled={isRunning}
                        title="Run Test (Cmd+R)"
                        style={{
                            background: isRunning
                                ? '#555'
                                : 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            cursor: isRunning ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            boxShadow: isRunning ? 'none' : '0 4px 12px rgba(46, 160, 67, 0.3)',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!isRunning) {
                                e.currentTarget.style.transform = 'translateY(-2px)'
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 160, 67, 0.4)'
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = isRunning ? 'none' : '0 4px 12px rgba(46, 160, 67, 0.3)'
                        }}
                    >
                        {isRunning ? '⏳ Running...' : '▶️ Run Test'}
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        title="Back to Inspector"
                        style={{
                            background: '#3c3c3c',
                            color: '#d4d4d4',
                            border: '1px solid #555',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#454545'
                            e.currentTarget.style.borderColor = '#666'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#3c3c3c'
                            e.currentTarget.style.borderColor = '#555'
                        }}
                    >
                        ← Back
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar - File Explorer */}
                <div style={{
                    width: '280px',
                    background: '#252526',
                    borderRight: '1px solid #3e3e42',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #3e3e42',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#2d2d30'
                    }}>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: '#888',
                            letterSpacing: '0.5px'
                        }}>
                            📁 SAVED FILES
                        </span>
                        <button
                            onClick={createNewFile}
                            title="New File"
                            style={{
                                background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(35, 134, 54, 0.3)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            + New
                        </button>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {files.length === 0 ? (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '13px'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📝</div>
                                <div>No saved files yet</div>
                                <div style={{ fontSize: '11px', marginTop: '8px' }}>
                                    Click "+ New" to create
                                </div>
                            </div>
                        ) : (
                            files.map((file, index) => (
                                <div
                                    key={index}
                                    onClick={() => openFile(file)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        background: currentFile?.name === file.name ? 'rgba(58, 166, 255, 0.15)' : 'transparent',
                                        borderLeft: currentFile?.name === file.name ? '3px solid #58a6ff' : '3px solid transparent',
                                        color: currentFile?.name === file.name ? '#fff' : '#ccc',
                                        fontSize: '13px',
                                        transition: 'all 0.15s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (currentFile?.name !== file.name) {
                                            e.currentTarget.style.background = '#2a2d2e'
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (currentFile?.name !== file.name) {
                                            e.currentTarget.style.background = 'transparent'
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>{getFileIcon(file.name)}</span>
                                    <span style={{ flex: 1 }}>{file.name}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Code Editor Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Editor Tab */}
                    <div style={{
                        padding: '10px 20px',
                        background: '#2d2d30',
                        borderBottom: '1px solid #3e3e42',
                        fontSize: '13px',
                        color: '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '16px' }}>{getFileIcon(fileName)}</span>
                        <span style={{ fontWeight: 600 }}>{fileName}</span>
                        {currentFile && <span style={{ color: '#666' }}>• {language.toUpperCase()}</span>}
                        <div style={{ flex: 1 }} />
                        <span style={{ fontSize: '11px', color: '#666' }}>
                            Line {cursorPosition.line}, Col {cursorPosition.column}
                        </span>
                    </div>

                    {/* Code Editor */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {/* Line Numbers */}
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '60px',
                            background: '#1e1e1e',
                            borderRight: '1px solid #3e3e42',
                            padding: '16px 8px',
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#858585',
                            textAlign: 'right',
                            userSelect: 'none',
                            overflow: 'hidden'
                        }}>
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} style={{
                                    color: i + 1 === cursorPosition.line ? '#c9d1d9' : '#858585',
                                    fontWeight: i + 1 === cursorPosition.line ? 600 : 400
                                }}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        {/* Code Textarea */}
                        <textarea
                            value={code}
                            onChange={handleTextChange}
                            spellCheck={false}
                            style={{
                                position: 'absolute',
                                left: '60px',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                background: '#1e1e1e',
                                color: '#d4d4d4',
                                border: 'none',
                                padding: '16px 20px',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                resize: 'none',
                                outline: 'none',
                                overflow: 'auto'
                            }}
                            placeholder="// Start writing your test code here..."
                        />
                    </div>

                    {/* Output Panel */}
                    {output && (
                        <div style={{
                            height: '240px',
                            background: '#1e1e1e',
                            borderTop: '2px solid #3e3e42',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                padding: '10px 20px',
                                background: '#2d2d30',
                                borderBottom: '1px solid #3e3e42',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#888',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span>📟 OUTPUT</span>
                                <button
                                    onClick={() => setOutput('')}
                                    style={{
                                        background: 'transparent',
                                        color: '#888',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '4px 8px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                                    onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                                >
                                    Clear
                                </button>
                            </div>
                            <div style={{
                                flex: 1,
                                padding: '16px 20px',
                                overflow: 'auto',
                                fontFamily: 'Monaco, Consolas, monospace',
                                fontSize: '13px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: '1.6'
                            }}>
                                {output}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Status Bar */}
            <div style={{
                background: '#007acc',
                padding: '6px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: 'white',
                fontWeight: 600
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>⚡ Ready</span>
                    <span>🐍 {language === 'python' ? 'Python 3.11' : 'Node.js'}</span>
                    <span>📝 {code.split('\n').length} lines</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
                    <span>UTF-8</span>
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
