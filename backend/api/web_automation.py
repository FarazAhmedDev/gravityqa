"""Web Automation API - Playwright-based browser automation with Recording"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/web", tags=["web-automation"])


@router.post("/browser/launch")
async def launch_browser_old(request: Dict = None):
    """Launch Playwright browser"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        headless = request.get('headless', False) if request else False
        url = request.get('url', None) if request else None
        
        logger.info(f"[Launch] Starting browser launch... headless={headless}, url={url}")
        
        # Launch browser
        result = await playwright_controller.launch_browser(headless=headless)
        
        logger.info(f"[Launch] launch_browser returned: {result}")
        logger.info(f"[Launch] playwright_controller.page = {playwright_controller.page}")
        logger.info(f"[Launch] playwright_controller.browser = {playwright_controller.browser}")
        
        if not result.get('success'):
            logger.error(f"[Launch] Browser launch failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get('error', 'Launch failed'))
        
        # Navigate if URL provided
        if url:
            logger.info(f"[Launch] Navigating to: {url}")
            nav_result = await playwright_controller.navigate(url)
            logger.info(f"[Launch] Navigate result: {nav_result}")
            if nav_result.get('success'):
                result['url'] = url
                result['title'] = nav_result.get('title', '')
        
        logger.info(f"[Launch] Final result: {result}")
        logger.info(f"[Launch] Page after launch: {playwright_controller.page}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Launch] Exception: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"[Launch] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/browser/navigate")
async def navigate(request: Dict):
    """Navigate to URL"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        url = request.get('url')
        if not url:
            raise HTTPException(status_code=400, detail="URL required")
        
        result = await playwright_controller.navigate(url)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Navigation failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Navigate failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/browser/screenshot")
async def get_screenshot():
    """Get current page screenshot as base64"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        logger.info("[Screenshot] Attempting to capture...")
        
        # Check if browser is available
        if not playwright_controller.page:
            logger.error("[Screenshot] No page available - browser not launched properly")
            raise HTTPException(status_code=400, detail="Browser not launched or page not available")
        
        logger.info("[Screenshot] Page exists, calling get_screenshot()...")
        screenshot = await playwright_controller.get_screenshot()
        
        if not screenshot:
            logger.error("[Screenshot] get_screenshot() returned None")
            raise HTTPException(status_code=500, detail="Screenshot capture returned None")
        
        logger.info(f"[Screenshot] Success! Screenshot size: {len(screenshot)} bytes")
        
        return {
            "success": True,
            "screenshot": f"data:image/png;base64,{screenshot}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Screenshot] Exception: {type(e).__name__}: {str(e)}")
        import traceback
        logger.error(f"[Screenshot] Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")


@router.post("/record/start")
async def start_recording():
    """Start recording actions"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        result = playwright_controller.start_recording()
        
        logger.info("[Recording] Started")
        
        return result
        
    except Exception as e:
        logger.error(f"Start recording failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record/stop")
async def stop_recording():
    """Stop recording actions"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        result = playwright_controller.stop_recording()
        
        logger.info(f"[Recording] Stopped - {result.get('actions_count', 0)} actions")
        
        return result
        
    except Exception as e:
        logger.error(f"Stop recording failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/record/actions")
async def get_recorded_actions():
    """Get recorded actions"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        actions = playwright_controller.get_recorded_actions()
        
        return {
            "success": True,
            "actions": actions,
            "count": len(actions)
        }
        
    except Exception as e:
        logger.error(f"Get actions failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/interact")
async def interact_element(request: Dict):
    """Click at coordinates"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        x = request.get('x')
        y = request.get('y')
        
        if x is None or y is None:
            raise HTTPException(status_code=400, detail="x and y required")
        
        result = await playwright_controller.click_at_position(x, y)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Click failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Interact failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/scroll")
async def scroll_page(request: Dict):
    """Scroll page"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        direction = request.get('direction', 'down')
        amount = request.get('amount', 500)
        
        result = await playwright_controller.scroll(direction, amount)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Scroll failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Scroll failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/inspect")
async def inspect_element(request: Dict):
    """Inspect element at coordinates"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        x = request.get('x')
        y = request.get('y')
        
        if x is None or y is None:
            raise HTTPException(status_code=400, detail="x and y required")
        
        result = await playwright_controller.inspect_at_position(x, y)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Inspect failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inspect failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/action/wait")
async def wait_action(request: Dict):
    """Add wait/sleep action"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        seconds = request.get('seconds', 3)
        
        if playwright_controller.is_recording:
            playwright_controller.recorded_actions.append({
                "id": len(playwright_controller.recorded_actions) + 1,
                "type": "wait",
                "data": {"seconds": seconds},
                "timestamp": datetime.now().isoformat(),
                "enabled": True,
                "status": "success"
            })
            
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
        logger.error(f"Wait action failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/playback/start")
async def start_playback(request: Dict):
    """Replay recorded actions"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        actions = request.get('actions', [])
        fresh_browser = request.get('fresh_browser', True)
        
        if not actions:
            actions = playwright_controller.get_recorded_actions()
        
        result = await playwright_controller.replay_actions(actions, fresh_browser=fresh_browser)
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Playback failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Playback failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/browser/close")
async def close_browser():
    """Close browser"""
    try:
        from services.web.playwright_controller import playwright_controller
        
        result = await playwright_controller.close_browser()
        
        if not result.get('success'):
            raise HTTPException(status_code=500, detail=result.get('error', 'Close failed'))
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Close failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
