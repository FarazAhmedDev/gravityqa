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
            device.is_connected = True
            device.last_seen_at = datetime.utcnow()
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
async def install_apk_file(
    device_id: str,
    apk: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload APK file and install - SMART: checks if already installed first"""
    from services.apk.apk_analyzer import APKAnalyzer
    from api.realtime import broadcast_installation_progress
    
    # Save uploaded file temporarily
    temp_dir = tempfile.gettempdir()
    apk_path = os.path.join(temp_dir, apk.filename)
    
    with open(apk_path, "wb") as f:
        content = await apk.read()
        f.write(content)
    
    try:
        # Broadcast progress: analyzing APK
        await broadcast_installation_progress(device_id, 20, "Analyzing APK...")
        
        # Extract real package info using analyzer
        analyzer = APKAnalyzer()
        apk_info = analyzer.extract_package_info(apk_path)
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
            result = await device_bridge.install_app(device_id, apk_path, "android")
            print(f"[INFO] 📲 Fresh installation completed")
        
        # Get launchable activity (works for both existing and new installs)
        activity = ".MainActivity"  # default
        try:
            import subprocess
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
            "apk_path": apk_path,
            "file_size": len(content),
            "already_installed": already_installed  # NEW: tells frontend if it was already there
        }
        
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
