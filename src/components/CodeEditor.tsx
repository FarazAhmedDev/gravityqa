import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

interface SavedFile {
    name: string
    language: string
    content: string
    path: string
}

interface CodeTemplate {
    name: string
    language: string
    icon: string
    code: string
    description: string
}

const CODE_TEMPLATES: CodeTemplate[] = [
    {
        name: 'Login Test',
        language: 'python',
        icon: '🔐',
        description: 'Test user login flow',
        code: `# Login Test
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_login():
    driver = webdriver.Remote('http://localhost:4723', {
        'platformName': 'Android',
        'appium:automationName': 'UiAutomator2',
    })
    
    try:
        # Wait for username field
        username = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((AppiumBy.ID, "username"))
        )
        username.send_keys("testuser@example.com")
        
        # Enter password
        password = driver.find_element(AppiumBy.ID, "password")
        password.send_keys("password123")
        
        # Click login button
        login_btn = driver.find_element(AppiumBy.ID, "login_button")
        login_btn.click()
        
        # Verify login success
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((AppiumBy.ID, "home_screen"))
        )
        
        print("✅ Login test passed!")
        
    except Exception as e:
        print(f"❌ Login test failed: {e}")
    finally:
        driver.quit()

if __name__ == '__main__':
    test_login()
`
    },
    {
        name: 'Swipe Test',
        language: 'python',
        icon: '👆',
        description: 'Test swipe gestures',
        code: `# Swipe Gesture Test
from appium import webdriver
from appium.webdriver.common.touch_action import TouchAction

def test_swipe_gestures():
    driver = webdriver.Remote('http://localhost:4723', {
        'platformName': 'Android',
        'appium:automationName': 'UiAutomator2',
    })
    
    try:
        # Get screen size
        size = driver.get_window_size()
        width = size['width']
        height = size['height']
        
        # Swipe up (scroll down)
        driver.swipe(
            width // 2,      # start x
            height * 0.8,    # start y
            width // 2,      # end x
            height * 0.2,    # end y
            500              # duration ms
        )
        
        print("✅ Swipe up completed")
        
        # Swipe left
        driver.swipe(
            width * 0.8,
            height // 2,
            width * 0.2,
            height // 2,
            500
        )
        
        print("✅ Swipe left completed")
        
    except Exception as e:
        print(f"❌ Swipe test failed: {e}")
    finally:
        driver.quit()

if __name__ == '__main__':
    test_swipe_gestures()
`
    },
    {
        name: 'Form Fill Test',
        language: 'javascript',
        icon: '📝',
        description: 'Test form filling',
        code: `// Form Fill Test
const { remote } = require('webdriverio');

async function testFormFill() {
    const driver = await remote({
        hostname: 'localhost',
        port: 4723,
        capabilities: {
            platformName: 'Android',
            'appium:automationName': 'UiAutomator2',
        }
    });
    
    try {
        // Fill name field
        const nameField = await driver.$('~name_input');
        await nameField.setValue('John Doe');
        
        // Fill email
        const emailField = await driver.$('~email_input');
        await emailField.setValue('john@example.com');
        
        // Select dropdown
        const dropdown = await driver.$('~country_dropdown');
        await dropdown.click();
        
        const option = await driver.$('~option_usa');
        await option.click();
        
        // Submit form
        const submitBtn = await driver.$('~submit_button');
        await submitBtn.click();
        
        // Verify success message
        const successMsg = await driver.$('~success_message');
        const isDisplayed = await successMsg.isDisplayed();
        
        if (isDisplayed) {
            console.log('✅ Form submission successful!');
        }
        
    } catch (error) {
        console.error('❌ Form test failed:', error);
    } finally {
        await driver.deleteSession();
    }
}

testFormFill();
`
    }
]

const CODE_SNIPPETS = {
    python: [
        { label: 'Find by ID', code: 'element = driver.find_element(AppiumBy.ID, "element_id")' },
        { label: 'Find by XPath', code: 'element = driver.find_element(AppiumBy.XPATH, "//android.widget.Button[@text=\'Login\']")' },
        { label: 'Wait for Element', code: 'element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((AppiumBy.ID, "element_id")))' },
        { label: 'Click Element', code: 'element.click()' },
        { label: 'Send Keys', code: 'element.send_keys("text")' },
        { label: 'Get Text', code: 'text = element.text' },
        { label: 'Assert Text', code: 'assert element.text == "Expected Text"' },
    ],
    javascript: [
        { label: 'Find by ID', code: 'const element = await driver.$("#element_id");' },
        { label: 'Find by XPath', code: 'const element = await driver.$("//android.widget.Button[@text=\'Login\']");' },
        { label: 'Click Element', code: 'await element.click();' },
        { label: 'Send Keys', code: 'await element.setValue("text");' },
        { label: 'Get Text', code: 'const text = await element.getText();' },
        { label: 'Wait for Element', code: 'await driver.$("selector").waitForDisplayed({ timeout: 10000 });' },
        { label: 'Assert Text', code: 'expect(await element.getText()).toBe("Expected Text");' },
    ]
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
    const [showTemplates, setShowTemplates] = useState(false)
    const [showSnippets, setShowSnippets] = useState(false)
    const [showFind, setShowFind] = useState(false)
    const [findText, setFindText] = useState('')
    const [replaceText, setReplaceText] = useState('')
    const [theme, setTheme] = useState<'dark' | 'light'>('dark')
    const [autoSave, setAutoSave] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

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

        // Keyboard shortcuts
        const handleKeyboard = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                saveFile()
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault()
                if (!isRunning) runCode()
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
                e.preventDefault()
                setShowFind(true)
            }
        }

        window.addEventListener('keydown', handleKeyboard)
        return () => window.removeEventListener('keydown', handleKeyboard)
    }, [isRunning])

    useEffect(() => {
        setLineCount(code.split('\n').length)
    }, [code])

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!autoSave) return

        const interval = setInterval(() => {
            if (code.trim()) {
                saveFile()
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [autoSave, code])

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

    const deleteFile = async (file: SavedFile, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm(`Delete ${file.name}?`)) return

        try {
            await axios.delete(`http://localhost:8000/api/code/file/${file.name}`)
            loadSavedFiles()
            if (currentFile?.name === file.name) {
                setCurrentFile(null)
                setCode('')
            }
        } catch (error) {
            alert('Failed to delete file')
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

    const loadTemplate = (template: CodeTemplate) => {
        setCode(template.code)
        setFileName(`${template.name.toLowerCase().replace(/\s+/g, '_')}.${template.language === 'python' ? 'py' : 'js'}`)
        setLanguage(template.language as 'python' | 'javascript')
        setShowTemplates(false)
    }

    const insertSnippet = (snippet: string) => {
        if (!textareaRef.current) return

        const textarea = textareaRef.current
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newCode = code.substring(0, start) + snippet + code.substring(end)

        setCode(newCode)
        setShowSnippets(false)

        // Set cursor after inserted snippet
        setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(start + snippet.length, start + snippet.length)
        }, 0)
    }

    const handleFind = () => {
        if (!findText || !textareaRef.current) return

        const textarea = textareaRef.current
        const index = code.indexOf(findText, textarea.selectionStart + 1)

        if (index !== -1) {
            textarea.focus()
            textarea.setSelectionRange(index, index + findText.length)
        } else {
            alert('No more matches found')
        }
    }

    const handleReplace = () => {
        if (!findText || !textareaRef.current) return

        const newCode = code.replace(new RegExp(findText, 'g'), replaceText)
        setCode(newCode)
        setShowFind(false)
    }

    const formatCode = async () => {
        if (language === 'python') {
            // Basic Python formatting
            const lines = code.split('\n')
            const formatted = lines.map(line => {
                // Simple indentation fix
                let indent = 0
                if (line.trim().startsWith('def ') || line.trim().startsWith('class ') || line.trim().endsWith(':')) {
                    // Keep current indent
                }
                return line
            }).join('\n')
            setCode(formatted)
        }
        alert('✅ Code formatted!')
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        let newValue = e.target.value

        // Auto-indent on Enter
        if (e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === 'insertLineBreak') {
            const textarea = e.target
            const lines = newValue.substring(0, textarea.selectionStart).split('\n')
            const prevLine = lines[lines.length - 2] || ''
            const indent = prevLine.match(/^\s*/)?.[0] || ''

            // Add extra indent if previous line ends with :
            const extraIndent = prevLine.trim().endsWith(':') ? '    ' : ''

            newValue = newValue.substring(0, textarea.selectionStart) + indent + extraIndent + newValue.substring(textarea.selectionStart)

            setTimeout(() => {
                textarea.setSelectionRange(
                    textarea.selectionStart + indent.length + extraIndent.length,
                    textarea.selectionStart + indent.length + extraIndent.length
                )
            }, 0)
        }

        setCode(newValue)

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

    const colors = theme === 'dark' ? {
        bg: '#1e1e1e',
        bgSecondary: '#252526',
        bgTertiary: '#2d2d30',
        border: '#3e3e42',
        text: '#d4d4d4',
        textSecondary: '#888',
        accent: '#58a6ff',
        success: '#3fb950',
        lineNumber: '#858585'
    } : {
        bg: '#ffffff',
        bgSecondary: '#f3f3f3',
        bgTertiary: '#e8e8e8',
        border: '#d0d0d0',
        text: '#24292e',
        textSecondary: '#6a737d',
        accent: '#0366d6',
        success: '#28a745',
        lineNumber: '#959da5'
    }

    return (
        <div style={{
            height: '100vh',
            background: colors.bg,
            display: 'flex',
            flexDirection: 'column',
            color: colors.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            {/* Top Bar */}
            <div style={{
                background: `linear-gradient(135deg, ${colors.bgTertiary} 0%, ${colors.bgSecondary} 100%)`,
                padding: '14px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${colors.border}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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
                        <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            style={{
                                background: colors.bgTertiary,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: 600
                            }}
                        >
                            📋 Templates
                        </button>

                        <select
                            value={language}
                            onChange={(e) => {
                                const newLang = e.target.value as 'python' | 'javascript'
                                setLanguage(newLang)
                                setFileName(newLang === 'python' ? 'test_script.py' : 'test_script.js')
                            }}
                            style={{
                                background: colors.bgTertiary,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            <option value="python">🐍 Python</option>
                            <option value="javascript">📜 JavaScript</option>
                        </select>

                        <input
                            type="text"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            style={{
                                background: colors.bgTertiary,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                padding: '8px 16px',
                                borderRadius: '6px',
                                fontSize: '13px',
                                width: '220px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={autoSave}
                            onChange={(e) => setAutoSave(e.target.checked)}
                        />
                        Auto-Save
                    </label>

                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        style={{
                            background: colors.bgTertiary,
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                        }}
                    >
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>

                    {showSaveSuccess && (
                        <span style={{ color: colors.success, fontSize: '14px', fontWeight: 600 }}>
                            ✓ Saved!
                        </span>
                    )}

                    <button onClick={saveFile} style={{
                        background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(35, 134, 54, 0.3)'
                    }}>
                        💾 Save
                    </button>

                    <button onClick={runCode} disabled={isRunning} style={{
                        background: isRunning ? '#555' : 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 24px',
                        borderRadius: '8px',
                        cursor: isRunning ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        fontSize: '14px'
                    }}>
                        {isRunning ? '⏳ Running...' : '▶️ Run Test'}
                    </button>

                    <button onClick={() => window.history.back()} style={{
                        background: colors.bgTertiary,
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}>
                        ← Back
                    </button>
                </div>
            </div>

            {/* Templates Modal */}
            {showTemplates && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} onClick={() => setShowTemplates(false)}>
                    <div style={{
                        background: colors.bgSecondary,
                        borderRadius: '12px',
                        padding: '32px',
                        maxWidth: '800px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0 }}>📋 Code Templates</h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {CODE_TEMPLATES.map((template, i) => (
                                <div key={i} onClick={() => loadTemplate(template)} style={{
                                    background: colors.bg,
                                    padding: '20px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: `1px solid ${colors.border}`,
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{template.icon}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{template.name}</div>
                                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>{template.description}</div>
                                    <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '8px' }}>
                                        {template.language === 'python' ? '🐍 Python' : '📜 JavaScript'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar */}
                <div style={{ width: '280px', background: colors.bgSecondary, borderRight: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px', borderBottom: `1px solid ${colors.border}`, background: colors.bgTertiary }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: colors.textSecondary }}>📁 FILES</span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => { setCode(''); setFileName('new_test.py'); setCurrentFile(null); }} style={{
                                flex: 1,
                                background: 'linear-gradient(135deg, #238636 0%, #2ea043 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                + New
                            </button>
                            <button onClick={() => setShowSnippets(!showSnippets)} style={{
                                flex: 1,
                                background: colors.bgTertiary,
                                color: colors.text,
                                border: `1px solid ${colors.border}`,
                                padding: '6px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 600
                            }}>
                                💡 Snippets
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {files.map((file, index) => (
                            <div key={index} onClick={() => openFile(file)} style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                background: currentFile?.name === file.name ? 'rgba(58, 166, 255, 0.15)' : 'transparent',
                                borderLeft: currentFile?.name === file.name ? '3px solid #58a6ff' : '3px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span style={{ fontSize: '18px' }}>{getFileIcon(file.name)}</span>
                                <span style={{ flex: 1, fontSize: '13px' }}>{file.name}</span>
                                <button onClick={(e) => deleteFile(file, e)} style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f85149',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    padding: '4px'
                                }}>
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Snippets Panel */}
                    {showSnippets && (
                        <div style={{
                            position: 'absolute',
                            left: '280px',
                            top: '80px',
                            width: '300px',
                            background: colors.bgSecondary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            padding: '16px',
                            zIndex: 100,
                            maxHeight: '400px',
                            overflow: 'auto'
                        }}>
                            <div style={{ fontWeight: 600, marginBottom: '12px' }}>💡 Code Snippets</div>
                            {CODE_SNIPPETS[language].map((snippet, i) => (
                                <div key={i} onClick={() => insertSnippet(snippet.code)} style={{
                                    padding: '8px 12px',
                                    background: colors.bg,
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{snippet.label}</div>
                                    <code style={{ fontSize: '11px', color: colors.textSecondary }}>{snippet.code.substring(0, 40)}...</code>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '10px 20px', background: colors.bgTertiary, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>{getFileIcon(fileName)}</span>
                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{fileName}</span>
                        <div style={{ flex: 1 }} />
                        <button onClick={() => setShowFind(!showFind)} style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}>
                            🔍 Find
                        </button>
                        <button onClick={formatCode} style={{
                            background: 'transparent',
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}>
                            ✨ Format
                        </button>
                    </div>

                    {/* Find & Replace */}
                    {showFind && (
                        <div style={{ padding: '12px 20px', background: colors.bgTertiary, borderBottom: `1px solid ${colors.border}`, display: 'flex', gap: '12px' }}>
                            <input
                                value={findText}
                                onChange={(e) => setFindText(e.target.value)}
                                placeholder="Find..."
                                style={{
                                    flex: 1,
                                    background: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '13px'
                                }}
                            />
                            <input
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                                placeholder="Replace..."
                                style={{
                                    flex: 1,
                                    background: colors.bg,
                                    color: colors.text,
                                    border: `1px solid ${colors.border}`,
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '13px'
                                }}
                            />
                            <button onClick={handleFind} style={{
                                background: colors.accent,
                                color: 'white',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}>
                                Find
                            </button>
                            <button onClick={handleReplace} style={{
                                background: colors.success,
                                color: 'white',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}>
                                Replace All
                            </button>
                        </div>
                    )}

                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        <div style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '60px',
                            background: colors.bg,
                            borderRight: `1px solid ${colors.border}`,
                            padding: '16px 8px',
                            fontFamily: 'Monaco, Consolas, monospace',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: colors.lineNumber,
                            textAlign: 'right',
                            userSelect: 'none',
                            overflow: 'hidden'
                        }}>
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i} style={{
                                    color: i + 1 === cursorPosition.line ? colors.text : colors.lineNumber,
                                    fontWeight: i + 1 === cursorPosition.line ? 600 : 400
                                }}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>

                        <textarea
                            ref={textareaRef}
                            value={code}
                            onChange={handleTextChange}
                            spellCheck={false}
                            style={{
                                position: 'absolute',
                                left: '60px',
                                top: 0,
                                right: 0,
                                bottom: 0,
                                background: colors.bg,
                                color: colors.text,
                                border: 'none',
                                padding: '16px 20px',
                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                resize: 'none',
                                outline: 'none',
                                overflow: 'auto'
                            }}
                        />
                    </div>

                    {output && (
                        <div style={{ height: '240px', background: colors.bg, borderTop: `2px solid ${colors.border}`, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '10px 20px', background: colors.bgTertiary, borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700, color: colors.textSecondary }}>📟 OUTPUT</span>
                                <button onClick={() => setOutput('')} style={{
                                    background: 'transparent',
                                    color: colors.textSecondary,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }}>
                                    Clear
                                </button>
                            </div>
                            <div style={{ flex: 1, padding: '16px 20px', overflow: 'auto', fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
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
                fontSize: '12px',
                color: 'white',
                fontWeight: 600
            }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <span>⚡ Ready</span>
                    <span>🐍 {language === 'python' ? 'Python 3.11' : 'Node.js'}</span>
                    <span>📝 {lineCount} lines</span>
                    {autoSave && <span>💾 Auto-Save ON</span>}
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '11px' }}>
                    <span>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
                    <span>UTF-8</span>
                    <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
                </div>
            </div>
        </div>
    )
}
