import subprocess
from typing import Dict, Optional
import httpx
from config import settings

class AppiumService:
    """Manages Appium server and sessions"""
    
    def __init__(self):
        self.host = settings.APPIUM_HOST
        self.port = settings.APPIUM_PORT
        self.server_process = None
        self.active_sessions = {}
        # Coordinate system tracking
        self.screenshot_dimensions = {}  # {session_id: {width, height}}
        self.device_dimensions = {}      # {session_id: {width, height}}
        # Auto-discover existing sessions on init
        self._discover_sessions()
    
    def _discover_sessions(self):
        """Discover and reconnect to existing Appium sessions"""
        try:
            import requests
            response = requests.get(
                f"http://{self.host}:{self.port}/sessions",
                timeout=2
            )
            if response.status_code == 200:
                data = response.json()
                sessions = data.get("value", [])
                
                for session in sessions:
                    session_id = session.get("id")
                    capabilities = session.get("capabilities", {})
                    
                    if session_id:
                        self.active_sessions[session_id] = capabilities
                        print(f"[AppiumService] 🔄 Reconnected to existing session: {session_id}")
                
                if self.active_sessions:
                    print(f"[AppiumService] ✅ Total active sessions: {len(self.active_sessions)}")
                else:
                    print("[AppiumService] ⚠️ No existing sessions found")
                    
        except Exception as e:
            print(f"[AppiumService] Could not discover sessions: {e}")
    
    async def start_server(self) -> bool:
        """Start Appium server"""
        try:
            # Check if already running
            if await self.is_server_running():
                return True
            
            # Start Appium
            self.server_process = subprocess.Popen(
                ["appium", "-p", str(self.port)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for server to start
            import time
            time.sleep(3)
            
            return await self.is_server_running()
        
        except Exception as e:
            print(f"Error starting Appium server: {e}")
            return False
    
    async def is_server_running(self) -> bool:
        """Check if Appium server is running"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://{self.host}:{self.port}/status",
                    timeout=2
                )
                return response.status_code == 200
        except:
            return False
    
    async def create_session(self, device_id: str, platform: str, app_package: str, app_activity: str) -> Optional[str]:
        """Create Appium session - FIXED for real device launch"""
        capabilities = {
            "platformName": platform.capitalize(),
            "appium:deviceName": device_id,
            "appium:automationName": "UiAutomator2",
            "appium:appPackage": app_package,
            "appium:appActivity": app_activity
        }

        print(f"[DEBUG] Creating session with capabilities: {capabilities}")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session",
                    json={"capabilities": {"alwaysMatch": capabilities}},
                    timeout=60
                )

                print(f"[DEBUG] Session creation response status: {response.status_code}")

                if response.status_code == 200:
                    data = response.json()
                    print(f"[DEBUG] Response data: {data}")

                    session_id = data.get("value", {}).get("sessionId") or data.get("sessionId")

                    print(f"[DEBUG] Extracted session_id: {session_id}")

                    if session_id:
                        self.active_sessions[session_id] = capabilities
                        print(f"[DEBUG] ✅ Session created! Active sessions: {list(self.active_sessions.keys())}")
                        return session_id
                    else:
                        print("[ERROR] Could not extract session_id from response")
                        return None
                else:
                    error_text = response.text
                    print(f"[ERROR] Session creation failed: {error_text}")
                    return None

        except Exception as e:
            print(f"[ERROR] Error creating session: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete an Appium session"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"http://{self.host}:{self.port}/session/{session_id}",
                    timeout=10
                )
                
                if session_id in self.active_sessions:
                    del self.active_sessions[session_id]
                
                return response.status_code == 200
        
        except Exception as e:
            print(f"Error deleting session: {e}")
            return False
    
    def get_page_source(self, session_id: str, retries=3) -> Optional[str]:
        """Get page source (XML hierarchy) - SYNC version with retries and auto-cleanup"""
        import requests
        import time
        
        # STEP 0: Clean up dead sessions FIRST
        self._cleanup_dead_sessions()
        
        for attempt in range(retries):
            try:
                print(f"[AppiumService] Getting page source (attempt {attempt + 1}/{retries}) for session: {session_id}")
                
                response = requests.get(
                    f"http://{self.host}:{self.port}/session/{session_id}/source",
                    timeout=10
                )
                
                print(f"[AppiumService] Response status: {response.status_code}")
                
                if response.status_code == 200:
                    xml = response.json().get("value")
                    
                    if xml and len(xml) > 100:
                        print(f"[AppiumService] ✅ Got page source: {len(xml)} chars")
                        return xml
                    else:
                        print(f"[AppiumService] ⚠️ XML too small or empty: {len(xml) if xml else 0} chars, retrying...")
                        time.sleep(0.5)
                elif response.status_code == 404:
                    # Session is dead - remove it and fail immediately
                    print(f"[AppiumService] ❌ Session {session_id} is DEAD (404), removing from active sessions")
                    if session_id in self.active_sessions:
                        del self.active_sessions[session_id]
                    return None  # Don't retry dead sessions
                else:
                    print(f"[AppiumService] ❌ Bad status {response.status_code}: {response.text[:200]}")
                    time.sleep(0.5)
                    
            except Exception as e:
                print(f"[AppiumService] ❌ Exception on attempt {attempt + 1}: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(0.5)
        
        print(f"[AppiumService] ❌ Failed to get page source after {retries} attempts")
        return None
    
    def _cleanup_dead_sessions(self):
        """Remove dead/invalid sessions from active_sessions dict"""
        import requests
        
        dead_sessions = []
        
        for session_id in list(self.active_sessions.keys()):
            try:
                # Quick test - just check if session exists
                response = requests.get(
                    f"http://{self.host}:{self.port}/session/{session_id}",
                    timeout=2
                )
                
                if response.status_code == 404:
                    print(f"[AppiumService] 🧹 Removing dead session: {session_id}")
                    dead_sessions.append(session_id)
                    
            except Exception as e:
                print(f"[AppiumService] 🧹 Session {session_id} unreachable, removing: {e}")
                dead_sessions.append(session_id)
        
        # Remove dead sessions
        for session_id in dead_sessions:
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
        
        if dead_sessions:
            print(f"[AppiumService] ✅ Cleaned up {len(dead_sessions)} dead session(s)")
            print(f"[AppiumService] Active sessions remaining: {list(self.active_sessions.keys())}")
    
    async def get_screenshot(self, session_id: str) -> Optional[str]:
        """Get screenshot as base64 and cache dimensions"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://{self.host}:{self.port}/session/{session_id}/screenshot",
                    timeout=10
                )
                
                if response.status_code == 200:
                    screenshot_b64 = response.json().get("value")
                    
                    # Extract and cache screenshot dimensions
                    if screenshot_b64:
                        try:
                            from PIL import Image
                            import io
                            import base64
                            
                            img_data = base64.b64decode(screenshot_b64)
                            img = Image.open(io.BytesIO(img_data))
                            
                            self.screenshot_dimensions[session_id] = {
                                'width': img.width,
                                'height': img.height
                            }
                            
                            print(f"[Screenshot] 📸 Dimensions: {img.width}x{img.height}")
                        except Exception as e:
                            print(f"[Screenshot] ⚠️ Failed to extract dimensions: {e}")
                    
                    return screenshot_b64
        except:
            pass
        
        return None
    
    async def get_device_dimensions(self, session_id: str) -> dict:
        """Get device window dimensions from Appium and cache them"""
        # Return cached if available
        if session_id in self.device_dimensions:
            return self.device_dimensions[session_id]
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://{self.host}:{self.port}/session/{session_id}/window/rect",
                    timeout=5
                )
                
                if response.status_code == 200:
                    rect = response.json().get("value", {})
                    dims = {
                        'width': rect.get('width', 1080),
                        'height': rect.get('height', 2400)
                    }
                    self.device_dimensions[session_id] = dims
                    print(f"[Device] 📱 Window dimensions: {dims['width']}x{dims['height']}")
                    return dims
        except Exception as e:
            print(f"[Device] ⚠️ Failed to get dimensions: {e}")
        
        # Fallback to common Android resolution
        dims = {'width': 1080, 'height': 2400}
        self.device_dimensions[session_id] = dims
        return dims
    
    async def find_element(self, session_id: str, using: str, value: str) -> Optional[str]:
        """Find an element"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session/{session_id}/element",
                    json={"using": using, "value": value},
                    timeout=10
                )
                
                if response.status_code == 200:
                    return response.json().get("value", {}).get("ELEMENT")
        except:
            pass
        
        return None
    
    async def click_element(self, session_id: str, element_id: str) -> bool:
        """Click an element"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session/{session_id}/element/{element_id}/click",
                    timeout=10
                )
                return response.status_code == 200
        except:
            return False
    
    async def send_keys(self, session_id: str, element_id: str, text: str) -> bool:
        """Send keys to an element"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session/{session_id}/element/{element_id}/value",
                    json={"text": text},
                    timeout=10
                )
                return response.status_code == 200
        except:
            return False
    
    async def tap_at_coordinate(self, session_id: str, x: int, y: int) -> bool:
        """Tap at screen coordinates using W3C Actions API"""
        try:
            print(f"[DEBUG] Tapping at ({x}, {y}) on session {session_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session/{session_id}/actions",
                    json={
                        "actions": [
                            {
                                "type": "pointer",
                                "id": "finger1",
                                "parameters": {"pointerType": "touch"},
                                "actions": [
                                    {"type": "pointerMove", "duration": 0, "x": x, "y": y},
                                    {"type": "pointerDown", "button": 0},
                                    {"type": "pause", "duration": 100},
                                    {"type": "pointerUp", "button": 0}
                                ]
                            }
                        ]
                    },
                    timeout=10
                )
                
                print(f"[DEBUG] Tap response status: {response.status_code}")
                if response.status_code == 200:
                    print(f"[DEBUG] ✅ Tap executed successfully at ({x}, {y})")
                    return True
                else:
                    print(f"[ERROR] Tap failed: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"[ERROR] Tap coordinate error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    async def swipe(self, session_id: str, start_x: int, start_y: int, end_x: int, end_y: int, duration: int = 500) -> bool:
        """Execute swipe gesture using W3C Actions API"""
        try:
            print(f"[DEBUG] Swiping from ({start_x},{start_y}) to ({end_x},{end_y}) on session {session_id}")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"http://{self.host}:{self.port}/session/{session_id}/actions",
                    json={
                        "actions": [
                            {
                                "type": "pointer",
                                "id": "finger1",
                                "parameters": {"pointerType": "touch"},
                                "actions": [
                                    {"type": "pointerMove", "duration": 0, "x": start_x, "y": start_y},
                                    {"type": "pointerDown", "button": 0},
                                    {"type": "pause", "duration": 100},
                                    {"type": "pointerMove", "duration": max(800, duration), "x": end_x, "y": end_y},
                                    {"type": "pointerUp", "button": 0}
                                ]
                            }
                        ]
                    },
                    timeout=15
                )
                
                print(f"[DEBUG] Swipe response status: {response.status_code}")
                if response.status_code == 200:
                    print(f"[DEBUG] ✅ Swipe executed successfully!")
                    return True
                else:
                    print(f"[ERROR] Swipe failed: {response.text}")
                    return False
                    
        except Exception as e:
            print(f"[ERROR] Swipe error: {e}")
            import traceback
            traceback.print_exc()
            return False


# Singleton instance - shared across all modules
_appium_service_instance = None

def get_appium_service():
    """Get the singleton AppiumService instance"""
    global _appium_service_instance
    if _appium_service_instance is None:
        _appium_service_instance = AppiumService()
        print(f"[AppiumService] 🆕 Created new singleton instance")
    return _appium_service_instance
