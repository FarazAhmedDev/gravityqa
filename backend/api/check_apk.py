"""Quick APK Check Endpoint - Check if app exists without installing"""
from fastapi import APIRouter, UploadFile, File, HTTPException
import subprocess
import tempfile
import os

router = APIRouter(prefix="/api/check-apk", tags=["check-apk"])

@router.post("/{device_id}")
async def check_apk_on_device(
    device_id: str,
    apk: UploadFile = File(...)
):
    """Check if APK is already installed on device - FAST CHECK"""
    from services.apk.apk_analyzer import APKAnalyzer
    
    # Save temporarily
    temp_dir = tempfile.gettempdir()
    apk_path = os.path.join(temp_dir, apk.filename)
    
    with open(apk_path, "wb") as f:
        content = await apk.read()
        f.write(content)
    
    try:
        # Extract package name
        analyzer = APKAnalyzer()
        apk_info = analyzer.extract_package_info(apk_path)
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
        
        return {
            "package_name": package_name,
            "app_name": apk_info["app_name"] or apk.filename,
            "version": apk_info["version_name"],
            "already_installed": already_installed,
            "activity": activity,
            "apk_path": apk_path
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Check failed: {str(e)}")
