# 🚀 PHASE 3: PLAYBACK INTELLIGENCE - IMPLEMENTATION PLAN

## 📅 Started: 2025-12-24, 00:00 PKT

---

## 🎯 **OVERVIEW:**

Phase 3 makes test execution intelligent with:
- ⚙️ Configurable playback settings
- 🔄 Automatic retry logic
- 📊 Enhanced result tracking (Pass/Fail/Flaky/Blocked/Skipped)
- 🛡️ Failure handling strategies

---

## 📋 **TASKS BREAKDOWN:**

### **Task 3.1: Playback Settings Modal** (2 days)
**Goal:** Pre-execution configuration UI

**Features:**
- [ ] Settings modal UI (trigger: "▶️ Run" button)
- [ ] Restart App toggle
- [ ] Clear Data toggle
- [ ] Retry Per Step (0-3)
- [ ] Failure Behaviour (Stop/Skip/Continue)
- [ ] Capture Screenshots toggle
- [ ] Run/Cancel buttons

**Files:**
- `AutomationWizard.tsx` - Add modal + UI
- State already added ✅

**Estimated:** 150-200 lines

---

### **Task 3.2: Runtime Failure Handling** (2-3 days)
**Goal:** Smart failure recovery during execution

**Features:**
- [ ] Retry failed steps (up to retryPerStep count)
- [ ] Track retry attempts per step
- [ ] Skip step on failure (if behaviour = 'skip')
- [ ] Continue execution (if behaviour = 'continue')
- [ ] Stop execution (if behaviour = 'stop')

**Files:**
- Backend: `playback_engine.py` - Update execution logic
- Frontend: Display retry status

**Estimated:** Backend 100-150 lines, Frontend 50 lines

---

### **Task 3.3: Enhanced Result Types** (2 days)
**Goal:** Rich result classification

**Result Types:**
- ✅ **Pass** - Step succeeded first try
- ❌ **Fail** - Step failed after all retries
- ⚠️ **Flaky** - Step passed after 1+ retries
- 🚫 **Blocked** - Step couldn't run (dependency failed)
- ⏭️ **Skipped** - Step skipped due to failure behaviour

**Implementation:**
- [ ] Update result display in Test Management
- [ ] Update execution results UI
- [ ] Add result badges/icons
- [ ] Color coding (green/red/yellow/gray/blue)

**Files:**
- `TestManagement.tsx` - Result display
- `AutomationWizard.tsx` - Playback results

**Estimated:** 100-150 lines

---

## 🔧 **TECHNICAL APPROACH:**

### **Frontend (AutomationWizard.tsx):**
1. Add playback settings state ✅
2. Create PlaybackSettingsModal component
3. Trigger modal before execution
4. Pass settings to backend API
5. Display enhanced results

### **Backend (playback_engine.py):**
1. Accept settings in /api/playback/start
2. Implement retry logic per step
3. Handle failure behaviors
4. Return detailed results with:
   - Step-by-step status
   - Retry counts
   - Result types
   - Screenshots

---

## 📊 **ESTIMATED TIMELINE:**

| Task | Duration | Lines | Status |
|------|----------|-------|--------|
| 3.1: Settings Modal | 2 days | 200 | 🔄 In Progress |
| 3.2: Failure Handling | 2-3 days | 200 | ⏳ Pending |
| 3.3: Enhanced Results | 2 days | 150 | ⏳ Pending |
| **TOTAL** | **6-7 days** | **~550** | **5% Done** |

---

## ✅ **PROGRESS:**

**Completed:**
- [x] State variables added (playbackSettings, showPlaybackSettings)

**Next:**
- [ ] Create PlaybackSettingsModal component
- [ ] Add "Run with Settings" button
- [ ] Implement modal UI
- [ ] Pass settings to backend

---

## 🎨 **UI MOCKUPS:**

### **Playback Settings Modal:**
```
┌──────────────────────────────────────────┐
│ ⚙️ Playback Settings                     │
│ Configure how this test will run         │
├──────────────────────────────────────────┤
│                                           │
│ App Preparation:                          │
│ [x] Restart app before test              │
│ [ ] Clear app data                        │
│                                           │
│ Failure Handling:                         │
│ Retry per step: [1] (0-3)                │
│ On failure: [Stop Execution ▼]           │
│   • Stop Execution                        │
│   • Skip Step & Continue                  │
│   • Continue Anyway                       │
│                                           │
│ Screenshots:                              │
│ [x] Capture screenshots                   │
│                                           │
│          [Cancel] [▶️ Run Test]           │
└──────────────────────────────────────────┘
```

### **Enhanced Results:**
```
Step 1: ✅ PASS (120ms)
Step 2: ⚠️ FLAKY (passed after 2 retries, 450ms)
Step 3: ❌ FAIL (3 retries, all failed, 890ms)
Step 4: 🚫 BLOCKED (dependency failed)
Step 5: ⏭️ SKIPPED (failure behavior: skip)
```

---

**Status: Task 3.1 starting now!** 🚀
