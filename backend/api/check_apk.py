"""Quick APK/IPA Check Endpoint - Check if app exists without installing"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.device import Device
import subprocess
import tempfile
import os

router = APIRouter(prefix="/api/check-apk", tags=["check-apk"])

@router.post("/{device_id}")
async def check_app_on_device(
    device_id: str,
    apk: UploadFile = File(...),  # Called 'apk' for backwards compatibility
    db: Session = Depends(get_db)
):
    """Check if APK/IPA is already installed on device - PLATFORM-AWARE"""
    from services.apk.apk_analyzer import APKAnalyzer
    
    # GET DEVICE PLATFORM
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    platform = device.platform
    is_ios = platform == "ios"
    
    # Save temporarily
    temp_dir = tempfile.gettempdir()
    app_path = os.path.join(temp_dir, apk.filename)
    
    with open(app_path, "wb") as f:
        content = await apk.read()
        f.write(content)
    
    
    try:
        print(f"[CHECK] Received file: {apk.filename}, Content-Type: {apk.content_type}, Platform: {platform}")
        
        # Platform-aware validation
        file_extension = os.path.splitext(apk.filename)[1].lower()
        
        if is_ios:
            # iOS IPA validation
            if file_extension != '.ipa':
                raise HTTPException(
                    status_code=400,
                    detail=f"File must be an IPA (.ipa extension) for iOS devices, got {file_extension}"
                )
            
            # For iOS, we can't easily check if already installed or extract bundle ID
            # Just return basic info from filename
            app_name = os.path.splitext(apk.filename)[0]
            bundle_id = "unknown.bundle.id"  # Would need plist parsing
            
            print(f"[CHECK] IPA file validated for iOS device")
            
            # Store app info globally for code generation
            from utils.app_config_store import app_config_store
            app_config_store.set_app(
                package_name=bundle_id,
                activity="",  # iOS doesn't have activities
                app_name=app_name
            )
            
            return {
                "package_name": bundle_id,
                "app_name": app_name,
                "version": "1.0",  # Default
                "already_installed": False,  # Can't easily check on iOS
                "activity": "",  # iOS doesn't have activities
                "apk_path": app_path
            }
        
        else:
            # Android APK validation
            if file_extension != '.apk':
                raise HTTPException(
                    status_code=400,
                    detail=f"File must be an APK (.apk extension) for Android devices, got {file_extension}"
                )
            
            # Extract package name
            analyzer = APKAnalyzer()
            print(f"[CHECK] Analyzing APK at {app_path}...")
            apk_info = analyzer.extract_package_info(app_path)
            
            if not apk_info.get("package_name"):
                raise HTTPException(
                    status_code=500, 
                    detail="Could not extract package name from APK. Install androguard: pip install androguard"
                )
            
            package_name = apk_info["package_name"]
            
            print(f"[CHECK] Looking for {package_name} on device...")
            
            # Check if exists on device
            check_result = subprocess.run(
                ['adb', '-s', device_id, 'shell', 'pm', 'list', 'packages', package_name],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            already_installed = check_result.returncode == 0 and package_name in check_result.stdout
            
            # Get REAL activity from the device or APK
            activity = apk_info.get("main_activity", ".MainActivity")
            
            # If already installed, get the ACTUAL launcher activity from device
            if already_installed:
                try:
                    print(f"[CHECK] Getting real launcher activity from device...")
                    resolve_result = subprocess.run(
                        ['adb', '-s', device_id, 'shell', 'cmd', 'package', 'resolve-activity', '--brief', package_name],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    
                    if resolve_result.returncode == 0:
                        # Output is like: "com.vura.app/.vura_app.MainActivity"
                        output = resolve_result.stdout.strip().split('\n')[-1]  # Last line
                        if '/' in output:
                            real_activity = output.split('/')[-1]  # Get activity part
                            print(f"[CHECK] ✅ Real launcher activity: {real_activity}")
                            activity = real_activity
                        else:
                            print(f"[CHECK] ⚠️ Could not parse activity from: {output}")
                            
                except Exception as e:
                    print(f"[CHECK] ⚠️ Failed to get real activity: {e}, using from APK")
            
            print(f"[CHECK] Final activity: {activity}")
            
            # Store app info globally for code generation
            from utils.app_config_store import app_config_store
            app_config_store.set_app(
                package_name=package_name,
                activity=activity,
                app_name=apk_info["app_name"] or apk.filename
            )
            print(f"[CHECK] ✅ Saved to global store for code generation")
            
            return {
                "package_name": package_name,
                "app_name": apk_info["app_name"] or apk.filename,
                "version": apk_info["version_name"],
                "already_installed": already_installed,
                "activity": activity,
                "apk_path": app_path
            }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"[CHECK] ❌ Error details:\n{error_details}")
        raise HTTPException(status_code=500, detail=f"App analysis failed: {str(e)}")
