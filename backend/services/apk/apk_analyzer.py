"""APK Analyzer - Extract REAL package info using androguard"""
import subprocess
import re
from typing import Optional, Dict

class APKAnalyzer:
    """Extracts metadata from APK files - FIXED with androguard"""
    
    def extract_package_info(self, apk_path: str) -> Dict[str, str]:
        """
        Extract package name, app name, and version from APK
        
        Returns:
            dict with keys: package_name, app_name, version_code, version_name, main_activity
        """
        info = {
            "package_name": None,
            "app_name": None,
            "version_code": None,
            "version_name": None,
            "main_activity": None
        }
        
        # Method 1: Try aapt (Android Asset Packaging Tool) - MORE RELIABLE!
        try:
            print("[APKAnalyzer] Trying aapt...")
            result = subprocess.run(
                ['aapt', 'dump', 'badging', apk_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                output = result.stdout
                
                # Extract package name
                match = re.search(r"package: name='([^']+)'", output)
                if match:
                    info["package_name"] = match.group(1)
                    print(f"[APKAnalyzer] ✅ Package (aapt): {info['package_name']}")
                
                # Extract version
                match = re.search(r"versionCode='([^']+)'", output)
                if match:
                    info["version_code"] = match.group(1)
                    
                match = re.search(r"versionName='([^']+)'", output)
                if match:
                    info["version_name"] = match.group(1)
                
                # Extract app name
                match = re.search(r"application-label:'([^']+)'", output)
                if match:
                    info["app_name"] = match.group(1)
                
                # Extract launchable activity
                match = re.search(r"launchable-activity: name='([^']+)'", output)
                if match:
                    info["main_activity"] = match.group(1)
                
                if info["package_name"]:
                    print(f"[APKAnalyzer] ✅ SUCCESS with aapt!")
                    return info
                
        except FileNotFoundError:
            print("[APKAnalyzer] ❌ aapt not found")
        except Exception as e:
            print(f"[APKAnalyzer] aapt failed: {e}")
        
        # Method 2: Try androguard as fallback
        try:
            from androguard.core.apk import APK
            
            print(f"[APKAnalyzer] Trying androguard as fallback: {apk_path}")
            apk = APK(apk_path)
            
            # Get REAL package name
            package = apk.get_package()
            print(f"[APKAnalyzer] ✅ Package name: {package}")
            
            # Get app name
            app_name = apk.get_app_name()
            print(f"[APKAnalyzer] ✅ App name: {app_name}")
            
            # Get version info
            version_name = apk.get_androidversion_name()
            version_code = apk.get_androidversion_code()
            print(f"[APKAnalyzer] ✅ Version: {version_name} ({version_code})")
            
            # Get main activity
            main_activity = apk.get_main_activity()
            print(f"[APKAnalyzer] ✅ Main activity (from APK): {main_activity}")
            
            # FIX: Ensure activity has full package path
            # Sometimes androguard returns ".MainActivity" instead of ".vura_app.MainActivity"
            # We need the full path for Appium to launch correctly
            if main_activity and main_activity.startswith('.') and not main_activity.startswith(f'.{package.split(".")[-1]}'):
                # Activity is short form like ".Main Activity"
                # Convert to full: package + activity
                # For com.vura.app, this becomes com.vura.app + .MainActivity = com.vura.app.MainActivity
                full_activity = package + main_activity
                print(f"[APKAnalyzer] 🔧 Converted activity: {main_activity} → {full_activity}")
                main_activity = full_activity
            
            info["package_name"] = package
            info["app_name"] = app_name
            info["version_name"] = version_name
            info["version_code"] = str(version_code) if version_code else None
            info["main_activity"] = main_activity
            
            print(f"[APKAnalyzer] ✅✅ SUCCESS!")
            print(f"[APKAnalyzer] Package: {package}")
            print(f"[APKAnalyzer] Activity (from APK): {main_activity}")
            return info
            
        except ImportError:
            print("[APKAnalyzer] ❌ androguard not installed")
        except Exception as e:
            print(f"[APKAnalyzer] androguard failed: {e}")
        
        # Method 3: LAST RESORT - Install and query
        print("[APKAnalyzer] ⚠️ WARNING: Using install method (last resort)")
        print("[APKAnalyzer] This will install the APK on connected device!")
        
        try:
            # Install APK
            print(f"[APKAnalyzer] Installing {apk_path}...")
            install_result = subprocess.run(
                ['adb', 'install', '-r', apk_path],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if install_result.returncode == 0 or "Success" in install_result.stdout:
                print("[APKAnalyzer] ✅ APK installed")
                
                # Get list of third-party packages
                result = subprocess.run(
                    ['adb', 'shell', 'pm', 'list', 'packages', '-3'],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    packages = [p.replace('package:', '').strip() for p in result.stdout.strip().split('\n')]
                    
                    # Get the most recently installed (last in list)
                    if packages:
                        last_package = packages[-1]
                        info["package_name"] = last_package
                        print(f"[APKAnalyzer] ✅ Package (from device): {last_package}")
                        
                        # Try to get version
                        dump_result = subprocess.run(
                            ['adb', 'shell', 'pm', 'dump', last_package],
                            capture_output=True,
                            text=True
                        )
                        
                        if dump_result.returncode == 0:
                            match = re.search(r"versionName=([^\s]+)", dump_result.stdout)
                            if match:
                                info["version_name"] = match.group(1)
                        
                        return info
                
        except Exception as e:
            print(f"[APKAnalyzer] ❌ Install method failed: {e}")
        
        # If all methods failed
        print("[APKAnalyzer] ❌❌ CRITICAL: Could not extract package info!")
        print("[APKAnalyzer] Please install androguard: pip install androguard")
        
        return info

# Global instance
analyzer = APKAnalyzer()
