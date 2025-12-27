# 🔧 PHASE 3 - BACKEND SPECIFICATION

## 📋 **TASK 3.2: RUNTIME FAILURE HANDLING - BACKEND IMPLEMENTATION**

**File:** `backend/services/mobile/playback_engine.py`

---

## 🎯 **OVERVIEW:**

Update the playback engine to:
1. Accept execution settings from frontend
2. Implement step-level retry logic
3. Handle failure behaviors (stop/skip/continue)
4. Return enhanced results with detailed statuses

---

## 📥 **API ENDPOINT UPDATE:**

### **POST `/api/playback/start`**

**Current Request:**
```json
{
  "flow_id": 123,
  "device_id": "emulator-5554"
}
```

**NEW Request (Phase 3):**
```json
{
  "flow_id": 123,
  "device_id": "emulator-5554",
  "settings": {
    "restartApp": true,
    "clearData": false,
    "retryPerStep": 1,
    "failureBehaviour": "stop",  // "stop" | "skip" | "continue"
    "captureScreenshots": true
  }
}
```

**NEW Response (Enhanced):**
```json
{
  "flow_id": 123,
  "total_steps": 5,
  "successful_steps": 3,
  "failed_steps": 1,
  "skipped_steps": 1,
  "status": "partial_success",  // "success" | "failed" | "partial_success"
  "duration_ms": 12450,
  "steps": [
    {
      "step": 1,
      "action": "tap",
      "status": "pass",  // "pass" | "fail" | "flaky" | "blocked" | "skipped"
      "attempts": 1,
      "duration_ms": 320,
      "error": null,
      "screenshot": "/path/to/step1.png"
    },
    {
      "step": 2,
      "action": "swipe",
      "status": "flaky",
      "attempts": 2,  // Passed on retry
      "duration_ms": 890,
      "error": "First attempt failed: Element not found",
      "screenshot": "/path/to/step2.png"
    },
    {
      "step": 3,
      "action": "tap",
      "status": "fail",
      "attempts": 2,  // Max retries exhausted
      "duration_ms": 1200,
      "error": "Element not clickable after 2 attempts",
      "screenshot": "/path/to/step3_fail.png"
    },
    {
      "step": 4,
      "action": "type",
      "status": "skipped",
      "attempts": 0,
      "duration_ms": 0,
      "error": "Previous step failed, skipped due to failureBehaviour=skip",
      "screenshot": null
    },
    {
      "step": 5,
      "action": "tap",
      "status": "blocked",
      "attempts": 0,
      "duration_ms": 0,
      "error": "Cannot execute, dependency failed",
      "screenshot": null
    }
  ]
}
```

---

## 🔧 **IMPLEMENTATION REQUIREMENTS:**

### **1. Accept Settings** (10 lines)
```python
def execute_flow(flow_id: int, device_id: str, settings: dict = None):
    """
    Execute a flow with optional settings
    
    Args:
        flow_id: ID of the flow to execute
        device_id: Connected device ID
        settings: Execution settings (Phase 3)
            - restartApp: bool (default True)
            - clearData: bool (default False)
            - retryPerStep: int (default 0, max 3)
            - failureBehaviour: str ("stop" | "skip" | "continue")
            - captureScreenshots: bool (default True)
    """
    # Set defaults
    settings = settings or {}
    restart_app = settings.get('restartApp', True)
    clear_data = settings.get('clearData', False)
    retry_per_step = min(settings.get('retryPerStep', 0), 3)
    failure_behaviour = settings.get('failureBehaviour', 'stop')
    capture_screenshots = settings.get('captureScreenshots', True)
```

### **2. App Preparation** (20 lines)
```python
    # Phase 3: App preparation
    if clear_data:
        logger.info(f"Clearing app data for {app_package}")
        driver.execute_script('mobile: clearApp', {'appId': app_package})
    
    if restart_app:
        logger.info(f"Restarting app: {app_package}")
        driver.terminate_app(app_package)
        time.sleep(1)
        driver.activate_app(app_package)
        time.sleep(2)  # Wait for app to stabilize
```

### **3. Step Execution with Retries** (80 lines)
```python
def execute_step_with_retry(step, driver, retry_count, capture_screenshots):
    """
    Execute a single step with retry logic
    
    Returns:
        {
            "status": "pass" | "fail" | "flaky",
            "attempts": int,
            "duration_ms": int,
            "error": str | None,
            "screenshot": str | None
        }
    """
    start_time = time.time()
    attempts = 0
    last_error = None
    screenshot_path = None
    
    for attempt in range(retry_count + 1):
        attempts += 1
        try:
            # Execute the action
            if step['action'] == 'tap':
                element = driver.find_element(
                    AppiumBy.XPATH,
                    f"//*[@bounds='{step['x']},{step['y']}']"
                )
                element.click()
            
            elif step['action'] == 'swipe':
                driver.swipe(
                    step['start_x'], step['start_y'],
                    step['end_x'], step['end_y'],
                    step.get('duration', 500)
                )
            
            elif step['action'] == 'type':
                element = driver.find_element(...)
                element.send_keys(step['text'])
            
            # Success!
            duration_ms = int((time.time() - start_time) * 1000)
            
            # Capture screenshot if enabled
            if capture_screenshots:
                screenshot_path = capture_step_screenshot(driver, step['step'], 'pass')
            
            # Determine status
            status = 'pass' if attempts == 1 else 'flaky'
            
            return {
                "status": status,
                "attempts": attempts,
                "duration_ms": duration_ms,
                "error": f"Passed on attempt {attempts}" if status == 'flaky' else None,
                "screenshot": screenshot_path
            }
            
        except Exception as e:
            last_error = str(e)
            logger.warning(f"Step {step['step']} attempt {attempts} failed: {last_error}")
            
            if attempt < retry_count:
                time.sleep(1)  # Wait before retry
                continue
            else:
                # All retries exhausted
                duration_ms = int((time.time() - start_time) * 1000)
                
                if capture_screenshots:
                    screenshot_path = capture_step_screenshot(driver, step['step'], 'fail')
                
                return {
                    "status": "fail",
                    "attempts": attempts,
                    "duration_ms": duration_ms,
                    "error": f"Failed after {attempts} attempts: {last_error}",
                    "screenshot": screenshot_path
                }
```

### **4. Failure Behavior Handling** (40 lines)
```python
    # Phase 3: Execute steps with failure handling
    results = []
    should_continue = True
    
    for idx, step in enumerate(steps):
        if not should_continue:
            # Previous step failed and failureBehaviour is 'stop'
            results.append({
                "step": step['step'],
                "action": step['action'],
                "status": "blocked",
                "attempts": 0,
                "duration_ms": 0,
                "error": "Cannot execute, previous step failed (stop behaviour)",
                "screenshot": None
            })
            continue
        
        # Execute step with retries
        result = execute_step_with_retry(
            step, driver, retry_per_step, capture_screenshots
        )
        result['step'] = step['step']
        result['action'] = step['action']
        results.append(result)
        
        # Handle failure
        if result['status'] in ['fail']:
            if failure_behaviour == 'stop':
                logger.info("Stopping execution due to failure (stop behaviour)")
                should_continue = False
            
            elif failure_behaviour == 'skip':
                logger.info("Skipping remaining steps due to failure (skip behaviour)")
                # Mark remaining as skipped
                for remaining_step in steps[idx + 1:]:
                    results.append({
                        "step": remaining_step['step'],
                        "action": remaining_step['action'],
                        "status": "skipped",
                        "attempts": 0,
                        "duration_ms": 0,
                        "error": "Skipped due to previous failure (skip behaviour)",
                        "screenshot": None
                    })
                break
            
            elif failure_behaviour == 'continue':
                logger.info("Continuing execution despite failure (continue  behaviour)")
                # Just continue to next step
                pass
```

### **5. Result Aggregation** (30 lines)
```python
    # Calculate summary
    total_steps = len(steps)
    pass_count = sum(1 for r in results if r['status'] == 'pass')
    flaky_count = sum(1 for r in results if r['status'] == 'flaky')
    fail_count = sum(1 for r in results if r['status'] == 'fail')
    skipped_count = sum(1 for r in results if r['status'] == 'skipped')
    blocked_count = sum(1 for r in results if r['status'] == 'blocked')
    
    successful_steps = pass_count + flaky_count
    failed_steps = fail_count
    
    # Overall status
    if failed_steps == 0 and skipped_count == 0 and blocked_count == 0:
        overall_status = "success"
    elif pass_count == 0 and flaky_count == 0:
        overall_status = "failed"
    else:
        overall_status = "partial_success"
    
    return {
        "flow_id": flow_id,
        "total_steps": total_steps,
        "successful_steps": successful_steps,
        "failed_steps": failed_steps,
        "skipped_steps": skipped_count,
        "blocked_steps": blocked_count,
        "status": overall_status,
        "duration_ms": int(total_duration * 1000),
        "steps": results
    }
```

---

## 📊 **CODE STATISTICS:**

| Component | Lines | Complexity |
|-----------|-------|------------|
| Accept Settings | 10 | Low |
| App Preparation | 20 | Low |
| Retry Logic | 80 | Medium |
| Failure Handling | 40 | Medium |
| Result Aggregation | 30 | Low |
| **TOTAL** | **~180** | **Medium** |

---

## 🧪 **TESTING CHECKLIST:**

- [ ] Test with `restartApp: true/false`
- [ ] Test with `clearData: true/false`
- [ ] Test with `retryPerStep: 0, 1, 2, 3`
- [ ] Test `failureBehaviour: stop`
- [ ] Test `failureBehaviour: skip`
- [ ] Test `failureBehaviour: continue`
- [ ] Verify screenshot capture
- [ ] Verify result statuses (pass/fail/flaky/blocked/skipped)
- [ ] Test with mixed scenarios

---

## 🚀 **IMPLEMENTATION PRIORITY:**

**High Priority:**
1. Accept settings parameter
2. Implement retry logic
3. Return enhanced results

**Medium Priority:**
4. App preparation (restart/clear data)
5. Failure behavior handling

**Low Priority:**
6. Screenshot capture enhancements

---

**Backend Specification: COMPLETE!** ✅

This document provides everything needed to implement Task 3.2 in the backend.
