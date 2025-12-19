import subprocess
import asyncio
from typing import List, Dict, Optional
import re

class DeviceBridge:
    """Bridge for communicating with Android (ADB) and iOS devices"""
    
    def __init__(self):
        self.adb_path = "adb"
        self.xcrun_path = "xcrun"
    
    async def get_connected_devices(self) -> List[Dict]:
        """Get all connected Android and iOS devices"""
        devices = []
        
        # Get Android devices
        android_devices = await self._get_android_devices()
        devices.extend(android_devices)
        
        # Get iOS devices
        ios_devices = await self._get_ios_devices()
        devices.extend(ios_devices)
        
        return devices
    
    async def _get_android_devices(self) -> List[Dict]:
        """Get connected Android devices via ADB"""
        try:
            result = subprocess.run(
                [self.adb_path, "devices", "-l"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            devices = []
            lines = result.stdout.strip().split('\n')[1:]  # Skip first line
            
            for line in lines:
                if not line.strip() or 'offline' in line:
                    continue
                
                parts = line.split()
                if len(parts) < 2:
                    continue
                
                device_id = parts[0]
                
                # Get device details
                model = await self._get_android_property(device_id, "ro.product.model")
                manufacturer = await self._get_android_property(device_id, "ro.product.manufacturer")
                version = await self._get_android_property(device_id, "ro.build.version.release")
                
                device_type = "emulator" if "emulator" in device_id else "real"
                
                devices.append({
                    "device_id": device_id,
                    "name": f"{manufacturer} {model}".strip() or device_id,
                    "platform": "android",
                    "platform_version": version or "Unknown",
                    "device_type": device_type,
                    "manufacturer": manufacturer,
                    "model": model
                })
            
            return devices
        
        except Exception as e:
            print(f"Error getting Android devices: {e}")
            return []
    
    async def _get_android_property(self, device_id: str, prop: str) -> Optional[str]:
        """Get Android device property"""
        try:
            result = subprocess.run(
                [self.adb_path, "-s", device_id, "shell", "getprop", prop],
                capture_output=True,
                text=True,
                timeout=3
            )
            return result.stdout.strip()
        except:
            return None
    
    async def _get_ios_devices(self) -> List[Dict]:
        """Get iOS simulators and real devices"""
        devices = []
        
        # Get iOS simulators
        try:
            result = subprocess.run(
                [self.xcrun_path, "simctl", "list", "devices", "available"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            current_ios = None
            for line in result.stdout.split('\n'):
                # Detect iOS version line
                if line.startswith('--') or '(' in line:
                    match = re.search(r'iOS ([0-9.]+)', line)
                    if match:
                        current_ios = match.group(1)
                    continue
                
                # Parse device line
                match = re.search(r'(.+?)\s+\(([A-F0-9-]+)\)\s+\((Booted|Shutdown)\)', line)
                if match and current_ios:
                    name = match.group(1).strip()
                    udid = match.group(2)
                    state = match.group(3)
                    
                    if state == "Booted":  # Only show booted simulators
                        devices.append({
                            "device_id": udid,
                            "name": name,
                            "platform": "ios",
                            "platform_version": current_ios,
                            "device_type": "simulator",
                            "manufacturer": "Apple",
                           "model": name
                        })
        
        except Exception as e:
            print(f"Error getting iOS devices: {e}")
        
        return devices
    
    async def install_app(self, device_id: str, app_path: str, platform: str) -> Dict:
        """Install an app on a device"""
        try:
            if platform == "android":
                result = subprocess.run(
                    [self.adb_path, "-s", device_id, "install", "-r", app_path],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if result.returncode == 0:
                    return {"success": True, "message": "App installed successfully"}
                else:
                    return {"success": False, "message": result.stderr}
            
            elif platform == "ios":
                result = subprocess.run(
                    [self.xcrun_path, "simctl", "install", device_id, app_path],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                
                if result.returncode == 0:
                    return {"success": True, "message": "App installed successfully"}
                else:
                    return {"success": False, "message": result.stderr}
        
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def launch_app(self, device_id: str, package_name: str, platform: str) -> Dict:
        """Launch an app on a device"""
        try:
            if platform == "android":
                # Get main activity
                result = subprocess.run(
                    [self.adb_path, "-s", device_id, "shell", "monkey", 
                     "-p", package_name, "-c", "android.intent.category.LAUNCHER", "1"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return {"success": result.returncode == 0}
            
            elif platform == "ios":
                result = subprocess.run(
                    [self.xcrun_path, "simctl", "launch", device_id, package_name],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                return {"success": result.returncode == 0}
        
        except Exception as e:
            return {"success": False, "message": str(e)}
    
    async def stop_app(self, device_id: str, package_name: str, platform: str) -> Dict:
        """Stop an app on a device"""
        try:
            if platform == "android":
                result = subprocess.run(
                    [self.adb_path, "-s", device_id, "shell", "am", "force-stop", package_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                return {"success": result.returncode == 0}
            
            elif platform == "ios":
                result = subprocess.run(
                    [self.xcrun_path, "simctl", "terminate", device_id, package_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                return {"success": result.returncode == 0}
        
        except Exception as e:
            return {"success": False, "message": str(e)}
