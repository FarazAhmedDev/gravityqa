"""Playwright Browser Controller - Web Automation Service"""
from playwright.async_api import async_playwright, Browser, Page, ElementHandle
from typing import Optional, List, Dict, Any
import asyncio
import base64
from datetime import datetime
from services.web.typing_tracker import setup_typing_detection, get_last_typing

class PlaywrightController:
    """Controls Playwright browser for web automation"""
    
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.is_recording = False
        self.recorded_actions: List[Dict[str, Any]] = []
        self._playwright_context = None
        self.current_url: Optional[str] = None  # Track current URL for playback
        self._typing_task: Optional[asyncio.Task] = None  # Background typing monitor
        self._last_typing_text: str = ""  # Dedupe typing actions
        
    async def launch_browser(self, headless: bool = False) -> Dict[str, Any]:
        """Launch Playwright browser"""
        try:
            print("[Playwright] 🚀 Launching browser...")
            print(f"[Playwright] Current state - browser: {self.browser}, page: {self.page}, playwright: {self.playwright}")
            
            # Start playwright if not started
            if not self.playwright:
                print("[Playwright] Starting Playwright context...")
                self._playwright_context = async_playwright()
                self.playwright = await self._playwright_context.__aenter__()
                print("[Playwright] ✅ Playwright context started")
            else:
                print("[Playwright] ℹ️ Playwright already running")
            
            # Close existing browser if any
            if self.browser:
                print("[Playwright] ⚠️ Browser already exists, closing old one...")
                try:
                    await self.browser.close()
                except:
                    pass
                self.browser = None
                self.page = None
            
            # Launch browser
            print("[Playwright] Launching Chromium...")
            self.browser = await self.playwright.chromium.launch(
                headless=headless,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            print(f"[Playwright] ✅ Browser launched: {self.browser}")
            
            # Create new page
            print("[Playwright] Creating new page...")
            self.page = await self.browser.new_page()
            print(f"[Playwright] ✅ Page created: {self.page}")
            
            # Set viewport and inject stabilization CSS
            await self.page.set_viewport_size({"width": 1280, "height": 720})
            
            # Disable smooth scrolling and overflow-anchoring to prevent jumping
            await self.page.add_init_script("""
                (() => {
                    const style = document.createElement('style');
                    style.textContent = `
                        * { scroll-behavior: auto !important; transition: none !important; }
                        html, body { overflow-anchor: none !important; }
                    `;
                    document.documentElement.appendChild(style);
                })();
            """)
            
            # Setup keyboard typing detection for automatic recording
            await self._setup_typing_detection()
            
            print(f"[Playwright] ✅ Browser launched successfully - browser closed: {self.browser.is_connected()}")
            print(f"[Playwright] Final state - browser: {self.browser is not None}, page: {self.page is not None}")
            
            return {
                "success": True,
                "message": "Browser launched",
                "viewport": {"width": 1280, "height": 720}
            }
            
        except Exception as e:
            print(f"[Playwright] ❌ Launch failed: {e}")
            import traceback
            print(f"[Playwright] Traceback: {traceback.format_exc()}")
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
            
            # Store current URL for playback
            self.current_url = url
            
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
        """Get element information at coordinates with robust selector generation"""
        try:
            if not self.page:
                return None
            
            # Get element info and generate a robust CSS selector
            element_info = await self.page.evaluate(f"""
                (posX, posY) => {{
                    const element = document.elementFromPoint(posX, posY);
                    if (!element) return null;
                    
                    const getPath = (el) => {{
                        if (!(el instanceof Element)) return "";
                        const path = [];
                        while (el.nodeType === Node.ELEMENT_NODE) {{
                            let selector = el.nodeName.toLowerCase();
                            if (el.id) {{
                                selector += "#" + el.id;
                                path.unshift(selector);
                                break;
                            }} else {{
                                let sibling = el;
                                let nth = 1;
                                while (sibling = sibling.previousElementSibling) {{
                                    if (sibling.nodeName.toLowerCase() == selector) nth++;
                                }}
                                if (nth != 1) selector += ":nth-of-type(" + nth + ")";
                            }}
                            path.unshift(selector);
                            el = el.parentNode;
                        }}
                        return path.join(" > ");
                    }};

                    const rect = element.getBoundingClientRect();
                    return {{
                        tag: element.tagName.toLowerCase(),
                        id: element.id || null,
                        className: element.className || null,
                        text: element.innerText?.substring(0, 50) || null,
                        selector: getPath(element),
                        boundingBox: {{
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height
                        }}
                    }};
                }}, {x}, {y}""")
            
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
            
    async def click_at_position(self, x: int, y: int) -> Dict[str, Any]:
        """Click at specific coordinates and record with selector if possible"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            # Get scroll position before click to lock it
            scroll_pos = await self.page.evaluate("() => ({ x: window.scrollX, y: window.scrollY })")
            
            # Find element at position to get selector for recording
            element_info = await self.get_element_at_position(x, y)
            selector = None
            if element_info and isinstance(element_info, dict):
                selector = element_info.get('selector')
            
            print(f"[Playwright] 🖱️ Tap at ({x}, {y}) | Selector: {selector} | Scroll: {scroll_pos}")
            
            # Perform tap using mouse coordinates (bypass auto-scroll)
            await self.page.mouse.click(x, y, delay=50)
            
            # Force restore scroll position immediately to prevent jumping
            await self.page.evaluate(f"window.scrollTo({scroll_pos['x']}, {scroll_pos['y']})")
            
            # Record action if recording
            if self.is_recording:
                final_selector = selector if selector else f"coordinate:{x},{y}"
                self.recorded_actions.append({
                    "id": len(self.recorded_actions) + 1,
                    "type": "click",
                    "selector": final_selector,
                    "data": {"x": x, "y": y},
                    "timestamp": datetime.now().isoformat()
                })
            
            return {
                "success": True, 
                "selector": selector,
                "recorded": self.is_recording
            }
            
        except Exception as e:
            print(f"[Playwright] ❌ Click at position failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def inspect_at_position(self, x: int, y: int) -> Dict[str, Any]:
        """Get element information at coordinates without clicking"""
        try:
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            # Get element at position
            element_info = await self.get_element_at_position(x, y)
            
            if not element_info:
                return {
                    "success": False,
                    "error": "No element found at coordinates"
                }
            
            print(f"[Playwright] 🔍 Inspecting element at ({x}, {y}): {element_info.get('selector')}")
            
            return {
                "success": True,
                "element": element_info
            }
            
        except Exception as e:
            print(f"[Playwright] ❌ Inspect failed: {e}")
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
        self._last_typing_text = ""
        
        # Start typing monitor task
        if self._typing_task is None or self._typing_task.done():
            self._typing_task = asyncio.create_task(self._monitor_typing())
            print("[Playwright] 🔴 Recording started (with auto-typing)")
        else:
            print("[Playwright] 🔴 Recording started")
        
        return {"success": True, "recording": True}
    
    def stop_recording(self) -> Dict[str, Any]:
        """Stop recording actions"""
        self.is_recording = False
        
        # Cancel typing monitor
        if self._typing_task and not self._typing_task.done():
            self._typing_task.cancel()
            print("[Playwright] ⏹️ Typing monitor stopped")
        
        print(f"[Playwright] ⏹️ Recording stopped ({len(self.recorded_actions)} actions)")
        return {
            "success": True,
            "recording": False,
            "actions_count": len(self.recorded_actions)
        }
    
    def get_recorded_actions(self) -> List[Dict[str, Any]]:
        """Get recorded actions"""
        return self.recorded_actions
    
    async def replay_actions(self, actions: List[Dict[str, Any]], fresh_browser: bool = False) -> Dict[str, Any]:
        """Replay recorded actions with optional fresh browser launch"""
        try:
            # If fresh_browser requested, close and relaunch
            if fresh_browser:
                print("[Playwright] 🔄 Fresh browser requested - relaunching...")
                stored_url = self.current_url  # Save URL before closing
                await self.close_browser()
                await self.launch_browser(headless=False)
                self.current_url = stored_url  # Restore URL
                print("[Playwright] ✅ Fresh browser ready")
            
            if not self.page:
                return {"success": False, "error": "Browser not launched"}
            
            # Navigate to the test URL if available
            if self.current_url:
                print(f"[Playwright] 🌐 Navigating to test URL: {self.current_url}")
                await self.navigate(self.current_url)
                await asyncio.sleep(1)  # Wait for page to stabilize
            else:
                print("[Playwright] ⚠️ No URL stored - skipping navigation")
            
            print(f"[Playwright] ▶️ Replaying {len(actions)} actions...")
            
            executed_count = 0
            for i, action in enumerate(actions):
                # Skip disabled actions
                if action.get('enabled') == False:
                    print(f"[Playwright] ⏭️ Skipping disabled action #{i+1}")
                    continue
                
                action_type = action.get('type')
                selector = action.get('selector')
                data = action.get('data', {})
                
                print(f"[Playwright] 🎬 Action {i+1}/{len(actions)}: {action_type}")
                
                try:
                    if action_type == 'click':
                        if selector and selector.startswith('coordinate:'):
                            # Extract coordinates
                            coords = selector.replace('coordinate:', '').split(',')
                            x, y = int(coords[0]), int(coords[1])
                            await self.page.mouse.click(x, y)
                        else:
                            await self.click_element(selector)
                    
                    elif action_type == 'type':
                        await self.type_text(selector, data.get('text', ''))
                    
                    elif action_type == 'scroll':
                        await self.scroll(data.get('direction', 'down'), data.get('amount', 500))
                    
                    elif action_type == 'wait':
                        wait_time = data.get('seconds', 3)
                        print(f"[Playwright] ⏱️ Waiting {wait_time}s...")
                        await asyncio.sleep(wait_time)
                    
                    elif action_type == 'assert':
                        # TODO: Implement assertions
                        print(f"[Playwright] ✓ Assert (placeholder)")
                    
                    executed_count += 1
                    
                    # Wait between actions for stability
                    await asyncio.sleep(0.8)
                    
                except Exception as action_error:
                    print(f"[Playwright] ⚠️ Action {i+1} failed: {action_error}")
                    # Continue with next action instead of failing completely
            
            print(f"[Playwright] ✅ Replay completed - {executed_count}/{len(actions)} actions executed")
            return {
                "success": True, 
                "actions_executed": executed_count,
                "total_actions": len(actions)
            }
            
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
    
    async def _setup_typing_detection(self):
        """Setup typing detection (placeholder)"""
        pass
    
    async def _monitor_typing(self):
        """Monitor typing events (placeholder)"""
        try:
            while self.is_recording:
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            pass

# Global instance
playwright_controller = PlaywrightController()
