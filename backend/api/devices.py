from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.device import Device
from services.mobile.device_bridge import DeviceBridge
from datetime import datetime
import os
import tempfile

router = APIRouter()
device_bridge = DeviceBridge()

@router.get("/", response_model=List[dict])
async def get_devices(db: Session = Depends(get_db)):
    """Get all connected devices"""
    # Get devices from ADB/iOS
    connected_devices = await device_bridge.get_connected_devices()
    
    # Update database
    for device_info in connected_devices:
        device = db.query(Device).filter(Device.device_id == device_info["device_id"]).first()
        
        if device:
            # Update ALL fields, not just connection status
            device.is_connected = True
            device.last_seen_at = datetime.utcnow()
            device.name = device_info.get("name", device.name)
            device.platform = device_info.get("platform", device.platform)
            device.platform_version = device_info.get("platform_version", device.platform_version)
            device.device_type = device_info.get("device_type", device.device_type)
            device.manufacturer = device_info.get("manufacturer", device.manufacturer)
            device.model = device_info.get("model", device.model)
        else:
            device = Device(**device_info, is_connected=True)
            db.add(device)
    
    # Mark disconnected devices
    all_device_ids = [d["device_id"] for d in connected_devices]
    db.query(Device).filter(Device.device_id.notin_(all_device_ids)).update(
        {"is_connected": False}
    )
    
    db.commit()
    
    # Return all devices
    devices = db.query(Device).all()
    return [
        {
            "id": d.id,
            "device_id": d.device_id,
            "name": d.name,
            "platform": d.platform,
            "platform_version": d.platform_version,
            "device_type": d.device_type,
            "manufacturer": d.manufacturer,
            "model": d.model,
            "is_connected": d.is_connected,
        }
        for d in devices
    ]

@router.post("/{device_id}/install-apk")
async def install_app_file(
    device_id: str,
    apk: UploadFile = File(...),  # Parameter name is 'apk' for backwards compatibility
    db: Session = Depends(get_db)
):
    """Upload APK/IPA file and install - SMART: detects platform and handles both Android and iOS"""
    from services.apk.apk_analyzer import APKAnalyzer
    from api.realtime import broadcast_installation_progress
    import subprocess
    
    # GET DEVICE PLATFORM
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    platform = device.platform
    is_ios = platform == "ios"
    
    # Validate file extension based on platform
    file_extension = os.path.splitext(apk.filename)[1].lower()
    
    if is_ios and file_extension != '.ipa':
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. iOS devices require .ipa files, got {file_extension}"
        )
    elif not is_ios and file_extension != '.apk':
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Android devices require .apk files, got {file_extension}"
        )
    
    # Save uploaded file temporarily
    temp_dir = tempfile.gettempdir()
    app_path = os.path.join(temp_dir, apk.filename)
    
    with open(app_path, "wb") as f:
        content = await apk.read()
        f.write(content)
    
    try:
        if is_ios:
            # iOS IPA HANDLING
            await broadcast_installation_progress(device_id, 20, "Analyzing IPA...")
            
            # For iOS, we can't easily extract package info from IPA
            # Use filename as app name for now
            app_name = os.path.splitext(apk.filename)[0]
            bundle_id = "unknown"  # Would need plist parsing for real bundle ID
            
            print(f"[INFO] Installing IPA on iOS device: {device.name}")
            
            # Install using device_bridge (which uses ideviceinstaller)
            await broadcast_installation_progress(device_id, 50, "Installing on iOS device...")
            result = await device_bridge.install_app(device_id, app_path, "ios")
            
            if not result.get("success"):
                raise HTTPException(status_code=500, detail=result.get("message", "Installation failed"))
            
            await broadcast_installation_progress(device_id, 100, "Installation complete!")
            
            return {
                "success": True,
                "message": f"✅ App installed: {app_name}",
                "package_name": bundle_id,
                "app_name": app_name,
                "version": "1.0",  # Default
                "activity": "",  # iOS doesn't have activities
                "apk_path": app_path,
                "file_size": len(content),
                "already_installed": False
            }
        
        else:
            # ANDROID APK HANDLING (existing logic)
            await broadcast_installation_progress(device_id, 20, "Analyzing APK...")
            
            # Extract real package info using analyzer
            analyzer = APKAnalyzer()
            apk_info = analyzer.extract_package_info(app_path)
            package_name = apk_info["package_name"]
            
            print(f"[DEBUG] Checking if {package_name} already installed...")
            
            # CHECK IF APP ALREADY EXISTS ON DEVICE!
            already_installed = False
            try:
                check_result = subprocess.run(
                    ['adb', '-s', device_id, 'shell', 'pm', 'list', 'packages', package_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if check_result.returncode == 0 and package_name in check_result.stdout:
                    already_installed = True
                    print(f"[INFO] ✅ App already installed! Skipping installation...")
                    await broadcast_installation_progress(device_id, 50, f"✅ App already on device - using existing installation")
            except Exception as e:
                print(f"[WARN] Could not check existing app: {e}")
            
            # INSTALL ONLY IF NOT ALREADY THERE
            if not already_installed:
                await broadcast_installation_progress(device_id, 50, "Installing on device...")
                result = await device_bridge.install_app(device_id, app_path, "android")
                print(f"[INFO] 📲 Fresh installation completed")
            
            # Get launchable activity (works for both existing and new installs)
            activity = ".MainActivity"  # default
            try:
                dump_result = subprocess.run(
                    ['adb', '-s', device_id, 'shell', 'dumpsys', 'package', package_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if dump_result.returncode == 0:
                    # Find MAIN intent activity
                    import re
                    match = re.search(r'(\S+/\.)(\w+Activity)\s+filter', dump_result.stdout)
                    if match:
                        activity = f".{match.group(2)}"
                        print(f"[DEBUG] Detected launchable activity: {activity}")
            except Exception as e:
                print(f"[WARN] Could not detect activity: {e}")
            
            # Broadcast progress: complete
            status_message = "Ready to launch!" if already_installed else "Installation complete!"
            await broadcast_installation_progress(device_id, 100, status_message)
            
            return {
                "success": True,
                "message": f"✅ App ready: {apk_info['app_name'] or apk.filename}",
                "package_name": package_name,
                "app_name": apk_info["app_name"] or apk.filename,
                "version": apk_info["version_name"],
                "activity": activity,
                "apk_path": app_path,
                "file_size": len(content),
                "already_installed": already_installed
            }
        
    except HTTPException:
        raise
    except Exception as e:
        # Broadcast error
        await broadcast_installation_progress(device_id, 0, f"Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

@router.post("/{device_id}/install")
async def install_app(
    device_id: str,
    app_path: str,
    db: Session = Depends(get_db)
):
    """Install an app on a device"""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    if not device.is_connected:
        raise HTTPException(status_code=400, detail="Device not connected")
    
    # Install app
    result = await device_bridge.install_app(device_id, app_path, device.platform)
    
    return {
        "success": result["success"],
        "message": result.get("message", "App installed successfully")
    }

@router.post("/{device_id}/launch-app")
async def launch_app(
    device_id: str,
    package_name: str,
    db: Session = Depends(get_db)
):
    """Launch an app on a device"""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    result = await device_bridge.launch_app(device_id, package_name, device.platform)
    return result

@router.post("/{device_id}/stop-app")
async def stop_app(
    device_id: str,
    package_name: str,
    db: Session = Depends(get_db)
):
    """Stop an app on a device"""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    result = await device_bridge.stop_app(device_id, package_name, device.platform)
    return result
