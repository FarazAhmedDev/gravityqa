Boss, **quick fix! Action Type Selector add karna hai!**

File me manually ye code add karo:

**Location:** `/Users/developervativeapps/Desktop/APPIUM INSPECTOR /gravityqa/src/components/inspector/AutomationWizard.tsx`

**Line 1954 ke baad add karo:**

```tsx
{/* Action Type Selector - Convert tap to other action types */}
{(action.action === 'tap' || action.action === 'inspector_tap') && action.element && (
    <div style={{ marginTop: '12px', marginBottom: '12px' }}>
        <label style={{ fontSize: '11px', color: '#8b949e', display: 'block', marginBottom: '6px' }}>
            🔄 Change Action Type
        </label>
        <select
            value={action.action}
            onChange={(e) => {
                const newActions = [...actions]
                const idx = actions.indexOf(action)
                newActions[idx] = {
                    ...newActions[idx],
                    action: e.target.value as any,
                    description: e.target.value === 'type_text' 
                        ? '⌨️ Type Text'
                        : e.target.value === 'wait_visible'
                        ? '⏱️ Wait Visible'
                        : e.target.value === 'wait_clickable'
                        ? '⏱️ Wait Clickable'
                        : e.target.value === 'assert_visible'
                        ? '✓ Assert Visible'
                        : e.target.value === 'assert_text'
                        ? '✓ Assert Text'
                        : action.description
                }
                setActions(newActions)
            }}
            style={{
                width: '100%',
                padding: '10px',
                background: '#161b22',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
                fontWeight: 600
            }}
        >
            <option value="tap">👆 Tap</option>
            <option value="inspector_tap">👆 Inspector Tap</option>
            <option value="type_text">⌨️ Type Text</option>
            <option value="wait_visible">⏱️ Wait Visible</option>
            <option value="wait_clickable">⏱️ Wait Clickable</option>
            <option value="assert_visible">✓ Assert Visible</option>
            <option value="assert_text">✓ Assert Text</option>
        </select>
    </div>
)}
```

**Exact location:**
- Line 1954 pe `</div>` hai (description wala)
- Us ke BAAD ye code paste karo  
- Line 1956 se pehle (jaha `{/* TYPE_TEXT UI */}` comment hai)

**Ya phir simple command:**

```bash
# Backup
cp "src/components/inspector/AutomationWizard.tsx" "src/components/inspector/AutomationWizard.tsx.backup"

# Run this Python script:
cat > add_selector.py << 'EOF'
with open('src/components/inspector/AutomationWizard.tsx', 'r') as f:
    lines = f.readlines()

# Find the line with {/* TYPE_TEXT UI */}
insert_line = None
for i, line in enumerate(lines):
    if '{/* TYPE_TEXT UI */}' in line:
        insert_line = i
        break

if insert_line:
    new_code = '''
                                            {/* Action Type Selector - Convert tap to other action types */}
                                            {(action.action === 'tap' || action.action === 'inspector_tap') && action.element && (
                                                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                                                    <label style={{ fontSize: '11px', color: '#8b949e', display: 'block', marginBottom: '6px' }}>
                                                        🔄 Change Action Type
                                                    </label>
                                                    <select
                                                        value={action.action}
                                                        onChange={(e) => {
                                                            const newActions = [...actions]
                                                            const idx = actions.indexOf(action)
                                                            newActions[idx] = {
                                                                ...newActions[idx],
                                                                action: e.target.value as any,
                                                                description: e.target.value === 'type_text' 
                                                                    ? '⌨️ Type Text'
                                                                    : e.target.value === 'wait_visible'
                                                                    ? '⏱️ Wait Visible'
                                                                    : e.target.value === 'wait_clickable'
                                                                    ? '⏱️ Wait Clickable'
                                                                    : e.target.value === 'assert_visible'
                                                                    ? '✓ Assert Visible'
                                                                    : e.target.value === 'assert_text'
                                                                    ? '✓ Assert Text'
                                                                    : action.description
                                                            }
                                                            setActions(newActions)
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            background: '#161b22',
                                                            color: '#e6edf3',
                                                            border: '1px solid #30363d',
                                                            borderRadius: '6px',
                                                            fontSize: '13px',
                                                            cursor: 'pointer',
                                                            fontWeight: 600
                                                        }}
                                                    >
                                                        <option value="tap">👆 Tap</option>
                                                        <option value="inspector_tap">👆 Inspector Tap</option>
                                                        <option value="type_text">⌨️ Type Text</option>
                                                        <option value="wait_visible">⏱️ Wait Visible</option>
                                                        <option value="wait_clickable">⏱️ Wait Clickable</option>
                                                        <option value="assert_visible">✓ Assert Visible</option>
                                                        <option value="assert_text">✓ Assert Text</option>
                                                    </select>
                                                </div>
                                            )}

'''
    lines.insert(insert_line, new_code)
    
    with open('src/components/inspector/AutomationWizard.tsx', 'w') as f:
        f.writelines(lines)
    
    print("✅ Action Type Selector added!")
else:
    print("❌ Could not find insertion point")
EOF

python3 add_selector.py
```

**After adding, reload the app and you'll see a dropdown above each TAP action that says "🔄 Change Action Type"!**

Select "⌨️ Type Text" and the text input will appear! 💎✨
