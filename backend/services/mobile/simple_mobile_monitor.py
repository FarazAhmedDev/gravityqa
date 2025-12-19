"""SIMPLE Mobile Event Monitor - Just detects screen/activity changes"""
import threading
import requests
import time
from typing import Callable, Dict, Optional

class SimpleMobileMonitor:
    """Dead simple monitor - just tracks activity/screen changes"""
    
    def __init__(self, session_id: str, appium_host: str, appium_port: int, callback: Callable):
        self.session_id = session_id
        self.appium_host = appium_host
        self.appium_port = appium_port
        self.callback = callback
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.last_activity = None
        
    def start(self):
        if self.running:
            return
        print(f"[SimpleMobileMonitor] Starting monitor for {self.session_id}")
        self.running = True
        self.thread = threading.Thread(target=self._monitor, daemon=True)
        self.thread.start()
        
    def stop(self):
        print(f"[SimpleMobileMonitor] Stopping monitor")
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
            
    def _monitor(self):
        """Just check activity every second"""
        print("[SimpleMobileMonitor] Monitoring started - detecting screen changes")
        
        count = 0
        while self.running:
            count += 1
            try:
                print(f"[SimpleMobileMonitor] Poll #{count} - checking activity...")
                
                # Just get current activity
                url = f"http://{self.appium_host}:{self.appium_port}/session/{self.session_id}/appium/device/current_activity"
                print(f"[SimpleMobileMonitor] Requesting: {url}")
                
                r = requests.get(url, timeout=2)
                
                print(f"[SimpleMobileMonitor] Response status: {r.status_code}")
                
                if r.status_code == 200:
                    activity = r.json().get("value")
                    print(f"[SimpleMobileMonitor] Current activity: {activity}")
                    
                    if self.last_activity and activity != self.last_activity:
                        # Screen changed - user did something!
                        print(f"[SimpleMobileMonitor] 🎉🎉 SCREEN CHANGED: {self.last_activity} → {activity}")
                        
                        if self.callback:
                            self.callback({
                                'type': 'navigation',
                                'from': self.last_activity,
                                'to': activity,
                                'source': 'mobile',
                                'description': f'Navigated to {activity}'
                            })
                    
                    self.last_activity = activity
                else:
                    print(f"[SimpleMobileMonitor] ERROR: Bad status {r.status_code}")
                    
            except Exception as e:
                print(f"[SimpleMobileMonitor] ERROR in loop: {e}")
                import traceback
                traceback.print_exc()
                
            time.sleep(1.0)  # Check every second
            
        print("[SimpleMobileMonitor] Monitoring stopped")

# Global
_monitor: Optional[SimpleMobileMonitor] = None

def start_monitoring(session_id: str, appium_host: str, appium_port: int, callback: Callable) -> bool:
    global _monitor
    if _monitor:
        _monitor.stop()
    _monitor = SimpleMobileMonitor(session_id, appium_host, appium_port, callback)
    _monitor.start()
    return True

def stop_monitoring(session_id: str = None):
    global _monitor
    if _monitor:
        _monitor.stop()
        _monitor = None
