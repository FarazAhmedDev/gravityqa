"""Web Automation API - Playwright-based browser automation"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from services.web.playwright_controller import playwright_controller

router = APIRouter(prefix="/api/web", tags=["web-automation"])

@router.post("/browser/launch")
async def launch_browser(request: Dict = None):
    """Launch Playwright browser"""
    try:
        headless = request.get('headless', False) if request else False
        result = await playwright_controller.launch_browser(headless=headless)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/browser/navigate")
async def navigate(request: Dict):
    """Navigate to URL"""
    try:
        url = request.get('url')
        if not url:
            raise HTTPException(status_code=400, detail="URL required")
        
        result = await playwright_controller.navigate(url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/browser/screenshot")
async def get_screenshot():
    """Get current page screenshot"""
    try:
        screenshot = await playwright_controller.get_screenshot()
        if not screenshot:
            raise HTTPException(status_code=404, detail="Screenshot not available")
        
        return {
            "success": True,
            "screenshot": screenshot
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inspect/element")
async def inspect_element(request: Dict):
    """Get element info at coordinates"""
    try:
        x = request.get('x')
        y = request.get('y')
        
        if x is None or y is None:
            raise HTTPException(status_code=400, detail="x and y coordinates required")
        
        element_info = await playwright_controller.get_element_at_position(x, y)
        
        return {
            "success": True,
            "element": element_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/start")
async def start_recording():
    """Start recording actions"""
    try:
        result = playwright_controller.start_recording()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/stop")
async def stop_recording():
    """Stop recording actions"""
    try:
        result = playwright_controller.stop_recording()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/record/actions")
async def get_recorded_actions():
    """Get recorded actions"""
    try:
        actions = playwright_controller.get_recorded_actions()
        return {
            "success": True,
            "actions": actions,
            "count": len(actions)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/click")
async def click_element(request: Dict):
    """Click element"""
    try:
        selector = request.get('selector')
        if not selector:
            raise HTTPException(status_code=400, detail="selector required")
        
        result = await playwright_controller.click_element(selector)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/type")
async def type_text(request: Dict):
    """Type text into element"""
    try:
        selector = request.get('selector')
        text = request.get('text', '')
        
        if not selector:
            raise HTTPException(status_code=400, detail="selector required")
        
        result = await playwright_controller.type_text(selector, text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/scroll")
async def scroll_page(request: Dict):
    """Scroll page"""
    try:
        direction = request.get('direction', 'down')
        amount = request.get('amount', 500)
        
        result = await playwright_controller.scroll(direction, amount)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/wait")
async def wait_action(request: Dict):
    """Add wait/sleep action"""
    try:
        seconds = request.get('seconds', 3)
        
        if playwright_controller.recording:
            # Add to recorded actions
            playwright_controller.record_action('wait', data={'seconds': seconds})
            
            return {
                "success": True,
                "message": f"Wait {seconds}s added to recording"
            }
        else:
            return {
                "success": False,
                "message": "Not recording"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/playback/start")
async def start_playback(request: Dict):
    """Replay recorded actions"""
    try:
        actions = request.get('actions', [])
        
        if not actions:
            # Use recorded actions if none provided
            actions = playwright_controller.get_recorded_actions()
        
        result = await playwright_controller.replay_actions(actions)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/browser/close")
async def close_browser():
    """Close browser"""
    try:
        result = await playwright_controller.close_browser()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
