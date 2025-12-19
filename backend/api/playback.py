"""Playback API - Execute saved flows with live progress updates"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.flow import Flow
from services.mobile.appium_service import AppiumService
from services.playback.playback_engine import get_playback_engine
from pydantic import BaseModel
import json

router = APIRouter(prefix="/api/playback", tags=["playback"])
appium_service = AppiumService()

class PlaybackRequest(BaseModel):
    flow_id: int
    device_id: str

class StopPlaybackRequest(BaseModel):
    flow_id: int

@router.post("/start")
async def start_playback(request: PlaybackRequest, db: Session = Depends(get_db)):
    """Execute a saved flow on a device with AUTOMATIC app launch"""
    
    # Get flow from database
    flow = db.query(Flow).filter(Flow.id == request.flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    print(f"[Playback API] 🎬 Starting playback for flow: {flow.name}")
    print(f"[Playback API] Device: {request.device_id}")
    
    try:
        # ALWAYS restart app fresh for consistent playback 🚀
        print(f"[Playback API] 🔄 Preparing fresh app launch...")
        
        import asyncio
        import subprocess
        
        # 1. Close existing session if any
        if appium_service.active_sessions:
            print("[Playback API] 🛑 Closing existing sessions...")
            for session_id in list(appium_service.active_sessions.keys()):
                try:
                    await appium_service.close_session(session_id)
                    print(f"[Playback API] ✅ Session closed: {session_id}")
                except Exception as e:
                    print(f"[Playback API] ⚠️ Error closing session: {e}")
            
            # Wait for session cleanup
            print("[Playback API] ⏱️ Waiting 2s for session cleanup...")
            await asyncio.sleep(2)
        
        # 2. Force stop and clear app data using adb
        print(f"[Playback API] 🧹 Force stopping app: {flow.app_package}")
        try:
            # Force stop app
            result = subprocess.run(
                ['adb', '-s', request.device_id, 'shell', 'am', 'force-stop', flow.app_package],
                capture_output=True,
                timeout=5
            )
            print(f"[Playback API] Force stop result: {result.returncode}")
            
            # Small wait
            await asyncio.sleep(1)
            
            # Clear app data
            print(f"[Playback API] 🗑️ Clearing app data...")
            result = subprocess.run(
                ['adb', '-s', request.device_id, 'shell', 'pm', 'clear', flow.app_package],
                capture_output=True,
                timeout=10
            )
            print(f"[Playback API] ✅ App cleared! Result: {result.returncode}")
            
            # Wait after clearing
            await asyncio.sleep(2)
            
        except Exception as e:
            print(f"[Playback API] ⚠️ Could not clear app: {e}")
        
        # 3. Launch app fresh
        print("[Playback API] 🚀 Launching app fresh...")
        session_id = await appium_service.create_session(
            device_id=request.device_id,
            platform="Android",
            app_package=flow.app_package,
            app_activity=flow.app_activity if hasattr(flow, 'app_activity') else ".MainActivity"
        )
        
        if not session_id:
            raise HTTPException(
                status_code=500,
                detail="Failed to launch app"
            )
        
        print(f"[Playback API] ✅ App launched! Session: {session_id}")
        
        # 4. Wait 10 seconds for app to fully stabilize
        print("[Playback API] ⏱️ Waiting 10 seconds for app to stabilize...")
        await asyncio.sleep(10)
        print("[Playback API] ✅ App ready! Starting playback...")
        
        
        # Parse flow steps (stored as JSON string)
        flow_data = {
            "name": flow.name,
            "steps": json.loads(flow.steps) if isinstance(flow.steps, str) else flow.steps
        }
        
        print(f"[Playback API] Flow has {len(flow_data['steps'])} steps")
        
        # Get playback engine with broadcast callback
        def broadcast_callback(data):
            # This will be used for WebSocket broadcasting (TODO: integrate)
            print(f"[Playback] Broadcast: {data.get('type')}")
        
        engine = get_playback_engine(appium_service, broadcast_callback)
        
        # Execute flow
        results = await engine.execute_flow(flow_data, session_id)
        
        print(f"[Playback API] ✅ Playback completed")
        print(f"[Playback API] Success rate: {results['successful_steps']}/{results['total_steps']}")
        
        return results
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Playback API] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Playback failed: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Playback API] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Playback failed: {str(e)}")

@router.post("/stop")
async def stop_playback(request: StopPlaybackRequest):
    """Stop current playback"""
    try:
        engine = get_playback_engine(appium_service)
        engine.stop_playback()
        
        return {"message": "Playback stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flows")
async def list_flows(db: Session = Depends(get_db)):
    """List all saved flows for playback selection"""
    try:
        flows = db.query(Flow).all()
        
        return {
            "flows": [
                {
                    "id": flow.id,
                    "name": flow.name,
                    "device_platform": flow.device_platform,
                    "app_package": flow.app_package,
                    "step_count": len(json.loads(flow.steps) if isinstance(flow.steps, str) else flow.steps),
                    "created_at": flow.created_at.isoformat() if flow.created_at else None
                }
                for flow in flows
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
