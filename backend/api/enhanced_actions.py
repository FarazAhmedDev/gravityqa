"""Enhanced Actions API - Type Text, Wait, Assert"""
from fastapi import APIRouter, HTTPException
from typing import Dict
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import base64
from datetime import datetime
import os

router = APIRouter(prefix="/api/actions", tags=["actions"])

# Import driver manager (assumes you have this)
from utils.appium_driver import get_driver

@router.post("/type-text")
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
    try:
        device_id = request.get('device_id')
        element_data = request.get('element', {})
        selector = element_data.get('selector', {})
        text = request.get('text', '')
        clear_before = request.get('clearBeforeType', False)
        press_enter = request.get('pressEnter', False)
        
        if not selector or not selector.get('value'):
            raise HTTPException(status_code=400, detail="No selector provided")
        
        print(f"[TypeText] device={device_id}, text='{text}', clear={clear_before}, enter={press_enter}")
        
        # Get driver
        driver = get_driver(device_id)
        if not driver:
            raise HTTPException(status_code=500, detail="Driver not initialized")
        
        # Find element
        strategy = selector.get('strategy', 'xpath')
        value = selector.get('value')
        
        if strategy == 'id':
            elem = driver.find_element(AppiumBy.ID, value)
        else:
            elem = driver.find_element(AppiumBy.XPATH, value)
        
        # Clear if needed
        if clear_before:
            elem.clear()
            print(f"[TypeText] ✓ Cleared element")
        
        # Type text
        elem.send_keys(text)
        print(f"[TypeText] ✓ Typed: '{text}'")
        
        # Press enter if needed
        if press_enter:
            elem.send_keys('\n')
            print(f"[TypeText] ✓ Pressed Enter")
        
        return {
            "success": True,
            "message": f"Typed '{text}' into element"
        }
        
    except Exception as e:
        print(f"[TypeText] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/wait-for-element")
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
    try:
        device_id = request.get('device_id')
        element_data = request.get('element', {})
        selector = element_data.get('selector', {})
        wait_type = request.get('waitType', 'visible')
        timeout_sec = request.get('timeoutSec', 10)
        
        if not selector or not selector.get('value'):
            raise HTTPException(status_code=400, detail="No selector provided")
        
        print(f"[WaitFor] device={device_id}, type={wait_type}, timeout={timeout_sec}s")
        
        driver = get_driver(device_id)
        if not driver:
            raise HTTPException(status_code=500, detail="Driver not initialized")
        
        # Create locator
        strategy = selector.get('strategy', 'xpath')
        value = selector.get('value')
        
        if strategy == 'id':
            locator = (AppiumBy.ID, value)
        else:
            locator = (AppiumBy.XPATH, value)
        
        # Wait
        wait = WebDriverWait(driver, timeout_sec)
        
        if wait_type == 'visible':
            element = wait.until(EC.visibility_of_element_located(locator))
            print(f"[WaitFor] ✓ Element visible")
        else:  # clickable
            element = wait.until(EC.element_to_be_clickable(locator))
            print(f"[WaitFor] ✓ Element clickable")
        
        return {
            "success": True,
            "found": True,
            "message": f"Element is {wait_type}"
        }
    
    except TimeoutException:
        print(f"[WaitFor] ❌ Timeout after {timeout_sec}s")
        return {
            "success": False,
            "error": f"Element not {wait_type} after {timeout_sec}s"
        }
    except Exception as e:
        print(f"[WaitFor] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assert-element")
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
    try:
        device_id = request.get('device_id')
        element_data = request.get('element', {})
        selector = element_data.get('selector', {})
        assert_type = request.get('assertType', 'visible')
        expected_text = request.get('expectedText', '')
        timeout_sec = request.get('timeoutSec', 10)
        
        if not selector or not selector.get('value'):
            raise HTTPException(status_code=400, detail="No selector provided")
        
        print(f"[Assert] device={device_id}, type={assert_type}, timeout={timeout_sec}s")
        
        driver = get_driver(device_id)
        if not driver:
            raise HTTPException(status_code=500, detail="Driver not initialized")
        
        # Create locator
        strategy = selector.get('strategy', 'xpath')
        value = selector.get('value')
        
        if strategy == 'id':
            locator = (AppiumBy.ID, value)
        else:
            locator = (AppiumBy.XPATH, value)
        
        wait = WebDriverWait(driver, timeout_sec)
        
        if assert_type == 'visible':
            element = wait.until(EC.visibility_of_element_located(locator))
            print(f"[Assert] ✓ Element is visible")
            return {
                "success": True,
                "assertion": "passed",
                "message": "Element is visible"
            }
        
        elif assert_type == 'text':
            element = wait.until(EC.visibility_of_element_located(locator))
            actual_text = element.text
            
            print(f"[Assert] Expected: '{expected_text}', Actual: '{actual_text}'")
            
            if actual_text == expected_text:
                print(f"[Assert] ✓ Text matches")
                return {
                    "success": True,
                    "assertion": "passed",
                    "message": f"Text matches: '{expected_text}'"
                }
            else:
                print(f"[Assert] ❌ Text mismatch")
                return {
                    "success": False,
                    "assertion": "failed",
                    "error": f"Expected '{expected_text}' but got '{actual_text}'"
                }
    
    except TimeoutException:
        print(f"[Assert] ❌ Element not visible within {timeout_sec}s")
        return {
            "success": False,
            "assertion": "failed",
            "error": f"Element not visible after {timeout_sec}s"
        }
    except Exception as e:
        print(f"[Assert] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/capture-failure-screenshot/{device_id}")
async def capture_failure_screenshot(device_id: str):
    """Capture screenshot for test failure evidence"""
    try:
        print(f"[Screenshot] Capturing failure screenshot for device: {device_id}")
        
        driver = get_driver(device_id)
        if not driver:
            raise HTTPException(status_code=500, detail="Driver not initialized")
        
        # Take screenshot
        screenshot_base64 = driver.get_screenshot_as_base64()
        
        # Save to file
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"failure_{device_id}_{timestamp}.png"
        
        # Create directory if not exists
        os.makedirs("screenshots/failures", exist_ok=True)
        filepath = f"screenshots/failures/{filename}"
        
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(screenshot_base64))
        
        print(f"[Screenshot] ✓ Saved to: {filepath}")
        
        return {
            "success": True,
            "filepath": filepath,
            "screenshot": screenshot_base64
        }
    
    except Exception as e:
        print(f"[Screenshot] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
