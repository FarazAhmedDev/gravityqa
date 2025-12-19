"""Appium Event Monitor - Threading-based (More Reliable!)"""
import threading
import requests
import time
from typing import Optional, Callable, Dict
import xml.etree.ElementTree as ET
from datetime import datetime

class AppiumEventMonitor:
    """Monitor mobile actions by polling Appium UI hierarchy - Threading version"""
    
    def __init__(self, session_id: str, appium_host: str, appium_port: int, callback: Callable):
        self.session_id = session_id
        self.appium_host = appium_host
        self.appium_port = appium_port
        self.callback = callback
        
        self.running = False
        self.thread: Optional[threading.Thread] = None
        
        # State tracking
        self.last_ui_hash = None
        self.last_activity = None
        self.tap_cooldown = 0
        
    def start(self):
        """Start monitoring"""
        if self.running:
            print(f"[AppiumMonitor] Already running for session {self.session_id}")
            return
            
        print(f"[AppiumMonitor] Starting for session {self.session_id}")
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        print(f"[AppiumMonitor] Monitoring thread started!")
        
    def stop(self):
        """Stop monitoring"""
        print(f"[AppiumMonitor] Stopping for session {self.session_id}")
        self.running = False
        
        if self.thread:
            self.thread.join(timeout=2)
                
    def _monitor_loop(self):
        """Main monitoring loop - polls UI state"""
        poll_interval = 0.5  # 500ms polling
        
        print(f"[AppiumMonitor] Monitoring active, polling every {poll_interval}s")
        
        consecutive_errors = 0
        max_errors = 10
        
        while self.running:
            try:
                self._check_ui_changes()
                
                # Decay tap cooldown
                if self.tap_cooldown > 0:
                    self.tap_cooldown -= poll_interval
                
                consecutive_errors = 0  # Reset on success
                time.sleep(poll_interval)
                
            except Exception as e:
                consecutive_errors += 1
                if consecutive_errors >= max_errors:
                    print(f"[AppiumMonitor] Too many errors ({consecutive_errors}), stopping monitor")
                    self.running = False
                    break
                    
                # Silent fail for occasional errors
                time.sleep(poll_interval)
                
        print(f"[AppiumMonitor] Monitoring stopped for session {self.session_id}")
        
    def _check_ui_changes(self):
        """Check for UI changes that indicate user interaction"""
        try:
            # Get current page source (UI hierarchy)
            response = requests.get(
                f"http://{self.appium_host}:{self.appium_port}/session/{self.session_id}/source",
                timeout=3.0
            )
            
            if response.status_code != 200:
                return
                
            page_source = response.json().get("value", "")
            
            # Simple hash to detect changes
            current_hash = hash(page_source[:1500])  # Use first 1500 chars
            
            # Also check current activity
            try:
                activity_response = requests.get(
                    f"http://{self.appium_host}:{self.appium_port}/session/{self.session_id}/appium/device/current_activity",
                    timeout=2.0
                )
                current_activity = activity_response.json().get("value") if activity_response.status_code == 200 else None
            except:
                current_activity = None
            
            # Detect changes
            if self.last_ui_hash is not None:
                # Activity changed = navigation/screen change
                if current_activity and current_activity != self.last_activity:
                    print(f"[AppiumMonitor] 📱 Activity changed: {self.last_activity} → {current_activity}")
                    self._on_screen_change(current_activity)
                    
                # UI changed = possible tap/swipe
                elif current_hash != self.last_ui_hash and self.tap_cooldown <= 0:
                    print(f"[AppiumMonitor] 📱 UI changed - inferring tap")
                    self._infer_tap_from_change(page_source)
                    self.tap_cooldown = 1.2  # 1.2 second cooldown
            
            self.last_ui_hash = current_hash
            self.last_activity = current_activity
            
        except Exception as e:
            # Silent fail on timeout/errors
            pass
            
    def _infer_tap_from_change(self, page_source: str):
        """Infer tap action from UI change"""
        try:
            # Try to find clicked element by parsing XML
            root = ET.fromstring(page_source)
            
            # Look for clickable/focusable elements
            clickable_elements = []
            
            for elem in root.iter():
                if elem.get('clickable') == 'true' or elem.get('focusable') == 'true' or elem.get('focused') == 'true':
                    bounds = elem.get('bounds')
                    if bounds:
                        try:
                            coords = bounds.replace('][', ',').replace('[', '').replace(']', '').split(',')
                            x1, y1, x2, y2 = map(int, coords)
                            center_x = (x1 + x2) // 2
                            center_y = (y1 + y2) // 2
                            
                            clickable_elements.append({
                                'x': center_x,
                                'y': center_y,
                                'text': elem.get('text', ''),
                                'resource_id': elem.get('resource-id', ''),
                                'class': elem.get('class', ''),
                                'focused': elem.get('focused') == 'true'
                            })
                        except:
                            pass
            
            # Prioritize focused elements, otherwise first clickable
            element = None
            for el in clickable_elements:
                if el['focused']:
                    element = el
                    break
            
            if not element and clickable_elements:
                element = clickable_elements[0]
            
            if element:
                action = {
                    'type': 'tap',
                    'x': element['x'],
                    'y': element['y'],
                    'source': 'mobile',
                    'inferred': True,
                    'element_text': element['text'],
                    'element_id': element['resource_id'],
                    'element_class': element['class']
                }
                
                desc = element['text'] or element['resource_id'] or element['class']
                print(f"[AppiumMonitor] 👆 Inferred TAP at ({element['x']}, {element['y']}) - {desc[:30]}")
                
                if self.callback:
                    try:
                        self.callback(action)
                    except Exception as e:
                        print(f"[AppiumMonitor] Callback error: {e}")
                        
        except Exception as e:
            # Silent fail - XML parsing can fail
            pass
            
    def _on_screen_change(self, new_activity: str):
        """Handle screen/activity change"""
        action = {
            'type': 'navigation',
            'activity': new_activity,
            'source': 'mobile',
            'timestamp': datetime.now().isoformat()
        }
        
        if self.callback:
            try:
                self.callback(action)
            except Exception as e:
                print(f"[AppiumMonitor] Callback error: {e}")


# Global monitor instances
_active_monitors: Dict[str, AppiumEventMonitor] = {}

def start_monitoring(session_id: str, appium_host: str, appium_port: int, callback: Callable) -> bool:
    """Start Appium event monitoring for a session"""
    global _active_monitors
    
    if session_id in _active_monitors:
        print(f"[AppiumMonitor] Already monitoring session {session_id}")
        return True
        
    monitor = AppiumEventMonitor(session_id, appium_host, appium_port, callback)
    monitor.start()
    
    _active_monitors[session_id] = monitor
    print(f"[AppiumMonitor] Monitor added to active monitors")
    return True

def stop_monitoring(session_id: str):
    """Stop Appium event monitoring for a session"""
    global _active_monitors
    
    if session_id in _active_monitors:
        _active_monitors[session_id].stop()
        del _active_monitors[session_id]
        print(f"[AppiumMonitor] Stopped monitoring session {session_id}")
    else:
        print(f"[AppiumMonitor] No active monitor for session {session_id}")
