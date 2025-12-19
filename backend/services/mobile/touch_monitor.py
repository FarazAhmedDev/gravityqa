"""Mobile Touch Event Monitor - Records direct taps/swipes on physical device"""
import subprocess
import threading
import re
import time
from typing import Optional, Callable, Dict

class TouchMonitor:
    """Monitor touch events on Android device using ADB getevent"""
    
    def __init__(self, device_id: str, callback: Callable):
        self.device_id = device_id
        self.callback = callback
        self.process: Optional[subprocess.Popen] = None
        self.thread: Optional[threading.Thread] = None
        self.running = False
        
        # Touch state tracking
        self.current_x = 0
        self.current_y = 0
        self.touch_down = False
        self.touch_start_x = 0
        self.touch_start_y = 0
        self.touch_start_time = 0
        
        # Device screen resolution (will auto-detect)
        self.screen_width = 1080
        self.screen_height = 2400
        
    def start(self):
        """Start monitoring touch events"""
        if self.running:
            print(f"[TouchMonitor] Already running for {self.device_id}")
            return
            
        print(f"[TouchMonitor] Starting for device {self.device_id}")
        self._detect_screen_size()
        
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
    def stop(self):
        """Stop monitoring"""
        print(f"[TouchMonitor] Stopping for {self.device_id}")
        self.running = False
        
        if self.process:
            self.process.terminate()
            self.process.wait(timeout=2)
            
        if self.thread:
            self.thread.join(timeout=2)
            
    def _detect_screen_size(self):
        """Detect device screen resolution"""
        try:
            result = subprocess.run(
                ['adb', '-s', self.device_id, 'shell', 'wm', 'size'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            # Output: "Physical size: 1080x2400"
            match = re.search(r'(\d+)x(\d+)', result.stdout)
            if match:
                self.screen_width = int(match.group(1))
                self.screen_height = int(match.group(2))
                print(f"[TouchMonitor] Screen size: {self.screen_width}x{self.screen_height}")
                
        except Exception as e:
            print(f"[TouchMonitor] Failed to detect screen size: {e}")
            
    def _detect_touch_device(self) -> str:
        """Detect which /dev/input/eventX is the touchscreen"""
        try:
            # Get list of input devices
            result = subprocess.run(
                ['adb', '-s', self.device_id, 'shell', 'getevent', '-il'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            # Parse output to find touchscreen device
            lines = result.stdout.split('\n')
            current_device = None
            
            for line in lines:
                if 'add device' in line:
                    # Extract device path: "add device 4: /dev/input/event2"
                    match = re.search(r'/dev/input/(event\d+)', line)
                    if match:
                        current_device = f'/dev/input/{match.group(1)}'
                        
                elif current_device and ('name:' in line.lower()):
                    # Check if this is a touchscreen device
                    # Common names: fts, touchscreen, ft, synaptics, etc.
                    if any(name in line.lower() for name in ['fts', 'touchscreen', 'ft5', 'synaptics', 'touch']):
                        print(f"[TouchMonitor] Found touchscreen device: {current_device}")
                        return current_device
                        
            # Fallback to event2 (common for touchscreens)
            print(f"[TouchMonitor] Could not auto-detect, using fallback: /dev/input/event2")
            return '/dev/input/event2'
            
        except Exception as e:
            print(f"[TouchMonitor] Failed to detect touch device: {e}, using fallback")
            return '/dev/input/event2'
            
    def _monitor_loop(self):
        """Main monitoring loop - parses getevent output"""
        try:
            # Auto-detect touchscreen device
            touch_device = self._detect_touch_device()
            
            # Start getevent to capture touch events
            self.process = subprocess.Popen(
                ['adb', '-s', self.device_id, 'shell', 'getevent', '-lt', touch_device],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            print(f"[TouchMonitor] Monitoring {touch_device} for {self.device_id}")
            
            for line in self.process.stdout:
                if not self.running:
                    break
                    
                self._parse_event_line(line.strip())
                
        except Exception as e:
            print(f"[TouchMonitor] Error in monitor loop: {e}")
        finally:
            print(f"[TouchMonitor] Monitoring stopped for {self.device_id}")
            
    def _parse_event_line(self, line: str):
        """Parse single getevent line"""
        try:
            # Example lines:
            # [    1234.567890] EV_ABS       ABS_MT_POSITION_X    000002d0
            # [    1234.567890] EV_ABS       ABS_MT_POSITION_Y    000004b0
            # [    1234.567890] EV_KEY       BTN_TOUCH            DOWN
            
            if 'ABS_MT_POSITION_X' in line:
                # Extract X coordinate (hex format)
                match = re.search(r'ABS_MT_POSITION_X\s+([0-9a-f]+)', line)
                if match:
                    raw_x = int(match.group(1), 16)
                    self.current_x = raw_x
                    
            elif 'ABS_MT_POSITION_Y' in line:
                # Extract Y coordinate (hex format)
                match = re.search(r'ABS_MT_POSITION_Y\s+([0-9a-f]+)', line)
                if match:
                    raw_y = int(match.group(1), 16)
                    self.current_y = raw_y
                    
            elif 'BTN_TOUCH' in line or 'ABS_MT_TRACKING_ID' in line:
                # Touch down/up detection
                if 'DOWN' in line or ('ABS_MT_TRACKING_ID' in line and '00000000' not in line):
                    if not self.touch_down:
                        self._handle_touch_down()
                        
                elif 'UP' in line or ('ABS_MT_TRACKING_ID' in line and 'ffffffff' in line):
                    if self.touch_down:
                        self._handle_touch_up()
                        
        except Exception as e:
            # Silently ignore parse errors
            pass
            
    def _handle_touch_down(self):
        """Handle touch down event"""
        self.touch_down = True
        self.touch_start_x = self.current_x
        self.touch_start_y = self.current_y
        self.touch_start_time = time.time()
        
        print(f"[TouchMonitor] Touch DOWN at ({self.current_x}, {self.current_y})")
        
    def _handle_touch_up(self):
        """Handle touch up event - determine if tap or swipe"""
        self.touch_down = False
        
        duration = time.time() - self.touch_start_time
        dx = self.current_x - self.touch_start_x
        dy = self.current_y - self.touch_start_y
        distance = (dx**2 + dy**2) ** 0.5
        
        print(f"[TouchMonitor] Touch UP at ({self.current_x}, {self.current_y})")
        print(f"[TouchMonitor] Distance: {distance:.0f}, Duration: {duration:.2f}s")
        
        # Determine action type
        if distance < 50 and duration < 0.5:
            # TAP
            action = {
                'type': 'tap',
                'x': self.current_x,
                'y': self.current_y,
                'source': 'mobile'
            }
            print(f"[TouchMonitor] 👆 TAP detected at ({self.current_x}, {self.current_y})")
            
        elif distance > 50:
            # SWIPE
            action = {
                'type': 'swipe',
                'start_x': self.touch_start_x,
                'start_y': self.touch_start_y,
                'end_x': self.current_x,
                'end_y': self.current_y,
                'duration': duration,
                'source': 'mobile'
            }
            print(f"[TouchMonitor] 👉 SWIPE detected: ({self.touch_start_x},{self.touch_start_y}) → ({self.current_x},{self.current_y})")
            
        else:
            # LONG PRESS or other
            action = {
                'type': 'long_press',
                'x': self.current_x,
                'y': self.current_y,
                'duration': duration,
                'source': 'mobile'
            }
            print(f"[TouchMonitor] ⏱️ LONG PRESS detected at ({self.current_x}, {self.current_y})")
            
        # Call callback with detected action
        if self.callback:
            try:
                self.callback(action)
            except Exception as e:
                print(f"[TouchMonitor] Callback error: {e}")

# Global monitor instances
_active_monitors: Dict[str, TouchMonitor] = {}

def start_monitoring(device_id: str, callback: Callable) -> bool:
    """Start touch event monitoring for a device"""
    global _active_monitors
    
    if device_id in _active_monitors:
        print(f"[TouchMonitor] Already monitoring {device_id}")
        return True
        
    monitor = TouchMonitor(device_id, callback)
    monitor.start()
    _active_monitors[device_id] = monitor
    return True

def stop_monitoring(device_id: str):
    """Stop touch event monitoring for a device"""
    global _active_monitors
    
    if device_id in _active_monitors:
        _active_monitors[device_id].stop()
        del _active_monitors[device_id]
        print(f"[TouchMonitor] Stopped monitoring {device_id}")
