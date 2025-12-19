"""Appium Server Management API"""
from fastapi import APIRouter, HTTPException
import subprocess
import httpx
import asyncio

router = APIRouter(prefix="/api/appium", tags=["appium"])

appium_process = None

@router.post("/start")
async def start_appium():
    """Start Appium server"""
    global appium_process
    
    # Check if already running
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:4723/status", timeout=2)
            if response.status_code == 200:
                return {"status": "already_running", "message": "Appium is already running"}
    except:
        pass
    
    # Start Appium
    try:
        appium_process = subprocess.Popen(
            ["appium", "--allow-cors"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for it to start
        await asyncio.sleep(3)
        
        # Verify it started
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get("http://localhost:4723/status", timeout=2)
                if response.status_code == 200:
                    return {"status": "started", "message": "Appium started successfully"}
        except:
            raise HTTPException(status_code=500, detail="Appium failed to start")
            
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Appium not installed. Run: npm install -g appium")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start Appium: {str(e)}")

@router.post("/stop")
async def stop_appium():
    """Stop Appium server"""
    global appium_process
    
    if appium_process:
        appium_process.terminate()
        appium_process = None
        return {"status": "stopped", "message": "Appium stopped"}
    
    # Try to kill via pkill if process object not available
    try:
        subprocess.run(["pkill", "-f", "appium"], check=False)
        return {"status": "stopped", "message": "Appium stopped"}
    except:
        return {"status": "not_running", "message": "Appium was not running"}

@router.get("/status")
async def get_appium_status():
    """Check if Appium is running"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:4723/status", timeout=2)
            if response.status_code == 200:
                return {"status": "running", "url": "http://localhost:4723"}
    except:
        pass
    
    return {"status": "stopped"}
