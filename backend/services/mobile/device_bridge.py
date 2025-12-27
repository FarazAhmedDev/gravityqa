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
        
        # 1. Get REAL iOS devices (via libimobiledevice)
        try:
            result = subprocess.run(
                ["idevice_id", "-l"],  # List connected iOS devices
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                for line in result.stdout.strip().split('\n'):
                    udid = line.strip()
                    if udid:
                        # Get device info
                        device_info = await self._get_ios_device_info(udid)
                        if device_info:
                            devices.append(device_info)
        except FileNotFoundError:
            print("[INFO] idevice_id not found - install libimobiledevice for real iOS device support")
        except Exception as e:
            print(f"Error getting real iOS devices: {e}")
        
        # 2. Get iOS simulators
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
                            "name": f"{name} (Simulator)",
                            "platform": "ios",
                            "platform_version": current_ios,
                            "device_type": "simulator",
                            "manufacturer": "Apple",
                            "model": name
                        })
        
        except Exception as e:
            print(f"Error getting iOS simulators: {e}")
        
        return devices
    
    async def _get_ios_device_info(self, udid: str) -> Optional[Dict]:
        """Get real iOS device information"""
        try:
            # Get device name
            name_result = subprocess.run(
                ["ideviceinfo", "-u", udid, "-k", "DeviceName"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if name_result.returncode != 0:
                print(f"[iOS] DeviceName failed (code {name_result.returncode}): {name_result.stderr}")
                device_name = "iPhone"
            else:
                device_name = name_result.stdout.strip() or "iPhone"
                print(f"[iOS] DeviceName: {device_name}")
            
            # Get iOS version
            version_result = subprocess.run(
                ["ideviceinfo", "-u", udid, "-k", "ProductVersion"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if version_result.returncode != 0:
                print(f"[iOS] ProductVersion failed (code {version_result.returncode}): {version_result.stderr}")
                ios_version = "Unknown"
            else:
                ios_version = version_result.stdout.strip() or "Unknown"
                print(f"[iOS] iOS Version: {ios_version}")
            
            # Get model
            model_result = subprocess.run(
                ["ideviceinfo", "-u", udid, "-k", "ProductType"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if model_result.returncode != 0:
                print(f"[iOS] ProductType failed (code {model_result.returncode}): {model_result.stderr}")
                model = "iPhone"
            else:
                model = model_result.stdout.strip() or "iPhone"
                print(f"[iOS] Model: {model}")
            
            return {
                "device_id": udid,
                "name": f"{device_name} (Real Device)",
                "platform": "ios",
                "platform_version": ios_version,
                "device_type": "real",
                "manufacturer": "Apple",
                "model": model
            }
        
        except Exception as e:
            print(f"[iOS] Error getting device info for {udid}: {e}")
            import traceback
            traceback.print_exc()
            return None
    
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
                # Detect if real device or simulator
                is_real_device = await self._is_real_ios_device(device_id)
                
                if is_real_device:
                    # Real iOS device - use ideviceinstaller
                    try:
                        print(f"[iOS Install] Running: ideviceinstaller -u {device_id} -i {app_path}")
                        result = subprocess.run(
                            ["ideviceinstaller", "-u", device_id, "-i", app_path],
                            capture_output=True,
                            text=True,
                            timeout=120  # Increased timeout for large IPAs
                        )
                        
                        print(f"[iOS Install] Return code: {result.returncode}")
                        print(f"[iOS Install] Stdout: {result.stdout}")
                        print(f"[iOS Install] Stderr: {result.stderr}")
                        
                        if result.returncode == 0:
                            return {"success": True, "message": "App installed successfully on real device"}
                        else:
                            error_msg = result.stderr or result.stdout or "Installation failed"
                            print(f"[iOS Install] FAILED: {error_msg}")
                            return {"success": False, "message": f"ideviceinstaller error: {error_msg}"}
                    except FileNotFoundError:
                        print("[iOS Install] ERROR: ideviceinstaller not found!")
                        return {"success": False, "message": "ideviceinstaller not found - install libimobiledevice"}
                    except subprocess.TimeoutExpired:
                        print("[iOS Install] ERROR: Installation timeout!")
                        return {"success": False, "message": "Installation timed out - IPA might be too large"}
                else:
                    # iOS Simulator - use xcrun simctl
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
    
    async def _is_real_ios_device(self, device_id: str) -> bool:
        """Check if iOS device is real device (not simulator)"""
        try:
            # Try to get device info using ideviceinfo (only works on real devices)
            result = subprocess.run(
                ["ideviceinfo", "-u", device_id],
                capture_output=True,
                text=True,
                timeout=2
            )
            return result.returncode == 0
        except:
            return False
    
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
