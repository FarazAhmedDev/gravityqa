"""Playwright Browser Controller - Web Automation Service"""
from playwright.async_api import async_playwright, Browser, Page, ElementHandle
from typing import Optional, List, Dict, Any
import asyncio
import base64
from datetime import datetime

class PlaywrightController:
    """Controls Playwright browser for web automation"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.is_recording = False
        self.recorded_actions: List[Dict[str, Any]] = []
        self._playwright_context = None
        
    async def launch_browser(self, headless: bool = False) -> Dict[str, Any]:
        """Launch Playwright browser"""
        try:
            print("[Playwright] 🚀 Launching browser...")
            
            # Start playwright if not started
            if not self.playwright:
                self._playwright_context = async_playwright()
                self.playwright = await self._playwright_context.__aenter__()
            
            # Launch browser
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            
            # Create new page
            self.page = await self.browser.new_page()
            
            # Set viewport
            await self.page.set_viewport_size({"width": 1280, "height": 720})
            
            print("[Playwright] ✅ Browser launched successfully")
            
            return {
                "success": True,
                "message": "Browser launched",
                "viewport": {"width": 1280, "height": 720}
            }
            
        except Exception as e:
            print(f"[Playwright] ❌ Launch failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def navigate(self, url: str) -> Dict[str, Any]:
        """Navigate to URL"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            print(f"[Playwright] 🌐 Navigating to: {url}")
            
            # Add protocol if missing
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            await self.page.goto(url, wait_until='domcontentloaded', timeout=30000)
            
            # Get page title
            title = await self.page.title()
            
            print(f"[Playwright] ✅ Loaded: {title}")
            
            return {
                "success": True,
                "url": url,
                "title": title
            }
            
        except Exception as e:
            print(f"[Playwright] ❌ Navigation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_screenshot(self) -> Optional[str]:
        """Get current page screenshot as base64"""
        try:
            if not self.page:
                return None
            
            screenshot_bytes = await self.page.screenshot(type='png')
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
            
            return screenshot_base64
            
        except Exception as e:
            print(f"[Playwright] ❌ Screenshot failed: {e}")
            return None
    
    async def get_element_at_position(self, x: int, y: int) -> Optional[Dict[str, Any]]:
        """Get element information at coordinates"""
        try:
            if not self.page:
                return None
            
            # Get element at position using JavaScript
            element_info = await self.page.evaluate(f"""
                () => {{
                    const element = document.elementFromPoint({x}, {y});
                    if (!element) return null;
                    
                    const rect = element.getBoundingClientRect();
                    return {{
                        tag: element.tagName.toLowerCase(),
                        id: element.id || null,
                        className: element.className || null,
                        text: element.innerText?.substring(0, 50) || element.textContent?.substring(0, 50) || null,
                        selector: element.id ? `#{element.id}` : null,
                        boundingBox: {{
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }}
                    }};
                }}
            """)
            
            return element_info
            
        except Exception as e:
            print(f"[Playwright] ❌ Get element failed: {e}")
            return None
    
    async def click_element(self, selector: str) -> Dict[str, Any]:
        """Click element by selector"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            print(f"[Playwright] 🖱️ Clicking: {selector}")
            
            await self.page.click(selector, timeout=5000)
            
            # Record action if recording
            if self.is_recording:
                self.recorded_actions.append({
                    "id": len(self.recorded_actions) + 1,
                    "type": "click",
                    "selector": selector,
                    "timestamp": datetime.now().isoformat()
                })
            
            return {"success": True}
            
        except Exception as e:
            print(f"[Playwright] ❌ Click failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def type_text(self, selector: str, text: str) -> Dict[str, Any]:
        """Type text into element"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            print(f"[Playwright] ⌨️ Typing into: {selector}")
            
            await self.page.fill(selector, text, timeout=5000)
            
            # Record action if recording
            if self.is_recording:
                self.recorded_actions.append({
                    "id": len(self.recorded_actions) + 1,
                    "type": "type",
                    "selector": selector,
                    "data": {"text": text},
                    "timestamp": datetime.now().isoformat()
                })
            
            return {"success": True}
            
        except Exception as e:
            print(f"[Playwright] ❌ Type failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def scroll(self, direction: str = "down", amount: int = 500) -> Dict[str, Any]:
        """Scroll page"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            scroll_y = amount if direction == "down" else -amount
            
            await self.page.evaluate(f"window.scrollBy(0, {scroll_y})")
            
            # Record action if recording
            if self.is_recording:
                self.recorded_actions.append({
                    "id": len(self.recorded_actions) + 1,
                    "type": "scroll",
                    "data": {"direction": direction, "amount": amount},
                    "timestamp": datetime.now().isoformat()
                })
            
            return {"success": True}
            
        except Exception as e:
            print(f"[Playwright] ❌ Scroll failed: {e}")
            return {"success": False, "error": str(e)}
    
    def start_recording(self) -> Dict[str, Any]:
        """Start recording actions"""
        self.is_recording = True
        self.recorded_actions = []
        print("[Playwright] 🔴 Recording started")
        return {"success": True, "recording": True}
    
    def stop_recording(self) -> Dict[str, Any]:
        """Stop recording actions"""
        self.is_recording = False
        print(f"[Playwright] ⏹️ Recording stopped ({len(self.recorded_actions)} actions)")
        return {
            "success": True,
            "recording": False,
            "actions_count": len(self.recorded_actions)
        }
    
    def get_recorded_actions(self) -> List[Dict[str, Any]]:
        """Get recorded actions"""
        return self.recorded_actions
    
    async def replay_actions(self, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Replay recorded actions"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            print(f"[Playwright] ▶️ Replaying {len(actions)} actions...")
            
            for action in actions:
                action_type = action.get('type')
                selector = action.get('selector')
                data = action.get('data', {})
                
                if action_type == 'click':
                    await self.click_element(selector)
                elif action_type == 'type':
                    await self.type_text(selector, data.get('text', ''))
                elif action_type == 'scroll':
                    await self.scroll(data.get('direction', 'down'), data.get('amount', 500))
                
                # Wait between actions
                await asyncio.sleep(0.5)
            
            print("[Playwright] ✅ Replay completed")
            return {"success": True, "actions_executed": len(actions)}
            
        except Exception as e:
            print(f"[Playwright] ❌ Replay failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def close_browser(self) -> Dict[str, Any]:
        """Close browser"""
        try:
            print("[Playwright] 🛑 Closing browser...")
            
            if self.page:
                await self.page.close()
                self.page = None
            
            if self.browser:
                await self.browser.close()
                self.browser = None
            
            if self._playwright_context:
                await self._playwright_context.__aexit__(None, None, None)
                self.playwright = None
                self._playwright_context = None
            
            self.is_recording = False
            self.recorded_actions = []
            
            print("[Playwright] ✅ Browser closed")
            return {"success": True}
            
        except Exception as e:
            print(f"[Playwright] ❌ Close failed: {e}")
            return {"success": False, "error": str(e)}

# Global instance
playwright_controller = PlaywrightController()
