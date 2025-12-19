# 🎉 GravityQA - Complete User Guide

## ✅ What's Working - FULL APPLICATION

### Core Features
1. ✅ **Device Management** - Real-time device detection and status
2. ✅ **APK Installation** - Upload, install, extract real package info
3. ✅ **App Launch** - Start Appium session and launch app
4. ✅ **Screen Recording** - Click on live device screen to record
5. ✅ **Flow Saving** - Save to database + download Python file
6. ✅ **Flow Playback** - Replay saved flows on any device
7. ✅ **Flow Management** - List, view, delete saved flows

---

## 📱 Complete Workflow

### Step 1: Connect Device
1. Open http://localhost:5173
2. Click **"Devices"** tab (📱)
3. Your connected device appears automatically
4. Green dot = Connected
5. Red dot = Disconnected

### Step 2: Record New Test
1. Click **"Inspector"** tab (🔍)
2. Select device from dropdown
3. Click **"📁 Select APK"** → choose your APK file
4. Click **"📲 Install"** → waits for installation
5. Click **"🚀 Launch App"** → app opens on phone
6. Click **"🔴 Start Recording"**
7. **Click directly on the phone screenshot** to record taps
8. Each click:
   - Taps on real device
   - Screenshot refreshes
   - Action recorded with screenshot
9. Click **"⏹️ Stop Recording"** when done
10. Click **"💾 Save Test"**
11. Enter flow name (e.g., "Login Test")
12. ✅ Flow saved to database + Python file downloaded!

### Step 3: View Saved Flows
1. Click **"Flows"** tab (📂)
2. See all saved flows
3. Click any flow to view details
4. See:
   - Flow name and description
   - Device and app info
   - All steps with descriptions
   - Created timestamp

### Step 4: Replay Flow
1. In **"Flows"** tab, select a flow
2. Select target device from dropdown
3. Click **"▶️ Play Flow"**
4. Watch it execute automatically!
5. See success rate and results

---

## 🎯 Tab-by-Tab Guide

### 📱 Devices Tab
- **Purpose:** View connected devices
- **Features:**
  - Auto-detect USB devices
  - Real-time connection status
  - Device details (name, model, OS)
  - Connection indicators
- **Actions:**
  - Click "Refresh Devices"
  - Select a device (highlighted in blue)

### 🔍 Inspector Tab
- **Purpose:** Record new test flows
- **Toolbar:**
  - Device dropdown
  - APK file selector
  - Install button
  - Launch button
  - Refresh screenshot
  - Start/Stop recording (turns red when active)
  - Save test
- **Main Area:**
  - Left: Live device screenshot (clickable)
  - Right: Recorded actions panel (shows when recording)
- **Recording:**
  - Red border = actively recording
  - Crosshair cursor = click to record
  - Each click captured with screenshot

### 💻 Editor Tab
- **Purpose:** Edit Python test code
- **Features:**
  - Monaco code editor
  - Syntax highlighting
  - Run test button
- **Use:** Edit generated code or write custom tests

### 📂 Flows Tab
- **Purpose:** Manage saved flows
- **Left Panel:**
  - List of all saved flows
  - Click to select
  - Delete button (🗑️)
- **Right Panel (when flow selected):**
  - Flow details
  - Device selector for playback
  - Play button
  - Steps list

### ▶️ Tests Tab
- **Purpose:** Advanced test management
- **Features:**
  - Start AI test
  - Batch execution
  - Test scheduling

### ✨ AI Tab
- **Purpose:** AI-powered testing
- **Features:**
  - AI status
  - Activity log
  - Smart suggestions

---

## 📁 Generated Files

### Python Test File
Location: Downloads folder  
Name: `{flow_name}.py`

Example:
```python
"""
GravityQA Auto-Generated Test
App: MyApp
Package: com.example.myapp
Device: Google Pixel 5a
Steps: 5
Generated: 12/17/2025, 1:00:00 PM
"""

from appium import webdriver
import time

caps = {
    "platformName": "Android",
    "deviceName": "17301JECB05706",
    "automationName": "UiAutomator2",
    "appPackage": "com.example.myapp",
    "appActivity": ".MainActivity",
    "noReset": True
}

driver = webdriver.Remote("http://localhost:4723", caps)
time.sleep(2)

try:
    # Step 1: Tap at (540, 960)
    driver.tap([(540, 960)])
    time.sleep(1)

    # Step 2: Tap at (540, 1200)
    driver.tap([(540, 1200)])
    time.sleep(1)

    print("✅ Test completed successfully!")
    
except Exception as e:
    print(f"❌ Test failed: {e}")
    
finally:
    driver.quit()
```

### Database Storage
Flows are also saved in SQLite database at:
`backend/gravityqa.db`

Table: `flows`  
Fields:
- name, description
- device info
- app info
- steps (JSON array)
- timestamps

---

## 🔧 Troubleshooting

### Device Not Showing
1. Check USB cable connected
2. Enable USB debugging on device
3. Accept "Allow USB debugging" prompt on device
4. Run: `adb devices` in terminal
5. Click "Refresh Devices" in app

### APK Install Failed
1. Check APK file is valid
2. Ensure device has enough storage
3. Try uninstalling old version first
4. Check adb connection: `adb devices`

### App Won't Launch
1. Check package name is correct
2. Ensure Appium is running: http://localhost:4723
3. Restart Appium server
4. Try manual launch: `adb shell am start -n PACKAGE/.MainActivity`

### Recording Not Working
1. Ensure session is active (green status)
2. Check screenshot loaded
3. Click "Refresh" if screen frozen
4. Verify Appium connection

### Playback Failed
1. Ensure target device is connected
2. Check app is installed on device
3. Verify Appium is running
4. Try running Python file manually first

---

## 💡 Tips & Best Practices

### Recording Tips
- **Wait between taps:** Don't click too fast
- **Let screen load:** Wait for transitions
- **Clear actions:** Make deliberate taps
- **Name flows clearly:** Use descriptive names like "Login_Flow_v1"

### Flow Organization
- **Group by feature:** "Login", "Checkout", "Settings"
- **Version flows:** "Login_v1", "Login_v2"
- **Add descriptions:** Helps identify flows later

### Device Selector
- **Use same device:** Best results replaying on same device
- **Screen resolution:** Different devices may need coordinate adjustments
- **OS version:** Some features may vary by Android version

---

## 🚀 Advanced Usage

### Run Python File Manually
```bash
# Navigate to downloads
cd ~/Downloads

# Install Appium Python client (one time)
pip install Appium-Python-Client

# Run test
python login_test.py
```

### Custom Test Edits
1. Download Python file
2. Open in Editor tab or external IDE
3. Modify steps, add assertions
4. Add waits, loops, conditions
5. Save and run manually

### Batch Playback
1. Save multiple flows
2. Use Flows tab to run sequentially
3. Monitor success rates
4. Review failed steps

---

## 📊 Success Metrics

After playback, you'll see:
- **Total Steps:** Number of actions in flow
- **Successful Steps:** How many executed correctly
- **Success Rate:** Percentage (e.g., 95.5%)
- **Results:** Detailed step-by-step status

---

## 🎯 Complete Example: Login Test

1. **Inspector Tab:**
   - Select device: "Google Pixel 5a"
   - Upload: `myapp-release.apk`
   - Install → Launch
   - Start Recording
   - Tap username field
   - Tap password field
   - Tap login button
   - Stop Recording
   - Save as "Login_Test"

2. **Flows Tab:**
   - See "Login_Test" in list
   - Click to view (3 steps)
   - Select device
   - Click "Play Flow"
   - ✅ Success: 3/3 steps, 100% success rate

3. **Result:**
   - Python file in Downloads
   - Flow in database
   - Replayable anytime

---

## 📞 Quick Reference

| Action | Location | Shortcut |
|--------|----------|----------|
| View Devices | Devices Tab | First tab |
| Record Test | Inspector Tab | 🔍 icon |
| View Flows | Flows Tab | 📂 icon |
| Play Flow | Flows Tab | ▶️ button |
| Edit Code | Editor Tab | 💻 icon |
| Download File | Inspector → Save | Auto-downloads |

---

**ALL FEATURES WORKING! COMPLETE APPLICATION READY! 🎊**
