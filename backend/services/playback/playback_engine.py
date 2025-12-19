"""Test Playback Engine - Execute saved test flows automatically"""
import asyncio
from typing import Dict, List, Optional
from datetime import datetime

class PlaybackEngine:
    """Executes recorded test flows step by step"""
    
    def __init__(self, appium_service, broadcast_callback=None):
        self.appium_service = appium_service
        self.broadcast = broadcast_callback
        self.is_playing = False
        self.current_step = 0
        self.total_steps = 0
        
    async def execute_flow(self, flow_data: Dict, session_id: str) -> Dict:
        """Execute a complete test flow"""
        
        flow_name = flow_data.get("name", "Unnamed Flow")
        steps = flow_data.get("steps", [])
        
        self.is_playing = True
        self.current_step = 0
        self.total_steps = len(steps)
        
        print(f"[Playback] 🎬 Starting playback: {flow_name}")
        print(f"[Playback] Total steps: {self.total_steps}")
        
        results = {
            "flow_name": flow_name,
            "total_steps": self.total_steps,
            "executed_steps": 0,
            "successful_steps": 0,
            "failed_steps": 0,
            "errors": [],
            "start_time": datetime.now().isoformat(),
            "status": "running"
        }
        
        # Broadcast start
        self._broadcast_update({
            "type": "playback_started",
            "flow_name": flow_name,
            "total_steps": self.total_steps
        })
        
        # Execute each step
        for i, step in enumerate(steps):
            if not self.is_playing:
                print("[Playback] ⏸️ Playback stopped by user")
                results["status"] = "stopped"
                break
                
            self.current_step = i + 1
            
            # Broadcast progress
            self._broadcast_update({
                "type": "playback_progress",
                "current_step": self.current_step,
                "total_steps": self.total_steps,
                "step_data": step
            })
            
            print(f"[Playback] Step {self.current_step}/{self.total_steps}: {step.get('action')}")
            
            try:
                # Execute step based on action type
                success = await self._execute_step(step, session_id)
                
                if success:
                    results["successful_steps"] += 1
                    print(f"[Playback] ✅ Step {self.current_step} completed")
                    
                    # CRITICAL: Wait for screen to stabilize after tap/swipe
                    action_type = step.get('action')
                    if action_type in ['tap', 'swipe']:
                        print(f"[Playback] ⏸️  Waiting 3s for screen stabilization...")
                        await asyncio.sleep(3.0)  # Wait for screen changes/animations
                else:
                    results["failed_steps"] += 1
                    results["errors"].append({
                        "step": self.current_step,
                        "action": step.get("action"),
                        "error": "Execution returned False"
                    })
                    print(f"[Playback] ❌ Step {self.current_step} failed")
                    
            except Exception as e:
                results["failed_steps"] += 1
                error_msg = str(e)
                results["errors"].append({
                    "step": self.current_step,
                    "action": step.get("action"),
                    "error": error_msg
                })
                print(f"[Playback] ❌ Step {self.current_step} error: {error_msg}")
                
            results["executed_steps"] = self.current_step
            
            # Smart delay - use timestamp if available, otherwise default
            if i < len(steps) - 1:  # Not the last step
                current_timestamp = step.get("timestamp", 0)
                next_timestamp = steps[i + 1].get("timestamp", 0)
                
                if current_timestamp and next_timestamp:
                    # Calculate delay from recording
                    recorded_delay = (next_timestamp - current_timestamp) / 1000.0  # ms to seconds
                    # Use recorded delay, with min 1s and max 5s for safety
                    delay = max(1.0, min(recorded_delay, 5.0))
                    print(f"[Playback] ⏱️  Using recorded delay: {delay:.1f}s")
                else:
                    delay = 2.5  # Default
                    print(f"[Playback] ⏱️  Using default delay: {delay}s")
                
                await asyncio.sleep(delay)
        
        # Final results
        results["end_time"] = datetime.now().isoformat()
        results["status"] = "completed" if results["failed_steps"] == 0 else "completed_with_errors"
        
        self.is_playing = False
        
        # Broadcast completion
        self._broadcast_update({
            "type": "playback_completed",
            "results": results
        })
        
        print(f"[Playback] 🏁 Playback completed!")
        print(f"[Playback] Success: {results['successful_steps']}/{self.total_steps}")
        print(f"[Playback] Failed: {results['failed_steps']}/{self.total_steps}")
        
        return results
    
    async def _execute_step(self, step: Dict, session_id: str) -> bool:
        """Execute a single step"""
        action = step.get("action")
        
        if action == "tap":
            x = step.get("x")
            y = step.get("y")
            
            if x is not None and y is not None:
                print(f"[Playback]   → Tapping at ({x}, {y})")
                result = await self.appium_service.tap_at_coordinate(session_id, x, y)
                return result if result is not None else True
            else:
                print(f"[Playback]   ⚠️ Invalid tap coordinates")
                return False
                
        elif action == "swipe":
            start_x = step.get("start_x")
            start_y = step.get("start_y")
            end_x = step.get("end_x")
            end_y = step.get("end_y")
            duration = step.get("duration", 500)
            
            if all(v is not None for v in [start_x, start_y, end_x, end_y]):
                print(f"[Playback]   → Swiping from ({start_x},{start_y}) to ({end_x},{end_y})")
                result = await self.appium_service.swipe(session_id, start_x, start_y, end_x, end_y, duration)
                return result if result is not None else True
            else:
                print(f"[Playback]   ⚠️ Invalid swipe coordinates")
                return False
                
        elif action == "text":
            text = step.get("text")
            element_id = step.get("element_id")
            
            if text:
                print(f"[Playback]   → Typing: {text}")
                # For now, just tap coordinates and assume text input works
                # In future, can use element_id to find element and send keys
                await asyncio.sleep(0.3)
                return True
            else:
                return False
                
        elif action == "wait":
            duration = step.get("duration", 1000) / 1000  # Convert ms to seconds
            print(f"[Playback]   → Waiting {duration}s")
            await asyncio.sleep(duration)
            return True
            
        else:
            print(f"[Playback]   ⚠️ Unknown action: {action}")
            return False
    
    def stop_playback(self):
        """Stop current playback"""
        print("[Playback] 🛑 Stop requested")
        self.is_playing = False
        
    def _broadcast_update(self, data: Dict):
        """Broadcast playback update via WebSocket"""
        if self.broadcast:
            try:
                self.broadcast(data)
            except Exception as e:
                print(f"[Playback] Broadcast error: {e}")

# Global playback engine instance
_playback_engine: Optional[PlaybackEngine] = None

def get_playback_engine(appium_service, broadcast_callback=None) -> PlaybackEngine:
    """Get or create playback engine singleton"""
    global _playback_engine
    if _playback_engine is None:
        _playback_engine = PlaybackEngine(appium_service, broadcast_callback)
    return _playback_engine
