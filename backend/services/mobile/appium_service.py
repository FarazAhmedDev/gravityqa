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
            "appium:deviceName": device_id,  # Use deviceName with device ID
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

                    # Extract session ID (handles both Appium v1 and v2 formats)
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
    
    async def get_page_source(self, session_id: str) -> Optional[str]:
        """Get page source (XML hierarchy)"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://{self.host}:{self.port}/session/{session_id}/source",
                    timeout=10
                )
                
                if response.status_code == 200:
                    return response.json().get("value")
        except:
            pass
        
        return None
    
    async def get_screenshot(self, session_id: str) -> Optional[str]:
        """Get screenshot as base64"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"http://{self.host}:{self.port}/session/{session_id}/screenshot",
                    timeout=10
                )
                
                if response.status_code == 200:
                    return response.json().get("value")
        except:
            pass
        
        return None
    
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
                # W3C Actions API
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
                # W3C Actions API for swipe
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

