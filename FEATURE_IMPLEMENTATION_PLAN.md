# 🎯 GravityQA - 5 High-Impact Features Implementation Plan

## 🔒 **CRITICAL CONSTRAINTS (DO NOT TOUCH)**
- ❌ Inspector hover listener
- ❌ Coordinate transformation logic
- ❌ Detect-element backend API
- ❌ Highlight box positioning
- ❌ Screenshot-to-device mapping
- ❌ Any inspector UI logic

## ✅ **SAFE ZONES (Where we CAN change)**
- ✅ Recorded Actions panel UI
- ✅ Action editor/controls
- ✅ Playback runner logic
- ✅ Test execution APIs
- ✅ Report/logs UI
- ✅ RecordedAction data model

---

# 📋 **Implementation Breakdown**

## **Phase 1: Data Model Updates**

### **1.1 Update RecordedAction Interface**
**File:** `src/components/inspector/AutomationWizard.tsx`
**Lines:** Around line 20-35

**Current:**
```typescript
interface RecordedAction {
    step: number
    action: string
    x?: number
    y?: number
    text?: string
    duration?: number
    element?: any
    description: string
    timestamp: number
    enabled?: boolean
    retryCount?: number
    waitBefore?: number
    waitAfter?: number
}
```

**Updated:**
```typescript
interface RecordedAction {
    step: number
    action: 'tap' | 'swipe' | 'inspector_tap' | 'type_text' | 'wait_visible' | 'wait_clickable' | 'assert_visible' | 'assert_text' | 'wait'
    
    // Existing fields
    x?: number
    y?: number
    duration?: number
    element?: any
    description: string
    timestamp: number
    enabled?: boolean
    
    // Type Text params
    text?: string
    clearBeforeType?: boolean
    pressEnter?: boolean
    
    // Wait params
    waitType?: 'visible' | 'clickable'
    timeoutSec?: number
    
    // Assert params
    assertType?: 'visible' | 'text'
    expectedText?: string
    
    // Retry params
    retryCount?: number
    retryDelayMs?: number
}
```

---

## **Phase 2: Backend APIs** (New Endpoints)

### **2.1 Type Text API**
```python
# backend/api/actions.py

@router.post("/api/actions/type-text")
async def type_text(request: Dict):
    """
    Type text into element
    Body: {
        device_id: str,
        element: { selector: { strategy, value } },
        text: str,
        clearBeforeType: bool,
        pressEnter: bool
    }
    """
    driver = get_appium_driver(device_id)
    
    # Find element
    if selector.strategy == 'id':
        elem = driver.find_element(AppiumBy.ID, selector.value)
    else:
        elem = driver.find_element(AppiumBy.XPATH, selector.value)
    
    # Clear if needed
    if clearBeforeType:
        elem.clear()
    
    # Type text
    elem.send_keys(text)
    
    # Press enter if needed
    if pressEnter:
        elem.send_keys('\n')
    
    return {"success": True}
```

### **2.2 Wait For Element API**
```python
@router.post("/api/actions/wait-for-element")
async def wait_for_element(request: Dict):
    """
    Wait for element to be visible/clickable
    Body: {
        device_id: str,
        element: { selector: { strategy, value } },
        waitType: 'visible' | 'clickable',
        timeoutSec: int
    }
    """
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    
    driver = get_appium_driver(device_id)
    
    # Create locator
    if selector.strategy == 'id':
        locator = (AppiumBy.ID, selector.value)
    else:
        locator = (AppiumBy.XPATH, selector.value)
    
    try:
        wait = WebDriverWait(driver, timeoutSec)
        
        if waitType == 'visible':
            element = wait.until(EC.visibility_of_element_located(locator))
        else:  # clickable
            element = wait.until(EC.element_to_be_clickable(locator))
        
        return {"success": True, "found": True}
    
    except TimeoutException:
        return {"success": False, "error": f"Element not {waitType} after {timeoutSec}s"}
```

### **2.3 Assert Element API**
```python
@router.post("/api/actions/assert-element")
async def assert_element(request: Dict):
    """
    Assert element is visible or has specific text
    Body: {
        device_id: str,
        element: { selector: { strategy, value } },
        assertType: 'visible' | 'text',
        expectedText?: str,
        timeoutSec: int
    }
    """
    driver = get_appium_driver(device_id)
    
    # Find element
    try:
        wait = WebDriverWait(driver, timeoutSec)
        
        if selector.strategy == 'id':
            locator = (AppiumBy.ID, selector.value)
        else:
            locator = (AppiumBy.XPATH, selector.value)
        
        if assertType == 'visible':
            element = wait.until(EC.visibility_of_element_located(locator))
            return {"success": True, "assertion": "passed"}
        
        elif assertType == 'text':
            element = wait.until(EC.visibility_of_element_located(locator))
            actualText = element.text
            
            if actualText == expectedText:
                return {"success": True, "assertion": "passed"}
            else:
                return {
                    "success": False,
                    "assertion": "failed",
                    "error": f"Expected '{expectedText}' but got '{actualText}'"
                }
    
    except TimeoutException:
        return {
            "success": False,
            "assertion": "failed",
            "error": f"Element not visible after {timeoutSec}s"
        }
```

### **2.4 Take Screenshot API**
```python
@router.get("/api/actions/capture-failure-screenshot/{device_id}")
async def capture_failure_screenshot(device_id: str):
    """Capture screenshot for test failure evidence"""
    driver = get_appium_driver(device_id)
    
    # Take screenshot
    screenshot_base64 = driver.get_screenshot_as_base64()
    
    # Save to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"failure_{device_id}_{timestamp}.png"
    filepath = f"screenshots/failures/{filename}"
    
    with open(filepath, 'wb') as f:
        f.write(base64.b64decode(screenshot_base64))
    
    return {
        "success": True,
        "filepath": filepath,
        "screenshot": screenshot_base64
    }
```

---

## **Phase 3: Frontend UI Components**

### **3.1 Action Type Selector (Add Action Menu)**

**Location:** Inside Recorded Actions panel header

```tsx
// Add after "Recorded Actions" title
<div style={{ marginTop: '12px', marginBottom: '16px' }}>
    <button
        onClick={() => setShowAddActionMenu(!showAddActionMenu)}
        style={{
            width: '100%',
            padding: '12px',
            background: 'linear-gradient(135deg, #1f6feb, #1158c7)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
        }}
    >
        + Add Action
    </button>
    
    {showAddActionMenu && (
        <div style={{
            marginTop: '8px',
            background: '#161b22',
            borderRadius: '8px',
            padding: '8px',
            border: '1px solid #30363d'
        }}>
            <button onClick={() => addAction('type_text')}>⌨️ Type Text</button>
            <button onClick={() => addAction('wait_visible')}>👁️ Wait Visible</button>
            <button onClick={() => addAction('wait_clickable')}>👆 Wait Clickable</button>
            <button onClick={() => addAction('assert_visible')}>✓ Assert Visible</button>
            <button onClick={() => addAction('assert_text')}>✓ Assert Text</button>
        </div>
    )}
</div>
```

### **3.2 Type Text Action UI**

```tsx
{action.action === 'type_text' && (
    <div style={{ marginTop: '12px' }}>
        <input
            type="text"
            placeholder="Enter text to type..."
            value={action.text || ''}
            onChange={(e) => updateActionText(idx, e.target.value)}
            style={{
                width: '100%',
                padding: '10px',
                background: '#0d1117',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '6px',
                fontSize: '13px',
                marginBottom: '8px'
            }}
        />
        
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e' }}>
                <input
                    type="checkbox"
                    checked={action.clearBeforeType || false}
                    onChange={(e) => updateActionParam(idx, 'clearBeforeType', e.target.checked)}
                />
                Clear before type
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b949e' }}>
                <input
                    type="checkbox"
                    checked={action.pressEnter || false}
                    onChange={(e) => updateActionParam(idx, 'pressEnter', e.target.checked)}
                />
                Press Enter
            </label>
        </div>
    </div>
)}
```

### **3.3 Wait/Assert Action UI**

```tsx
{(action.action === 'wait_visible' || action.action === 'wait_clickable') && (
    <div style={{ marginTop: '12px' }}>
        <label style={{ fontSize: '11px', color: '#8b949e' }}>Timeout (seconds)</label>
        <input
            type="number"
            min="1"
            max="60"
            value={action.timeoutSec || 10}
            onChange={(e) => updateActionParam(idx, 'timeoutSec', parseInt(e.target.value))}
            style={{
                width: '100%',
                padding: '8px',
                background: '#0d1117',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '6px',
                fontSize: '13px'
            }}
        />
    </div>
)}

{action.action === 'assert_text' && (
    <div style={{ marginTop: '12px' }}>
        <input
            type="text"
            placeholder="Expected text..."
            value={action.expectedText || ''}
            onChange={(e) => updateActionParam(idx, 'expectedText', e.target.value)}
            style={{
                width: '100%',
                padding: '10px',
                background: '#0d1117',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '6px',
                fontSize: '13px'
            }}
        />
    </div>
)}
```

### **3.4 Retry Configuration UI**

```tsx
// Add to each action card
<div style={{ marginTop: '12px', padding: '10px', background: '#0d1117', borderRadius: '6px' }}>
    <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '8px' }}>
        🔄 Retry on Failure
    </div>
    
    <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: '#6e7681' }}>Retry Count</label>
            <select
                value={action.retryCount || 0}
                onChange={(e) => updateActionParam(idx, 'retryCount', parseInt(e.target.value))}
                style={{
                    width: '100%',
                    padding: '6px',
                    background: '#161b22',
                    color: '#e6edf3',
                    border: '1px solid #30363d',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
            >
                <option value="0">No retry</option>
                <option value="1">1 retry</option>
                <option value="2">2 retries</option>
                <option value="3">3 retries</option>
            </select>
        </div>
        
        <div style={{ flex: 1 }}>
            <label style={{ fontSize: '10px', color: '#6e7681' }}>Delay (ms)</label>
            <input
                type="number"
                min="100"
                max="5000"
                step="100"
                value={action.retryDelayMs || 500}
                onChange={(e) => updateActionParam(idx, 'retryDelayMs', parseInt(e.target.value))}
                disabled={!action.retryCount || action.retryCount === 0}
                style={{
                    width: '100%',
                    padding: '6px',
                    background: '#161b22',
                    color: '#e6edf3',
                    border: '1px solid #30363d',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
            />
        </div>
    </div>
</div>
```

---

## **Phase 4: Test Runner & Playback**

### **4.1 Execute Action with Retry**

```typescript
const executeActionWithRetry = async (action: RecordedAction): Promise<ExecutionResult> => {
    const maxAttempts = (action.retryCount || 0) + 1
    const retryDelay = action.retryDelayMs || 500
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[Runner] Executing ${action.action} (attempt ${attempt}/${maxAttempts})`)
            
            const result = await executeAction(action)
            
            if (result.success) {
                return {
                    success: true,
                    attempt,
                    logs: [`✓ Success on attempt ${attempt}`]
                }
            }
            
        } catch (error: any) {
            console.error(`[Runner] Attempt ${attempt} failed:`, error)
            
            if (attempt < maxAttempts) {
                console.log(`[Runner] Retrying in ${retryDelay}ms...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
            } else {
                // Final attempt failed
                return {
                    success: false,
                    attempt,
                    error: error.message,
                    logs: [`✗ Failed after ${maxAttempts} attempts`]
                }
            }
        }
    }
    
    return { success: false, error: 'Unknown error' }
}
```

### **4.2 Execute Individual Actions**

```typescript
const executeAction = async (action: RecordedAction): Promise<any> => {
    switch (action.action) {
        case 'type_text':
            return await axios.post('http://localhost:8000/api/actions/type-text', {
                device_id: selectedDevice,
                element: action.element,
                text: action.text,
                clearBeforeType: action.clearBeforeType,
                pressEnter: action.pressEnter
            })
        
        case 'wait_visible':
        case 'wait_clickable':
            return await axios.post('http://localhost:8000/api/actions/wait-for-element', {
                device_id: selectedDevice,
                element: action.element,
                waitType: action.action === 'wait_visible' ? 'visible' : 'clickable',
                timeoutSec: action.timeoutSec || 10
            })
        
        case 'assert_visible':
        case 'assert_text':
            const result = await axios.post('http://localhost:8000/api/actions/assert-element', {
                device_id: selectedDevice,
                element: action.element,
                assertType: action.action === 'assert_visible' ? 'visible' : 'text',
                expectedText: action.expectedText,
                timeoutSec: action.timeoutSec || 10
            })
            
            if (!result.data.success) {
                throw new Error(result.data.error)
            }
            
            return result
        
        // ... existing tap/swipe handlers
    }
}
```

---

## **Phase 5: Failure Report UI**

### **5.1 Test Run Report Panel**

```tsx
{testRunReport && (
    <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        background: 'linear-gradient(135deg, #0d1117, #161b22)',
        borderLeft: '2px solid #30363d',
        padding: '24px',
        overflowY: 'auto',
        zIndex: 9999
    }}>
        <h2 style={{
            fontSize: '20px',
            marginBottom: '20px',
            color: testRunReport.status === 'passed' ? '#3fb950' : '#f85149'
        }}>
            {testRunReport.status === 'passed' ? '✅ Test Passed' : '❌ Test Failed'}
        </h2>
        
        {/* Failed Step Highlight */}
        {testRunReport.failedStep && (
            <div style={{
                padding: '16px',
                background: 'rgba(248, 81, 73, 0.1)',
                border: '1px solid #f85149',
                borderRadius: '8px',
                marginBottom: '20px'
            }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f85149', marginBottom: '8px' }}>
                    Failed at Step {testRunReport.failedStep.step}
                </div>
                <div style={{ fontSize: '12px', color: '#e6edf3' }}>
                    {testRunReport.failedStep.description}
                </div>
                <div style={{ fontSize: '11px', color: '#f85149', marginTop: '8px', fontFamily: 'monospace' }}>
                    {testRunReport.error}
                </div>
            </div>
        )}
        
        {/* Failure Screenshot */}
        {testRunReport.screenshot && (
            <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>
                    📸 Failure Screenshot
                </div>
                <img
                    src={`data:image/png;base64,${testRunReport.screenshot}`}
                    style={{
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid #30363d'
                    }}
                />
            </div>
        )}
        
        {/* Execution Logs */}
        <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b949e', marginBottom: '8px' }}>
                📋 Execution Logs
            </div>
            <div style={{
                background: '#0d1117',
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '300px',
                overflowY: 'auto',
                fontSize: '11px',
                fontFamily: 'monospace'
            }}>
                {testRunReport.logs.map((log, idx) => (
                    <div key={idx} style={{
                        padding: '4px 0',
                        color: log.success ? '#3fb950' : '#f85149'
                    }}>
                        [{log.timestamp}] {log.message}
                    </div>
                ))}
            </div>
        </div>
        
        <button
            onClick={() => setTestRunReport(null)}
            style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: '#21262d',
                color: '#e6edf3',
                border: '1px solid #30363d',
                borderRadius: '8px',
                cursor: 'pointer'
            }}
        >
            Close Report
        </button>
    </div>
)}
```

---

## **Phase 6: Code Generation Updates**

### **6.1 Generate Code for New Actions**

```python
# backend/utils/code_generator.py

def generate_javascript_code(actions: list, ...):
    # ... existing code ...
    
    for i, action in enumerate(actions, 1):
        action_type = action.get('action')
        
        if action_type == 'type_text':
            element = action.get('element', {})
            selector = element.get('selector', {})
            text = action.get('text', '')
            clearBefore = action.get('clearBeforeType', False)
            pressEnter = action.get('pressEnter', False)
            
            code_lines.append(f"        // Step {i}: Type text")
            
            if selector.get('strategy') == 'id':
                code_lines.append(f"        const elem{i} = await driver.$('id={selector['value']}');")
            else:
                code_lines.append(f"        const elem{i} = await driver.$('{selector['value']}');")
            
            if clearBefore:
                code_lines.append(f"        await elem{i}.clearValue();")
            
            code_lines.append(f"        await elem{i}.setValue('{text}');")
            
            if pressEnter:
                code_lines.append(f"        await elem{i}.addValue('\\n');")
        
        elif action_type == 'wait_visible':
            timeout = action.get('timeoutSec', 10) * 1000
            selector = action.get('element', {}).get('selector', {})
            
            code_lines.append(f"        // Step {i}: Wait for element to be visible")
            code_lines.append(f"        await driver.$('id={selector['value']}').waitForDisplayed({{ timeout: {timeout} }});")
        
        elif action_type == 'assert_text':
            expectedText = action.get('expectedText', '')
            selector = action.get('element', {}).get('selector', {})
            
            code_lines.append(f"        // Step {i}: Assert text")
            code_lines.append(f"        const actualText = await driver.$('id={selector['value']}').getText();")
            code_lines.append(f"        if (actualText !== '{expectedText}') {{")
            code_lines.append(f"            throw new Error(`Expected '{expectedText}' but got '${{actualText}}'`);")
            code_lines.append(f"        }}")
        
        # ... etc for other action types
```

---

## **Implementation Order (Recommended)**

### **Week 1: Foundation**
1. Update RecordedAction interface ✅
2. Add backend APIs for TYPE_TEXT ✅
3. Add UI for Type Text action ✅
4. Test Type Text end-to-end ✅

### **Week 2: Smart Waits & Assertions**
5. Backend APIs for WAIT_FOR_* ✅
6. Backend APIs for ASSERT_* ✅
7. UI for Wait/Assert actions ✅
8. Test wait/assert logic ✅

### **Week 3: Retry & Reliability**
9. Implement retry mechanism ✅
10. Add retry UI to action cards ✅
11. Test retry scenarios ✅

### **Week 4: Reporting & Evidence**
12. Failure screenshot API ✅
13. Test Run Report UI ✅
14. Execution logs tracking ✅
15. Full integration testing ✅

### **Week 5: Code Generation**
16. Update code generators for all new actions ✅
17. Test generated code ✅

---

## **Testing Checklist**

- [ ] Type Text works with ID locator
- [ ] Type Text works with XPath locator
- [ ] Clear before type option works
- [ ] Press Enter option works
- [ ] Wait Visible timeout works correctly
- [ ] Wait Clickable detects clickable elements
- [ ] Assert Visible passes/fails correctly
- [ ] Assert Text compares correctly
- [ ] Retry count respects configuration
- [ ] Retry delay works
- [ ] Failure screenshot captures
- [ ] Report panel shows correct data
- [ ] Execution logs are accurate
- [ ] Code generation includes all new actions
- [ ] Inspector hover still works perfectly ✅
- [ ] Coordinate mapping unchanged ✅
- [ ] Highlight box position unchanged ✅

---

**Boss, ye complete implementation plan hai! Ab step-by-step implement karna start karoon? 💎✨🚀**
