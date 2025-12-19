"""Installed Apps Detection API"""
from fastapi import APIRouter, HTTPException
import subprocess
import re

router = APIRouter(prefix="/api/installed-apps", tags=["installed-apps"])

@router.get("/{device_id}")
async def get_installed_apps(device_id: str):
    """Get list of all user-installed apps on device with their activities"""
    try:
        # Get all third-party packages
        result = subprocess.run(
            ['adb', '-s', device_id, 'shell', 'pm', 'list', 'packages', '-3'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            raise HTTPException(status_code=500, detail="Failed to list packages")
        
        packages = []
        for line in result.stdout.strip().split('\n'):
            if line.startswith('package:'):
                package_name = line.replace('package:', '').strip()
                
                # Get app label and activity
                app_info = get_app_info(device_id, package_name)
                
                packages.append({
                    "package_name": package_name,
                    "app_name": app_info["app_name"],
                    "activity": app_info["activity"],
                    "version": app_info["version"]
                })
        
        return {"apps": packages}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get apps: {str(e)}")

def get_app_info(device_id: str, package_name: str) -> dict:
    """Get app name and launchable activity for a package"""
    info = {
        "app_name": package_name.split('.')[-1],  # fallback
        "activity": ".MainActivity",  # fallback
        "version": "1.0"
    }
    
    try:
        # Get dumpsys for this package
        result = subprocess.run(
            ['adb', '-s', device_id, 'shell', 'dumpsys', 'package', package_name],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            output = result.stdout
            
            # Find MAIN activity
            match = re.search(r'(\S+/\.)(\w+Activity)\s+filter', output)
            if match:
                info["activity"] = f".{match.group(2)}"
            
            # Find version
            match = re.search(r'versionName=(\S+)', output)
            if match:
                info["version"] = match.group(1)
            
            # Try to get app label
            try:
                label_result = subprocess.run(
                    ['adb', '-s', device_id, 'shell', 'pm', 'dump', package_name, '|', 'grep', 'applicationInfo'],
                    capture_output=True,
                    text=True,
                    timeout=3,
                    shell=True
                )
                
                # This is a fallback, dumpsys usually has better info
                
            except:
                pass
                
    except Exception as e:
        print(f"[WARN] Could not get info for {package_name}: {e}")
    
    return info
