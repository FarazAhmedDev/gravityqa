# 📘 GravityQA - Ultra-Detailed Technical Documentation

## TABLE OF CONTENTS
1. [Application Overview](#overview)
2. [Architecture Deep Dive](#architecture)
3. [Frontend Components](#frontend)
4. [Backend Systems](#backend)
5. [Database Schema](#database)
6. [Complete User Workflows](#workflows)
7. [API Documentation](#api)
8. [Integration Details](#integration)
9. [Troubleshooting](#troubleshooting)
10. [Development Guide](#development)

---

## 1. APPLICATION OVERVIEW {#overview}

### 1.1 What is GravityQA?

**GravityQA** is a comprehensive **Desktop Application** built for **automated mobile application testing**. It runs natively on **macOS** and provides a complete end-to-end solution for:

- **Recording** user interactions on Android mobile applications
- **Automating** test execution with recorded flows
- **Generating** production-ready test code in multiple languages
- **Managing** test suites, cases, and execution history
- **Performing** regression testing with new app versions
- **Testing** REST APIs alongside mobile tests

### 1.2 Target Users

- **QA Engineers** - Automate repetitive testing tasks
- **Mobile Developers** - Quick regression testing during development
- **Test Automation Engineers** - Generate code frameworks
- **DevOps Teams** - Integrate into CI/CD pipelines
- **Product Teams** - Validate app flows before release

### 1.3 Key Differentiators

| Feature | GravityQA | Appium Inspector | BrowserStack | Manual Testing |
|---------|-----------|------------------|--------------|----------------|
| Visual Recording | ✅ Yes | ❌ No | ✅ Limited | ❌ N/A |
| Mobile Touch Capture | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Code Generation | ✅ Multi-lang | ❌ No | ✅ Limited | ❌ N/A |
| Test Management | ✅ Built-in | ❌ No | ✅ Cloud | ❌ Manual |
| Auto-Sync | ✅ Yes | ❌ N/A | ❌ No | ❌ N/A |
| Local Execution | ✅ Yes | ✅ Yes | ❌ Cloud | ✅ Yes |
| Cost | ✅ Free | ✅ Free | ❌ Paid | ✅ Free |
| Regression Testing | ✅ Automated | ❌ Manual | ✅ Limited | ❌ Manual |

---

## 2. ARCHITECTURE DEEP DIVE {#architecture}

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (macOS)                   │
│                   React + TypeScript (Vite)                 │
│                   Port: 5173 (Development)                  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Devices  │Inspector │  Code    │  Test    │   API    │  │
│  │ Manager  │ Wizard   │ Editor   │  Mgmt    │ Testing  │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↕ HTTP + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API SERVER                         │
│                  FastAPI + Python 3.11                      │
│                  Port: 8000                                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Devices  │  Flows   │ Playback │ CodeGen  │Inspector │  │
│  │   API    │   API    │   API    │   API    │   API    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────────────────┐ │
│  │ Appium   │ Playback │   AI     │    Event Monitor     │ │
│  │ Service  │  Engine  │ CodeGen  │                      │ │
│  └──────────┴──────────┴──────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕ SQLAlchemy ORM
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite)                          │
│  Tables: flows, devices, test_runs, metadata               │
│  Location: backend/database/gravityqa.db                   │
└─────────────────────────────────────────────────────────────┘
                           ↕ Appium Protocol
┌─────────────────────────────────────────────────────────────┐
│              APPIUM SERVER (Local)                          │
│              Port: 4723                                     │
└─────────────────────────────────────────────────────────────┘
                           ↕ ADB (Android Debug Bridge)
┌─────────────────────────────────────────────────────────────┐
│           ANDROID DEVICE (USB Connected)                    │
│           - USB Debugging Enabled                           │
│           - App Under Test Installed                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Details

**Frontend Stack:**
```
- React 18.2+ (UI Framework)
- TypeScript 5.0+ (Type Safety)
- Vite 4.0+ (Build Tool & Dev Server)
- Axios 1.4+ (HTTP Client)
- React Hooks (State Management)
- LocalStorage API (Client-side Persistence)
- WebSocket Client (Real-time Updates)
- CSS3 (Custom Styling - No frameworks)
```

**Backend Stack:**
```
- Python 3.11+
- FastAPI 0.104+ (Web Framework)
- Uvicorn (ASGI Server)
- SQLAlchemy 2.0+ (ORM)
- Pydantic 2.0+ (Data Validation)
- Appium-Python-Client 3.0+ (Mobile Automation)
- WebSocket (Real-time Communication)
- aiofiles (Async File Operations)
```

**Infrastructure:**
```
- SQLite 3 (Database)
- Appium Server 2.0+ (Mobile Automation)
- Android Debug Bridge (adb) (Device Communication)
- macOS 11+ (Operating System)
```

### 2.3 Data Flow Architecture

**Recording Flow:**
```
User Tap on Screen
       ↓
Frontend Captures Click (x, y)
       ↓
POST /api/inspector/tap-coordinate
       ↓
Backend → Appium Service
       ↓
Appium → Execute Tap on Device
       ↓
Capture Screenshot
       ↓
Save Action to Memory Array
       ↓
Return Success to Frontend
       ↓
Display in Actions List
```

**Save Flow:**
```
User Clicks "Save Flow"
       ↓
Frontend: Create Flow Object
       ↓
POST /api/flows/ {name, steps, device, app}
       ↓
Backend: Validate Data (Pydantic)
       ↓
Database: Insert Flow Record
       ↓
✨ AUTO-SYNC: Create TestCase Object
       ↓
LocalStorage: Save to test_cases
       ↓
Return flow_id to Frontend
```

**Playback Flow:**
```
User Clicks "▶️ Run"
       ↓
POST /api/playback/start {flow_id, device_id}
       ↓
Backend: Load Flow from Database
       ↓
Close Existing App Sessions
       ↓
Force Stop App (ADB)
       ↓
Clear App Data (ADB)
       ↓
Launch App Fresh (Appium)
       ↓
Wait 10 seconds for Stability
       ↓
For Each Step in Flow:
  ├─ Parse Action Type
  ├─ Execute via Appium
  ├─ Capture Screenshot
  ├─ Mark Pass/Fail
  └─ Continue or Stop
       ↓
Aggregate Results
       ↓
Return {total_steps, successful_steps, failed_steps}
       ↓
Display Results Alert
```

---

## 3. FRONTEND COMPONENTS DETAIL {#frontend}

### 3.1 App.tsx - Main Application

**Purpose:** Root component, routing, and navigation

**Key Features:**
- Tab-based navigation (7 main tabs)
- Active tab state management
- Theme configuration
- Global layouts

**Code Structure:**
```typescript
function App() {
  const [activeTab, setActiveTab] = useState('devices')
  const [devices, setDevices] = useState([])
  
  // Tab components mapping
  const renderTab = () => {
    switch(activeTab) {
      case 'devices': return <DeviceManager />
      case 'inspector': return <AutomationWizard />
      case 'editor': return <CodeEditor />
      case 'flows': return <Flows />
      case 'test-management': return <TestManagement />
      case 'tests': return <Tests />
      case 'api': return <ApiTesting />
    }
  }
  
  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>{renderTab()}</main>
    </div>
  )
}
```

### 3.2 AutomationWizard.tsx - Mobile Testing Core

**Purpose:** Step-by-step flow recording interface

**File Size:** 3,190 lines
**State Variables:** 30+
**Key Functions:** 15+

**Seven-Step Wizard:**

**STEP 1: Device Selection**
```typescript
State: selectedDevice, devices[]
API: GET /api/devices/
Flow:
1. Fetch connected devices on mount
2. Display in dropdown
3. User selects device
4. Validate connection
5. Proceed to Step 2
```

**STEP 2: APK Upload**
```typescript
State: apkFile, apkInfo, uploadProgress
API: POST /api/inspector/analyze-apk
Flow:
1. User selects .apk file
2. Upload with progress tracking
3. Backend analyzes APK metadata
4. Extract: package, version, main activity
5. Store in apkInfo state
6. Proceed to Step 3
```

**STEP 3: APK Installation**
```typescript
State: isInstalling, installProgress
API: POST /api/devices/{device_id}/install-apk
Flow:
1. Create FormData with APK
2. POST with multipart/form-data
3. Backend uses ADB to install
4. Track progress (0-100%)
5. Show success message
6. Proceed to Step 4
```

**STEP 4: App Launch**
```typescript
State: sessionActive, screenshot
API: POST /api/inspector/start-session
Flow:
1. Send device + app details
2. Backend creates Appium session
3. Launch app on device  
4. Wait 3 seconds
5. Capture first screenshot
6. Display in UI
7. Proceed to Step 5
```

**STEP 5: Recording Actions**
```typescript
State: isRecording, actions[], recordingMode
APIs:
- POST /api/inspector/start-mobile-monitoring
- POST /api/inspector/tap-coordinate
- POST /api/inspector/swipe
- WS ws://localhost:8000/ws/realtime

Three Recording Modes:

A. Desktop Mode (Click on Screenshot):
   - User clicks on screenshot
   - Calculate real coordinates (scale)
   - Send to backend
   - Execute on device
   - Add to actions array

B. Mobile Mode (Tap on Device):
   - WebSocket monitors device
   - Captures native touch events
   - Broadcasts via WebSocket
   - Frontend receives & adds to actions
   - Shows [Mobile 📱] tag

C. Inspector Mode (Element Inspection):
   - Hover shows element info
   - Click to select element
   - Adds metadata (class, text, id)
   - Better for reliable selectors

Actions Supported:
- Tap (x, y)
- Swipe (start_x, start_y, end_x, end_y)
- Type Text (element, text)
- Wait (duration)
- Long Press (x, y, duration)
```

**STEP 6: Save Flow**
```typescript
State: flowName, savedFlowId
API: POST /api/flows/
Flow:
1. User enters flow name
2. Validate (not empty)
3. Create flow object:
   {
     name, description, steps,
     device_id, device_name, device_platform,
     app_package, app_name, app_version, app_activity
   }
4. POST to backend
5. Backend saves to database
6. ✨ AUTO-SYNC: Create TestCase in localStorage
7. Return flow_id
8. Proceed to Step 7
```

**STEP 7: Playback**
```typescript
State: isPlaying, playbackProgress, playbackResults
API: POST /api/playback/start
Flow:
1. User clicks "Play"
2. Send {flow_id, device_id}
3. Backend executes all steps
4. Shows progress (optional)
5. Returns results
6. Display: X/Y steps passed
```

### 3.3 TestManagement.tsx - QA Suite

**Purpose:** Professional test management system

**File Size:** 1,650+ lines
**Components:** 15+
**Views:** 4 (Dashboard, Test Cases, Suites, History)

**Key Features:**

**A. Auto-Sync Integration:**
```typescript
// In AutomationWizard after saving flow:
const testCase = {
  id: flowId,
  name: flowName,
  type: 'mobile',
  status: 'ready',
  flowId: flowId,
  steps: actions,
  deviceInfo: {...},
  appInfo: {...},
  tags: ['synced', 'flow', appName]
}

localStorage.setItem('test_cases', JSON.stringify([
  ...existing,
  testCase
]))
```

**B. Run Flow Feature:**
```typescript
const handleRunFlow = async (testCase: TestCase) => {
  const res = await axios.post('/api/playback/start', {
    flow_id: parseInt(testCase.flowId),
    device_id: testCase.deviceInfo.id
  })
  
  alert(`Results: ${res.data.successful_steps}/${res.data.total_steps}`)
}
```

**C. Code Generation:**
```typescript
const handleConvertToCode = async (testCase: TestCase) => {
  const res = await axios.post('/api/codegen/generate', {
    actions: testCase.steps,
    language: 'python'
  })
  
  localStorage.setItem('generatedCode', res.data.code)
  window.dispatchEvent(new CustomEvent('openCodeEditor'))
}
```

**D. APK Regression Testing:**
```typescript
// Upload new APK
await axios.post(`/api/devices/${deviceId}/install-apk`, formData)

// Run same flow
const res = await axios.post('/api/playback/start', {
  flow_id: flowId,
  device_id: deviceId
})

// Compare results
```

### 3.4 CodeEditor.tsx - Code Generation Display

**Purpose:** View, edit, download generated test code

**Features:**
- Syntax highlighting
- Language selection (Python/Java/JS)
- Copy to clipboard
- Download as file
- Line numbers
- Dark theme

**Languages Supported:**
1. **Python + pytest + Appium**
2. **Java + TestNG + Appium**
3. **JavaScript + WebdriverIO**

---

## 4. BACKEND SYSTEMS DETAIL {#backend}

### 4.1 Main Application (main.py)

**Purpose:** FastAPI application entry point

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GravityQA API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Include routers
app.include_router(devices.router)
app.include_router(flows.router)
app.include_router(playback.router)
app.include_router(codegen.router)
app.include_router(inspector.router)
```

### 4.2 API Endpoints Documentation

**Devices API (`/api/devices/`):**
```python
GET    /api/devices/                    # List connected devices
GET    /api/devices/{device_id}         # Get device details
POST   /api/devices/{id}/install-apk    # Install APK on device
DELETE /api/devices/{id}/uninstall      # Uninstall app
```

**Flows API (`/api/flows/`):**
```python
POST   /api/flows/              # Create new flow
GET    /api/flows/              # List all flows
GET    /api/flows/{flow_id}     # Get flow details
PUT    /api/flows/{flow_id}     # Update flow
DELETE /api/flows/{flow_id}     # Delete flow
```

**Playback API (`/api/playback/`):**
```python
POST   /api/playback/start      # Execute flow
POST   /api/playback/stop       # Stop execution
GET    /api/playback/flows      # List playable flows
```

**Code Generation API (`/api/codegen/`):**
```python
POST   /api/codegen/generate    # Generate test code
Params: {actions: [], language: string}
Returns: {code: string}
```

**Inspector API (`/api/inspector/`):**
```python
POST   /api/inspector/analyze-apk           # Analyze APK file
POST   /api/inspector/start-session         # Start Appium session
POST   /api/inspector/tap-coordinate        # Execute tap
POST   /api/inspector/swipe                 # Execute swipe
GET    /api/inspector/screenshot            # Get screenshot
POST   /api/inspector/start-mobile-monitoring  # Enable touch capture
POST   /api/inspector/stop-mobile-monitoring   # Disable touch capture
GET    /api/inspector/element-at-position   # Get element at x,y
```

### 4.3 Appium Service (appium_service.py)

**Purpose:** Manage Appium sessionsand device interactions

**Key Methods:**
```python
class AppiumService:
    def __init__(self):
        self.appium_url = "http://localhost:4723"
        self.active_sessions = {}
    
    async def create_session(device_id, platform, app_package, app_activity):
        """Create new Appium session"""
        capabilities = {
            "platformName": platform,
            "deviceName": device_id,
            "appPackage": app_package,
            "appActivity": app_activity,
            "automationName": "UiAutomator2",
            "noReset": False,
            "fullReset": False
        }
        
        driver = webdriver.Remote(self.appium_url, capabilities)
        session_id = driver.session_id
        self.active_sessions[session_id] = driver
        return session_id
    
    async def execute_tap(session_id, x, y):
        """Execute tap at coordinates"""
        driver = self.active_sessions[session_id]
        action = TouchAction(driver)
        action.tap(x=x, y=y).perform()
    
    async def execute_swipe(session_id, start_x, start_y, end_x, end_y):
        """Execute swipe gesture"""
        driver = self.active_sessions[session_id]
        driver.swipe(start_x, start_y, end_x, end_y, duration=800)
    
    async def get_screenshot(session_id):
        """Capture device screenshot"""
        driver = self.active_sessions[session_id]
        screenshot_base64 = driver.get_screenshot_as_base64()
        return screenshot_base64
```

### 4.4 Playback Engine (playback_engine.py)

**Purpose:** Execute recorded flows with step-by-step execution

**Key Features:**
- Automatic app restart
- App data clearing for clean state
- Step execution with screenshots
- Error handling & recovery
- Progress updates via callback

**Execution Flow:**
```python
async def execute_flow(flow_data, session_id):
    steps = flow_data['steps']
    results = []
    
    for i, step in enumerate(steps):
        try:
            # Update progress
            broadcast_callback({
                'type': 'step_start',
                'step': i + 1,
                'total': len(steps)
            })
            
            # Execute based on action type
            if step['action'] == 'tap':
                await appium_service.execute_tap(session_id, step['x'], step['y'])
            elif step['action'] == 'swipe':
                await appium_service.execute_swipe(...)
            elif step['action'] == 'type':
                await appium_service.send_keys(...)
            
            # Capture screenshot
            screenshot = await appium_service.get_screenshot(session_id)
            
            results.append({
                'step': i + 1,
                'status': 'pass',
                'screenshot': screenshot
            })
            
        except Exception as e:
            results.append({
                'step': i + 1,
                'status': 'fail',
                'error': str(e)
            })
    
    return {
        'total_steps': len(steps),
        'successful_steps': sum(1 for r in results if r['status'] == 'pass'),
        'failed_steps': sum(1 for r in results if r['status'] == 'fail'),
        'results': results
    }
```

### 4.5 Code Generator (code_generator.py)

**Purpose:** Generate production-ready test code from recorded actions

**Supported Languages:**

**Python Example:**
```python
def generate_python_code(actions):
    code = """
import pytest
from appium import webdriver
from appium.webdriver.common.touch_action import TouchAction

class TestRecordedFlow:
    @pytest.fixture
    def driver(self):
        caps = {
            "platformName": "Android",
            "deviceName": "device_id",
            "appPackage": "com.example.app",
            "appActivity": ".MainActivity"
        }
        driver = webdriver.Remote('http://localhost:4723', caps)
        yield driver
        driver.quit()
    
    def test_flow(self, driver):
"""
    
    for action in actions:
        if action['action'] == 'tap':
            code += f"        # Tap at ({action['x']}, {action['y']})\n"
            code += f"        TouchAction(driver).tap(x={action['x']}, y={action['y']}).perform()\n"
        elif action['action'] == 'swipe':
            code += f"        # Swipe gesture\n"
            code += f"        driver.swipe({action['start_x']}, {action['start_y']}, "
            code += f"{action['end_x']}, {action['end_y']}, duration=800)\n"
    
    return code
```

---

## 5. DATABASE SCHEMA {#database}

### 5.1 Flow Model

```sql
CREATE TABLE flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    device_id VARCHAR(100) NOT NULL,
    device_name VARCHAR(255),
    device_platform VARCHAR(50),
    device_os_version VARCHAR(50),
    app_package VARCHAR(255) NOT NULL,
    app_name VARCHAR(255),
    app_version VARCHAR(50),
    app_activity VARCHAR(255),
    steps TEXT NOT NULL,  -- JSON stringified
    flow_metadata TEXT,   -- JSON stringified
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example Record:**
```json
{
  "id": 1,
  "name": "Login Flow Test",
  "description": "Automated test - 8 steps",
  "device_id": "ABC123XYZ",
  "device_name": "Samsung Galaxy S21",
  "device_platform": "Android",
  "device_os_version": "12",
  "app_package": "com.example.myapp",
  "app_name": "MyApp",
  "app_version": "1.2.3",
  "app_activity": ".MainActivity",
  "steps": "[{\"step\":1,\"action\":\"tap\",\"x\":540,\"y\":1200},{\"step\":2,\"action\":\"type\",\"text\":\"username\"}]",
  "flow_metadata": "{\"recorded_at\":\"2025-12-23T12:00:00\",\"total_steps\":8}",
  "created_at": "2025-12-23 12:00:00",
  "updated_at": "2025-12-23 12:00:00"
}
```

### 5.2 LocalStorage Schema (Frontend)

**test_cases:**
```json
[
  {
    "id": "1",
    "name": "Login Flow Test",
    "description": "Automated test - 8 steps",
    "type": "mobile",
    "status": "ready",
    "steps": [...],
    "createdAt": 1703334000000,
    "updatedAt": 1703334000000,
    "tags": ["synced", "flow", "MyApp"],
    "flowId": "1",
    "deviceInfo": {
      "name": "Samsung Galaxy S21",
      "id": "ABC123XYZ"
    },
    "appInfo": {
      "name": "MyApp",
      "package": "com.example.myapp",
      "version": "1.2.3"
    }
  }
]
```

---

## 6. COMPLETE USER WORKFLOWS {#workflows}

### 6.1 First-Time Setup Workflow

**Prerequisites:**
- macOS 11+
- Android device with USB debugging enabled
- USB cable
- Node.js 18+
- Python 3.11+
- Appium Server installed

**Step-by-Step:**

```bash
# Terminal 1: Start Backend
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa/backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa
npm run dev

# Terminal 3: Start Appium (if not auto-started)
appium
```

**Browser:**
```
Open: http://localhost:5173
```

### 6.2 Recording Your First Test Flow

**Complete End-to-End Example:**

**Scenario:** Test login functionality of a mobile app

```
STEP 1: PREPARATION
├─ Connect Android device via USB
├─ Enable USB Debugging on device
├─ Trust computer when prompted
├─ Verify connection: `adb devices`
└─ Expected: Device shows in "Devices" tab

STEP 2: NAVIGATE TO INSPECTOR
├─ Click "Inspector" tab in sidebar
├─ Wizard opens on Step 1: Device Selection
└─ See connected device in dropdown

STEP 3: SELECT DEVICE
├─ Click dropdown
├─ Select your device (e.g., "Samsung Galaxy S21 (ABC123XYZ)")
├─ Click "Next: Upload APK →"
└─ Wizard advances to Step 2

STEP 4: UPLOAD APK
├─ Click "Choose APK File"
├─ Navigate to your .apk file
├─ Select file (e.g., myapp-debug.apk)
├─ Wait for analysis (progress bar shows)
├─ See: "✓ MyApp v1.2.3 ready to install"
└─ Automatically proceeds to Step 3

STEP 5: INSTALL APP
├─ Click "Install App" button
├─ Watch progress (0% → 100%)
├─ See success message: "✅ Installation complete!"
└─ Automatically proceeds to Step 4

STEP 6: LAUNCH APP
├─ Click "Launch App" button
├─ App opens on your device
├─ Desktop shows "🚀 Launching app..."
├─ Wait 3 seconds
├─ Screenshot appears showing app screen
├─ Status: "✅ App launched! Start recording."
└─ Wizard advances to Step 5

STEP 7: START RECORDING
├─ Click "🔴 Start Recording" button
├─ Status changes to: "🔴 Recording... Tap on screen OR phone"
├─ Screenshot becomes clickable
└─ Ready to record actions

STEP 8: RECORD ACTIONS (Example: Login)
├─ ACTION 1: Tap username field
│   ├─ Click on username input in screenshot
│   │   OR tap on actual device
│   ├─ Action recorded: "Tap at (540, 1200)"
│   └─ Shows in actions list: "1. Tap at (540, 1200) [Desktop]"
│
├─ ACTION 2: Wait for keyboard
│   ├─ App shows keyboard
│   ├─ Wait 2 seconds naturally
│   └─ (No explicit wait action needed)
│
├─ ACTION 3: Type username
│   ├─ Type on device keyboard: "testuser"
│   ├─ System captures: Enter text "testuser"
│   └─ Shows: "2. Enter text 'testuser' [Mobile 📱]"
│
├─ ACTION 4: Tap password field
│   ├─ Click password field in screenshot
│   ├─ Recorded: "Tap at (540, 1400)"
│   └─ Shows: "3. Tap at (540, 1400)"
│
├─ ACTION 5: Type password
│   ├─ Type: "SecurePass123"
│   └─ Shows: "4. Enter text 'SecurePass123'"
│
├─ ACTION 6: Tap login button
│   ├─ Click login button in screenshot
│   ├─ Recorded: "Tap at (540, 1800)"
│   └─ Shows: "5. Tap at (540, 1800)"
│
└─ ACTION 7: Wait for dashboard
    ├─ App navigates to home screen
    └─ Total: 7 actions recorded

STEP 9: STOP RECORDING
├─ Click "⏸️ Stop Recording" button
├─ Status: "⏸️ Recording stopped. 7 actions captured."
├─ Review actions list
└─ Wizard advances to Step 6

STEP 10: SAVE FLOW
├─ Enter flow name: "Login Test"
├─ Click "💾 Save Flow" button
├─ Shows: "Saving test flow..."
├─ Backend saves to database
├─ ✨ AUTO-SYNC creates test case in Test Management
├─ Success: "✅ Test 'Login Test' saved & synced to Test Management!"
└─ Wizard advances to Step 7

STEP 11: (OPTIONAL) IMMEDIATE PLAYBACK
├─ Click "▶️ Play Recorded Flow" button
├─ Shows: "🎬 Starting playback..."
├─ App restarts automatically
├─ All 7 actions replay on device
├─ Shows results: "✅ Playback completed! 7/7 steps successful"
└─ Flow execution verified!

STEP 12: VIEW IN TEST MANAGEMENT
├─ Click "Test Management" tab in sidebar
├─ Go to "Test Cases" view
├─ See "Login Test" with:
│   ├─ 🔄 SYNCED badge
│   ├─ Device: Samsung Galaxy S21
│   ├─ App: MyApp v1.2.3
│   └─ Tags: #synced #flow #MyApp
├─ Card shows 5 buttons:
│   ├─ ▶️ Run - Execute flow
│   ├─ 💻 Code - Generate code
│   ├─ 📦 APK - Test new version
│   ├─ ✏️ Edit - Edit details
│   └─ 🗑️ Delete - Remove
└─ Flow ready for management!
```

**Total Time:** 5-10 minutes for first flow!

### 6.3 Running Tests from Test Management

```
SCENARIO: Execute saved flow

STEP 1: Navigate to Test Management
├─ Click "Test Management" tab
└─ Click "Test Cases" sub-tab

STEP 2: Find Your Flow
├─ Use search: Type "Login"
│   OR
├─ Use filters: Select "Mobile" type
└─ Find "Login Test" card

STEP 3: Execute Flow
├─ Click "▶️ Run" button on card
├─ Button changes to: "⏳ Running..."
├─ Backend:
│   ├─ Closes any existing sessions
│   ├─ Force stops app
│   ├─ Clears app data
│   ├─ Launches app fresh
│   ├─ Waits 10 seconds for stability
│   └─ Executes all 7 steps
├─ Watch device as test runs
└─ Wait for completion

STEP 4: View Results
├─ Alert appears:
│   ┌─────────────────────────────────────┐
│   │ ✅ Flow Execution Complete!         │
│   │                                     │
│   │ Flow: Login Test                    │
│   │ Device: Samsung Galaxy S21          │
│   │                                     │
│   │ 📊 Results:                         │
│   │ Total Steps: 7                      │
│   │ ✅ Passed: 7                         │
│   │ ❌ Failed: 0                         │
│   │                                     │
│   │ [OK]                                │
│   └─────────────────────────────────────┘
└─ Click OK to dismiss

STEP 5: (Optional) Run Again
├─ Click "▶️ Run" again
└─ Tests can be run unlimited times!
```

### 6.4 Generating Test Code

```
SCENARIO: Convert flow to Python code

STEP 1: Navigate to Flow
├─ Test Management → Test Cases
└─ Find "Login Test"

STEP 2: Generate Code
├─ Click "💻 Code" button
├─ Shows: Generating code...
├─ Backend creates Python code
├─ Saves to localStorage
├─ Dispatches event to open Code Editor
└─ Alert: "✅ Code generated! Opening in editor..."

STEP 3: Code Editor Opens
├─ Automatically switches to "Code Editor" tab
├─ Shows generated Python code:
│   ```python
│   import pytest
│   from appium import webdriver
│   
│   class TestLoginTest:
│       def test_flow(self):
│           driver = webdriver.Remote(...)
│           # Step 1: Tap username field
│           TouchAction(driver).tap(x=540, y=1200).perform()
│           # Step 2: Type username
│           driver.send_keys("testuser")
│           ...
│   ```
└─ Syntax highlighted with line numbers

STEP 4: Copy or Download
├─ Option A: Click "Copy Code" → Copied to clipboard
├─ Option B: Click "Download" → Saves as login_test.py
└─ Ready to use in your CI/CD pipeline!
```

### 6.5 Regression Testing with New APK

```
SCENARIO: Test new app version with saved flow

STEP 1: Get New APK
├─ Developer releases myapp-debug-v1.3.0.apk
└─ You need to verify login still works

STEP 2: Navigate to Test
├─ Test Management → Test Cases
└─ Find "Login Test"

STEP 3: Upload New APK
├─ Click "📦 APK" button
├─ Modal opens: "📦 Test with New APK"
├─ Shows current version: MyApp v1.2.3
├─ Click "Select New APK"
├─ Choose: myapp-debug-v1.3.0.apk
├─ Shows: "✓ myapp-debug-v1.3.0.apk"
└─ Click "🚀 Install & Run Test"

STEP 4: Automated Testing
├─ Status: "📦 Uploading APK..."
├─ APK uploads to backend
├─ Backend installs new version
├─ Status: "✅ APK installed! Running regression test..."
├─ Executes all 7 steps from "Login Test"
├─ Captures results
└─ Completes execution

STEP 5: View Regression Results
├─ Alert shows:
│   ┌──────────────────────────────────────────┐
│   │ ✅ Regression Test Complete!             │
│   │                                          │
│   │ Original: MyApp v1.2.3                   │
│   │ New APK: myapp-debug-v1.3.0.apk          │
│   │                                          │
│   │ 📊 Test Results:                         │
│   │ Total Steps: 7                           │
│   │ ✅ Passed: 7                              │
│   │ ❌ Failed: 0                              │
│   │                                          │
│   │ ✅ No regressions detected!              │
│   │ Safe to release!                         │
│   │                                          │
│   │ [OK]                                     │
│   └──────────────────────────────────────────┘
└─ Decision: Safe to deploy v1.3.0!

ALTERNATIVE: If failures detected
├─ Alert shows:
│   ┌──────────────────────────────────────────┐
│   │ ⚠️ Regression Test Complete              │
│   │                                          │
│   │ ✅ Passed: 5                              │
│   │ ❌ Failed: 2                              │
│   │                                          │
│   │ ⚠️ Regressions found!                    │
│   │ - Step 3: Tap at (540, 1400) - Timeout  │
│   │ - Step 6: Tap at (540, 1800) - Not found│
│   │                                          │
│   │ Review and fix before release!           │
│   └──────────────────────────────────────────┘
└─ Decision: Don't release, fix bugs first!
```

---

## 7. TROUBLESHOOTING {#troubleshooting}

### Common Issues & Solutions

**Issue 1: Device Not Detected**
```
Symptom: No devices show in "Devices" tab
Solution:
1. Check USB cable is data cable (not just charging)
2. Enable USB Debugging: Settings → Developer Options → USB Debugging
3. Trust computer when prompted on device
4. Run: adb devices (should show device)
5. Restart backend server
6. Refresh frontend
```

**Issue 2: APK Installation Fails**
```
Symptom: "❌ Installation failed"
Solution:
1. Ensure APK is valid Android package
2. Check device has enough storage
3. Uninstall existing version first
4. Check ADB permissions: adb shell pm list packages
5. Try manual install: adb install -r myapp.apk
```

**Issue 3: App Launch Fails**
```
Symptom: App doesn't open after clicking "Launch"
Solution:
1. Verify app is installed: Check device app drawer
2. Check app activity is correct in APK info
3. Try manual launch: adb shell am start -n com.example.app/.MainActivity
4. Check Appium logs for errors
5. Restart Appium server
```

**Issue 4: Recording Not Capturing Taps**
```
Symptom: Click on screenshot doesn't record action
Solution:
1. Ensure "Start Recording" button was clicked
2. Check recording mode (desktop/mobile/inspector)
3. Verify Appium session is active
4. Check browser console for errors
5. Restart session: Stop → Re-launch app
```

**Issue 5: Auto-Sync Not Working**
```
Symptom: Flow saved but doesn't appear in Test Management
Solution:
1. Check browser console for errors
2. Verify localStorage is not full
3. Open DevTools → Application → LocalStorage → Check test_cases
4. Manually refresh Test Cases view
5. Re-save flow from Inspector
```

**Issue 6: Playback Fails**
```
Symptom: "❌ Playback failed" error
Solution:
1. Ensure device is still connected
2. Check app is installed
3. Verify flow steps are valid
4. Try running with fresh app install
5. Check backend logs for errors
6. Reduce playback speed (if option available)
```

---

This documentation file is comprehensive but split into sections for easier navigation. Would you like me to continue with additional sections (API details, development guide, etc.)?
