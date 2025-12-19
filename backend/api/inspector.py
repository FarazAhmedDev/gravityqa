from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from pydantic import BaseModel
from services.mobile.appium_service import AppiumService
import base64

router = APIRouter(prefix="/api/inspector", tags=["inspector"])
appium_service = AppiumService()

class StartSessionRequest(BaseModel):
    device_id: str
    platform: str
    app_package: str = None
    app_activity: str = None

class TapElementRequest(BaseModel):
    xpath: str

class SendKeysRequest(BaseModel):
    xpath: str
    text: str

class TapCoordinateRequest(BaseModel):
    x: int
    y: int

@router.post("/start-session")
async def start_session(request: StartSessionRequest):
    """Start Appium session for device"""
    try:
        print(f"[StartSession] Creating session with:")
        print(f"  Device: {request.device_id}")
        print(f"  Platform: {request.platform}")  
        print(f"  Package: {request.app_package}")
        print(f"  Activity: {request.app_activity}")
        
        # Use new signature: device_id, platform, app_package, app_activity
        session_id = await appium_service.create_session(
            device_id=request.device_id,
            platform=request.platform,
            app_package=request.app_package,
            app_activity=request.app_activity
        )
        
        if session_id:
            print(f"[StartSession] ✅ Session created: {session_id}")
            return {"session_id": session_id, "message": "✅ Session started successfully"}
        else:
            print("[StartSession] ❌ Session creation returned None")
            raise HTTPException(status_code=500, detail="Failed to create session")
            
    except Exception as e:
        print(f"[StartSession] ❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/screenshot")
async def get_screenshot():
    """Capture screenshot from active session"""
    try:
        print(f"[DEBUG] Active sessions: {appium_service.active_sessions}")
        
        # Get the LATEST active session (newest one)
        if not appium_service.active_sessions:
            print("[ERROR] No active sessions found")
            raise HTTPException(status_code=400, detail="No active session")
        
        # Use LAST session (newest) instead of first (oldest)
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[DEBUG] Using LATEST session_id: {session_id}")
        
        screenshot_base64 = await appium_service.get_screenshot(session_id)
        print(f"[DEBUG] Screenshot captured, length: {len(screenshot_base64) if screenshot_base64 else 0}")
        
        return {"screenshot": screenshot_base64}
    except Exception as e:
        print(f"[ERROR] Screenshot failed: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/page-source")
async def get_page_source():
    """Get XML page source"""
    try:
        if not appium_service.active_sessions:
            raise HTTPException(status_code=400, detail="No active session")
        
        session_id = list(appium_service.active_sessions.keys())[0]
        page_source = await appium_service.get_page_source(session_id)
        return {"page_source": page_source}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tap")
async def tap_element(request: TapElementRequest):
    """Tap on element by XPath"""
    try:
        await appium_service.click_element(request.xpath)
        return {"message": "Element tapped successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tap-coordinate")
async def tap_coordinate(request: TapCoordinateRequest):
    """Tap at screen coordinates"""
    try:
        if not appium_service.active_sessions:
            print("[TAP] ❌ No active sessions!")
            raise HTTPException(status_code=400, detail="No active session")
        
        # Use LATEST session (same fix as screenshot)
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[TAP] Executing tap at ({request.x}, {request.y}) on session {session_id}")
        
        result = await appium_service.tap_at_coordinate(session_id, request.x, request.y)
        
        if result:
            print(f"[TAP] ✅ Tap executed successfully!")
            return {"message":f"Tapped at ({request.x}, {request.y})"}
        else:
            print(f"[TAP] ❌ Tap failed!")
            raise HTTPException(status_code=500, detail="Tap execution failed")
            
    except Exception as e:
        print(f"[TAP] ❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class SwipeRequest(BaseModel):
    start_x: int
    start_y: int
    end_x: int
    end_y: int
    duration: int = 500

@router.post("/swipe")
async def swipe(request: SwipeRequest):
    """Execute swipe gesture"""
    try:
        if not appium_service.active_sessions:
            print("[SWIPE] ❌ No active sessions!")
            raise HTTPException(status_code=400, detail="No active session")
        
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[SWIPE] Executing swipe from ({request.start_x},{request.start_y}) to ({request.end_x},{request.end_y})")
        
        result = await appium_service.swipe(
            session_id, 
            request.start_x, 
            request.start_y, 
            request.end_x, 
            request.end_y, 
            request.duration
        )
        
        if result:
            print(f"[SWIPE] ✅ Swipe executed!")
            return {"message": f"Swiped from ({request.start_x},{request.start_y}) to ({request.end_x},{request.end_y})"}
        else:
            raise HTTPException(status_code=500, detail="Swipe execution failed")
            
    except Exception as e:
        print(f"[SWIPE] ❌ Exception: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send-keys")
async def send_keys(request: SendKeysRequest):
    """Send text to element"""
    try:
        await appium_service.send_keys(request.xpath, request.text)
        return {"message": "Text sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/current-activity")
async def get_current_activity():
    """Get current app activity"""
    try:
        activity = await appium_service.get_current_activity()
        return {"activity": activity}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/back")
async def press_back():
    """Press back button"""
    try:
        await appium_service.press_back()
        return {"message": "Back pressed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/session")
async def end_session():
    """End current Appium session"""
    try:
        await appium_service.delete_session()
        return {"message": "Session ended"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Simple Mobile Monitoring - Just screen changes
from services.mobile import simple_mobile_monitor

class StartMonitoringRequest(BaseModel):
    device_id: str

@router.post("/start-mobile-monitoring")
async def start_mobile_monitoring(request: StartMonitoringRequest):
    """Start simple mobile monitoring - tracks screen changes"""
    try:
        from api.realtime import broadcast_mobile_action
        
        # Get LATEST active session
        if not appium_service.active_sessions:
            raise HTTPException(status_code=400, detail="No active Appium session")
            
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[SimpleMobileMonitor] Starting for session: {session_id}")
        
        def on_mobile_event(action: dict):
            print(f"[Mobile Event] {action['type']}: {action.get('description', '')}")
            broadcast_mobile_action(request.device_id, action)
        
        # DISABLED TO PREVENT CRASHES: simple_mobile_monitor.start_monitoring(
        # DISABLED TO PREVENT CRASHES: session_id=session_id,
        # DISABLED TO PREVENT CRASHES: appium_host=appium_service.host,
        # DISABLED TO PREVENT CRASHES: appium_port=appium_service.port,
        # DISABLED TO PREVENT CRASHES: callback=on_mobile_event
        # DISABLED TO PREVENT CRASHES: )
        
        return {"message": f"✅ Simple mobile monitoring started for {request.device_id}"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop-mobile-monitoring")
async def stop_mobile_monitoring(request: StartMonitoringRequest):
    """Stop mobile monitoring"""
    try:
        simple_mobile_monitor.stop_monitoring()
        return {"message": f"✅ Mobile monitoring stopped for {request.device_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# APK Upload and Install for Flow Testing
from fastapi import UploadFile, File
import tempfile
import os
import subprocess

@router.post("/upload-apk/")
async def upload_apk(file: UploadFile = File(...)):
    """Upload APK and get package info"""
    try:
        print(f"[APK Upload] Receiving APK: {file.filename}")
        
        # Save to temp directory
        temp_dir = tempfile.gettempdir()
        apk_path = os.path.join(temp_dir, file.filename)
        
        with open(apk_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"[APK Upload] Saved to: {apk_path}")
        
        # Extract package info using androguard (Python library)
        try:
            from androguard.core.apk import APK
            
            apk = APK(apk_path)
            package_name = apk.get_package()
            app_name = apk.get_app_name() or file.filename.replace('.apk', '')
            version = apk.get_androidversion_name() or "Unknown"
            
            if not package_name:
                raise Exception("Could not extract package name from APK")
            
            print(f"[APK Upload] ✅ Package: {package_name}, App: {app_name}, Version: {version}")
            
            return {
                "package_name": package_name,
                "app_name": app_name,
                "version": version,
                "apk_path": apk_path
            }
            
        except Exception as e:
            print(f"[APK Upload] ❌ Failed to analyze: {e}")
            raise HTTPException(status_code=500, detail=f"APK analysis failed: {str(e)}")
            
    except Exception as e:
        print(f"[APK Upload] ❌ Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class InstallApkRequest(BaseModel):
    device_id: str
    package_name: str

@router.post("/install-apk/")
async def install_apk(request: InstallApkRequest):
    """Install uploaded APK on device"""
    try:
        print(f"[APK Install] Installing {request.package_name} on {request.device_id}")
        
        # Find APK in temp directory
        temp_dir = tempfile.gettempdir()
        apk_files = [f for f in os.listdir(temp_dir) if f.endswith('.apk')]
        
        apk_path = None
        for apk_file in apk_files:
            full_path = os.path.join(temp_dir, apk_file)
            # Check if this APK matches the package using androguard
            try:
                from androguard.core.apk import APK
                apk = APK(full_path)
                if apk.get_package() == request.package_name:
                    apk_path = full_path
                    break
            except:
                continue
        
        if not apk_path:
            raise Exception(f"APK for package {request.package_name} not found in temp directory")
        
        print(f"[APK Install] Found APK: {apk_path}")
        
        # Install using adb
        install_result = subprocess.run(
            ['adb', '-s', request.device_id, 'install', '-r', apk_path],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if install_result.returncode != 0:
            error_msg = install_result.stderr or install_result.stdout
            print(f"[APK Install] ❌ Installation failed: {error_msg}")
            raise Exception(f"Installation failed: {error_msg}")
        
        print(f"[APK Install] ✅ Installation successful!")
        
        return {
            "message": "APK installed successfully",
            "package_name": request.package_name
        }
        
    except Exception as e:
        print(f"[APK Install] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
