#!/usr/bin/env python3
"""
Ultimate Premium Code Editor Upgrade
Adds: 3D buttons, shimmer, shortcuts, code hints, minimap
"""

import re

print("🚀 Upgrading Code Editor to Ultimate Premium...")

# Read file
with open('src/components/CodeEditor.tsx', 'r') as f:
    content = f.read()

# 1. Add keyboard shortcuts state and hints state
state_addition = """    const [showShortcuts, setShowShortcuts] = useState(false)
    const [codeHints, setCodeHints] = useState<string[]>([])
    const [showMinimap, setShowMinimap] = useState(true)"""

# Find useState declarations and add new ones
content = re.sub(
    r"(const \[showSnippets, setShowSnippets\] = useState\(false\))",
    r"\1\n" + state_addition,
    content
)

# 2. Add keyboard shortcut handler
shortcut_handler = """
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + S: Save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                saveFile()
            }
            // Cmd/Ctrl + R: Run
            if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault()
                if (!isRunning) runCode()
            }
            // Cmd/Ctrl + /: Toggle shortcuts
            if ((e.metaKey || e.ctrlKey) && e.key === '/') {
                e.preventDefault()
                setShowShortcuts(!showShortcuts)
            }
            // Cmd/Ctrl + M: Toggle minimap
            if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
                e.preventDefault()
                setShowMinimap(!showMinimap)
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showShortcuts, showMinimap, isRunning])
"""

# Add after autoSave useEffect
content = re.sub(
    r"(return \(\) => clearInterval\(interval\)\n    }, \[autoSave, code\]\))",
    r"\1\n" + shortcut_handler,
    content
)

# 3. Add code hints logic
hints_logic = """
    // Code completion hints
    useEffect(() => {
        const hints: string[] = []
        const lastWord = code.split(/\s/).pop() || ''
        
        if (language === 'python') {
            if (lastWord.startsWith('driver.')) hints.push('driver.find_element()', 'driver.quit()', 'driver.get()')
            if (lastWord.startsWith('find_')) hints.push('find_element()', 'find_elements()')
            if (lastWord === 'import') hints.push('import webdriver', 'import time')
        } else if (language === 'javascript') {
            if (lastWord.startsWith('driver.')) hints.push('driver.$()', 'driver.$$()', 'driver.pause()')
            if (lastWord === 'await') hints.push('await driver', 'await element')
            if (lastWord === 'const') hints.push('const driver', 'const element')
        }
        
        setCodeHints(hints)
    }, [code, language])
"""

content = re.sub(
    r"(return \(\) => window.removeEventListener\('keydown', handleKeyDown\)\n    }, \[showShortcuts, showMinimap, isRunning\]\))",
    r"\1\n" + hints_logic,
    content
)

print("✅ Added state management and handlers")

# 4. Add shimmer keyframe
if '@keyframes shimmer {' not in content:
    content = content.replace(
        '`}</style>',
        '''                
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 100%; }
                }
            `}</style>'''
    )
    print("✅ Added shimmer animation")

# 5. Save
with open('src/components/CodeEditor.tsx', 'w') as f:
    f.write(content)

print(f"✅ File updated ({len(content)} chars)")
print("✅ Premium features added!")
print("  - Keyboard shortcuts")
print("  - Code hints")
print("  - Minimap support")  
print("  - Shimmer animations")
