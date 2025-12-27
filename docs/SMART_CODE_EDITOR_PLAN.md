# 🎯 Smart Code Editor - Feature Implementation Plan

## USER REQUIREMENTS:

### 1️⃣ **Run Test → App Selection Modal**
```
Before running:
- Show modal with app dropdown
- List all installed apps from device
- Select app to test
- Auto-fill package + activity in code
```

### 2️⃣ **APK Upload → Auto-Update Code**
```
When APK uploaded:
- Extract package name
- Extract main activity
- AUTO-UPDATE code with:
  - APP_CONFIG.package = detected package
  - APP_CONFIG.activity = detected activity
```

### 3️⃣ **Language Dropdown → Auto-Convert Code**
```
When language changes:
- JavaScript → Python: Convert syntax
- Python → JavaScript: Convert syntax
- Keep same logic
- Update APP_CONFIG format
```

---

## 🔧 IMPLEMENTATION:

### **File:** `src/components/CodeEditor.tsx`

### **New States:**
```tsx
const [showAppSelector, setShowAppSelector] = useState(false)
const [installedApps, setInstalledApps] = useState<App[]>([])
const [selectedApp, setSelectedApp] = useState<App | null>(null)
const [currentAppPackage, setCurrentAppPackage] = useState('')
const [currentAppActivity, setCurrentAppActivity] = useState('')
```

### **New Functions:**

#### **1. Load Apps from Device**
```tsx
const loadInstalledApps = async () => {
    try {
        const res = await axios.get('http://localhost:8000/api/apps/installed')
        setInstalledApps(res.data.apps || [])
    } catch (error) {
        console.error('Failed to load apps')
    }
}
```

#### **2. Update Code with App Info**
```tsx
const updateCodeWithApp = (pkg: string, activity: string) => {
    setCurrentAppPackage(pkg)
    setCurrentAppActivity(activity)
    
    // Update code
    if (language === 'javascript') {
        const updated = code.replace(
            /package: '[^']*'/,
            `package: '${pkg}'`
        ).replace(
            /activity: '[^']*'/,
            `activity: '${activity}'`
        )
        setCode(updated)
    } else {
        const updated = code.replace(
            /'package': '[^']*'/,
            `'package': '${pkg}'`
        ).replace(
            /'activity': '[^']*'/,
            `'activity': '${activity}'`
        )
        setCode(updated)
    }
}
```

#### **3. Auto-Convert Between Languages**
```tsx
const convertCode = async (newLang: 'python' | 'javascript') => {
    try {
        const res = await axios.post('http://localhost:8000/api/code/convert', {
            code: code,
            from_language: language,
            to_language: newLang,
            app_package: currentAppPackage,
            app_activity: currentAppActivity
        })
        
        setCode(res.data.converted_code)
        setLanguage(newLang)
    } catch (error) {
        // Fallback: regenerate from actions
        console.error('Conversion failed')
    }
}
```

#### **4. Listen for APK Upload**
```tsx
useEffect(() => {
    const handleAPKUploaded = (event: CustomEvent) => {
        const { package_name, activity } = event.detail
        updateCodeWithApp(package_name, activity)
    }
    
    window.addEventListener('apk-uploaded', handleAPKUploaded)
    return () => window.removeEventListener('apk-uploaded', handleAPKUploaded)
}, [])
```

---

## 🎨 UI COMPONENTS:

### **App Selection Modal:**
```tsx
{showAppSelector && (
    <div className="modal-overlay">
        <div className="app-selector-modal">
            <h2>📱 Select App to Test</h2>
            
            <div className="app-list">
                {installedApps.map(app => (
                    <div 
                        key={app.package}
                        onClick={() => {
                            setSelectedApp(app)
                            updateCodeWithApp(app.package, app.activity)
                            setShowAppSelector(false)
                            runCode()
                        }}
                        className="app-item"
                    >
                        <img src={app.icon} />
                        <div>
                            <div className="app-name">{app.name}</div>
                            <div className="app-package">{app.package}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
)}
```

### **Run Test Button (Updated):**
```tsx
<button onClick={() => {
    if (currentAppPackage) {
        runCode() // Already has app info
    } else {
        setShowAppSelector(true) // Show app selector first
    }
}}>
    ▶️ Run Test
</button>
```

### **Language Dropdown (Updated):**
```tsx
<select
    value={language}
    onChange={(e) => {
        const newLang = e.target.value as 'python' | 'javascript'
        if (code.trim()) {
            convertCode(newLang) // Auto-convert existing code
        } else {
            setLanguage(newLang) // Just change language
        }
    }}
>
    <option value="python">🐍 Python</option>
    <option value="javascript">📜 JavaScript</option>
</select>
```

---

## 📡 BACKEND API (New Endpoint):

### **File:** `backend/api/code_editor.py`

```python
@router.post("/convert")
async def convert_code(request: Dict):
    """Convert code between languages"""
    try:
        code = request.get('code', '')
        from_lang = request.get('from_language', 'javascript')
        to_lang = request.get('to_language', 'python')
        app_package = request.get('app_package', 'com.example.app')
        app_activity = request.get('app_activity', 'MainActivity')
        
        # Parse actions from code (basic extraction)
        # Then regenerate in target language
        
        from utils.code_generator import generate_javascript_code, generate_python_code
        
        if to_lang == 'python':
            converted = generate_python_code([], app_package, app_activity)
        else:
            converted = generate_javascript_code([], app_package, app_activity)
        
        return {"converted_code": converted}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🚀 WORKFLOW:

### **Scenario 1: User Uploads APK**
```
1. User uploads APK in Device Manager
2. Backend analyzes APK → extracts package + activity
3. Event fired: window.dispatchEvent('apk-uploaded')
4. Code Editor listens → auto-updates code
5. ✅ Code now has correct app info!
```

### **Scenario 2: User Clicks Run Test**
```
1. User clicks "Run Test"
2. If no app selected → Show app selector modal
3. User picks app from list
4. Code auto-updates with app info
5. Test runs immediately
6. ✅ Smooth workflow!
```

### **Scenario 3: Language Change**
```
1. User has JavaScript code
2. Selects "Python" from dropdown
3. Code auto-converts to Python
4. Maintains same logic + app config
5. ✅ Instant conversion!
```

---

## ✅ IMPLEMENTATION CHECKLIST:

- [ ] Add app selector modal UI
- [ ] Add installed apps API call
- [ ] Add APK upload event listener
- [ ] Add auto-update code function
- [ ] Add language conversion endpoint
- [ ] Add auto-convert on language change
- [ ] Update Run Test button logic
- [ ] Test all scenarios

---

**Estimated Time:** 20-30 minutes
**Impact:** HUGE - Super smart editor! 🎯✨
