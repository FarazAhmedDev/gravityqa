# 🔍 Inspector Mode - Quick Test & Fix Guide

**Last Updated:** December 20, 2024 12:17 PM  
**Status:** Ready to test with proper setup

---

## ⚠️ ISSUE FOUND

**Problem:** Inspector hover nahi chal raha  
**Root Cause:** Appium server running nahi hai ya session nahi bana

---

## ✅ COMPLETE TEST FLOW (Step-by-Step)

### **Pre-Test Checklist:**

```bash
# 1. Check if app is running
ps aux | grep "npm start"  # Should show process

# 2. Check if Appium server accessible
curl http://localhost:4723/status  # Should return 200 OK

# 3. Check active sessions
curl http://localhost:4723/sessions  # Should show session list
```

---

## 🚀 PROPER TEST SEQUENCE

### **Step 1: Fresh Start (DO THIS FIRST!)**

```bash
# Kill everything
killall node
killall Electron

# Start fresh
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa
npm start
```

---

### **Step 2: In Desktop App**

```
1. Click "APPIUM" button (green)
   ✓ Wait for status to show "Server Running"
   ✓ Check terminal - should see "Appium server started"

2. Click "Next" → Device Selection
   ✓ Select your Android device
   ✓ Should show device ID

3. Click "Next" → APK Selection  
   ✓ Select Gupi.apk (or any installed app)
   ✓ App details should load

4. Click "Next" → Install
   ✓ Skip this (already installed)
   
5. Click "Next" → Launch
   ✓ Click "Launch App" button
   ✓ Device pe app khul jayegi
   ✓✓✓ CRITICAL: Wait for app to fully launch!

6. Click "Continue to Recording"
   ✓ Should go to recording screen
   ✓ Screenshot visible hona chahiye

7. Click "Start Recording" (RED button)
   ✓ Border RED ho jayega
   ✓ Screenshot refresh honi chahiye

8. Click "🔍 Inspector" button (PURPLE)
   ✓ Border PURPLE ho jayega
   ✓ Cursor pointer banega

9. Hover on Screenshot
   ✓ Kisi button/text pe hover karo
   ✓ Right side pe BLUE panel dikna chahiye
```

---

## 🔍 DEBUGGING IF NOT WORKING

### **Check 1: Browser Console (MOST IMPORTANT)**

Open Developer Tools (cmd+option+i):

```javascript
// Expected logs when hovering:
[Inspector] Hover at: 540 1236
[Inspector] API response: {found: true, element: {...}}

// If you see this - BAD:
[Inspector] API response: {found: false}

// If you see NOTHING - Handler not firing!
```

---

### **Check 2: Backend Terminal**

Look for these logs:

```python
# Good - means API being called:
[Inspector] 🎯 Search at (540,1236)
GET /api/inspector/element-at-position?x=540&y=1236

# Good - element found:
[Inspector] ✅ Found: Button, ID: com.app:id/login

# Bad - no session:
[Inspector] ❌ No active sessions!

# Bad - no element:
[Inspector] ❌ No element found at (540,1236)
```

---

### **Check 3: Network Tab**

In Developer Tools → Network:

```
Filter: element-at-position

Should see requests going out on hover
Status should be: 200 OK (green)
Response should have: found: true
```

---

## 🐛 COMMON ISSUES & FIXES

### **Issue 1: No API Calls When Hovering**

**Symptoms:**
- Hover on screenshot
- Nothing happens
- No logs in console
- No network requests

**Fix:**
```tsx
// Problem: recordingMode not 'inspector'
// Solution: Make sure Inspector button is clicked (purple border)

// OR: App reloaded and handler lost
// Solution: Hard reload (cmd+shift+R)
```

---

### **Issue 2: API Returns `found: false`**

**Symptoms:**
- API calls working
- Backend logs show search attempt
- But always returns `found: false`

**Fix:**
```python
# Problem: Coordinate mismatch or element not at that position
# Test with definitely valid coordinate:

curl "http://localhost:8000/api/inspector/element-at-position?x=540&y=1000"

# Should return found: true if session active
```

**Debug:**
```bash
# Get page source to see what's available
curl "http://localhost:8000/api/inspector/page-source" | python3 -m json.tool

# Look for elements with bounds containing your coordinates
```

---

### **Issue 3: No Active Session**

**Symptoms:**
```
[Inspector] ❌ No active sessions!
```

**Fix:**
```bash
# Check if Appium has any sessions
curl http://localhost:4723/sessions

# If empty - you need to launch app first!
# Go back to step 5 in test flow
```

---

### **Issue 4: Backend Not Responding**

**Symptoms:**
- Network requests timeout
- No backend logs

**Fix:**
```bash
# Restart backend
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --reload

# Check if running
curl http://localhost:8000/api/appium/status
```

---

## 📊 EXPECTED vs ACTUAL

### **When Working Correctly:**

**You hover on a button:**
```
Frontend Console:
  [Inspector] Hover at: 540 1236
  [Inspector] API response: {found: true, element: {class: "Button", resource_id: "com.app:id/login"...}}
  
Backend Terminal:
  [Inspector] 🎯 Search at (540,1236)
  [Inspector] ✅ Found: Button, ID: com.app:id/login_btn
  GET /api/inspector/element-at-position?x=540&y=1236 200 OK
  
UI:
  Blue "Selected Element" panel appears (right side)
  Shows: Class, Resource-ID, XPath, Text, Clickable
```

---

### **When NOT Working:**

**No hover response:**
```
Frontend Console: (empty)
Backend Terminal: (no API calls)
UI: Nothing happens
```

**Common reasons:**
1. Recording not started
2. Inspector mode not selected  
3. Session not active
4. Frontend code not loaded

---

## 🧪 QUICK API TEST (Manual)

### **Test if backend is working:**

```bash
# 1. Start app and get to recording screen
# 2. Open terminal and run:

# Check session exists:
curl http://localhost:4723/sessions

# Test element detection:
curl "http://localhost:8000/api/inspector/element-at-position?x=540&y=1000" | python3 -m json.tool

# Expected response:
{
  "found": true,
  "element": {
    "class": "android.widget.FrameLayout",
    "resource_id": "...",
    "xpath": "...",
    "bounds": {...}
  }
}
```

---

## 🎯 SUCCESS CHECKLIST

Mark ✓ when working:

- [ ] App launches successfully
- [ ] Appium server starts (green button)
- [ ] Device connects
- [ ] App installs/launches on device  
- [ ] Recording screen loads with screenshot
- [ ] Start Recording works (red border)
- [ ] Inspector button works (purple border)
- [ ] Console shows hover logs when moving mouse
- [ ] Backend shows API calls in terminal
- [ ] Blue panel appears on hover
- [ ] Panel shows element details (class, ID, xpath)

**If ALL checked ✓ → Inspector is WORKING! 🎉**

---

## 💡 PRO TIPS

### **Tip 1: Test with Simple Element**

Don't test on complex/small elements first. Test on:
- Large buttons
- Text fields with IDs
- Main content areas

### **Tip 2: Check Coordinates**

```javascript
// In browser console:
console.log('Image natural size:', document.querySelector('img[alt="Device Screen"]')?.naturalWidth)
console.log('Image display size:', document.querySelector('img[alt="Device Screen"]')?.width)

// Should be different! (scaling happening)
```

### **Tip 3: Verify Session ID**

```bash
# Get current session
curl http://localhost:4723/sessions | python3 -c "import sys,json; print(json.load(sys.stdin)['value'][0]['id'])"

# Use that session ID:
SESSION_ID="<paste here>"
curl "http://localhost:4723/session/$SESSION_ID/source" | head -100

# Should show XML
```

---

## 🔄 IF STILL NOT WORKING

### **Nuclear Option - Complete Reset:**

```bash
# 1. Stop everything
killall node
killall Electron
killall python3

# 2. Clean restart
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa

# 3. Backend fresh
cd backend
source venv/bin/activate
python3 -m uvicorn main:app --reload
# Keep this terminal open

# 4. New terminal - Frontend
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa
npm run dev:frontend
# Keep this terminal open

# 5. New terminal - Electron
cd /Users/developervativeapps/Desktop/APPIUM\ INSPECTOR\ /gravityqa
npm start

# Now test from Step 1 again
```

---

## 📞 REPORT FORMAT

**If still not working, report like this:**

```
ISSUE: Inspector hover not working

Browser Console Output:
<paste exactly what you see>

Backend Terminal Output:  
<paste last 20 lines>

What I tried:
1. Started app fresh
2. Launched app on device
3. Started recording
4. Clicked Inspector
5. Hovered on screenshot

What happened:
<describe exactly>

Screenshots attached: Yes/No
```

---

**Test karo and let me know! 🚀**
