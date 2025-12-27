"""
Phase 5: Web Automation API Routes
Selenium WebDriver integration endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

# Import will be added to main.py
# from backend.services.web.selenium_manager import selenium_manager

router = APIRouter(prefix="/api/web", tags=["web"])
logger = logging.getLogger(__name__)


# Request Models
class LaunchBrowserRequest(BaseModel):
    browser: str = 'chrome'  # 'chrome', 'firefox', 'safari'
    url: Optional[str] = None
    headless: bool = False
    window_size: tuple = (1920, 1080)


class CloseSessionRequest(BaseModel):
    session_id: str


class NavigateRequest(BaseModel):
    session_id: str
    url: str


class ElementActionRequest(BaseModel):
    session_id: str
    by: str  # 'xpath', 'css', 'id', 'name'
    value: str
    wait_timeout: int = 10


class SendKeysRequest(BaseModel):
    session_id: str
    by: str
    value: str
    text: str
    wait_timeout: int = 10


class ExecuteScriptRequest(BaseModel):
    session_id: str
    script: str


class ScreenshotRequest(BaseModel):
    session_id: str
    filepath: Optional[str] = None


# API Endpoints
@router.post("/launch")
async def launch_browser(request: LaunchBrowserRequest):
    """
    Launch a new browser session using Playwright
    
    Returns:
        {
            "session_id": "uuid",
            "browser": "chrome",
            "url": "https://example.com",
            "status": "launched"
        }
    """
    try:
        from services.web.playwright_controller import playwright_controller
        import uuid
        
        logger.info(f"[web_routes /launch] Launching browser: {request.browser}, url={request.url}")
        
        # Launch Playwright browser
        result = await playwright_controller.launch_browser(headless=request.headless)
        
        logger.info(f"[web_routes /launch] Launch result: {result}")
        logger.info(f"[web_routes /launch] playwright_controller.page = {playwright_controller.page}")
        
        if not result.get('success'):
            logger.error(f"[web_routes /launch] Launch failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=result.get('error', 'Browser launch failed'))
        
        # Navigate if URL provided
        if request.url:
            logger.info(f"[web_routes /launch] Navigating to: {request.url}")
            nav_result = await playwright_controller.navigate(request.url)
            logger.info(f"[web_routes /launch] Navigate result: {nav_result}")
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        logger.info(f"[web_routes /launch] Success! Session: {session_id}, Page: {playwright_controller.page is not None}")
        
        return {
            "session_id": session_id,
            "browser": request.browser,
            "url": request.url or "about:blank",
            "status": "launched"
        }
    
    except Exception as e:
        logger.error(f"[API] Launch failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/close")
async def close_browser(request: CloseSessionRequest):
    """Close browser session"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        success = selenium_manager.close_session(request.session_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"status": "closed", "session_id": request.session_id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Close failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/navigate")
async def navigate(request: NavigateRequest):
    """Navigate to URL"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.navigate(request.session_id, request.url)
        
        return {
            "status": "navigated",
            "url": request.url,
            "current_url": selenium_manager.get_current_url(request.session_id)
        }
    
    except Exception as e:
        logger.error(f"[API] Navigate failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/back")
async def go_back(request: CloseSessionRequest):
    """Go back in browser history"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.go_back(request.session_id)
        
        return {
            "status": "navigated_back",
            "current_url": selenium_manager.get_current_url(request.session_id)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forward")
async def go_forward(request: CloseSessionRequest):
    """Go forward in browser history"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.go_forward(request.session_id)
        
        return {
            "status": "navigated_forward",
            "current_url": selenium_manager.get_current_url(request.session_id)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_page(request: CloseSessionRequest):
    """Refresh current page"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.refresh(request.session_id)
        
        return {"status": "refreshed"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/click")
async def click_element(request: ElementActionRequest):
    """Click an element"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.click_element(
            request.session_id,
            request.by,
            request.value,
            request.wait_timeout
        )
        
        return {"status": "clicked", "element": f"{request.by}={request.value}"}
    
    except Exception as e:
        logger.error(f"[API] Click failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send-keys")
async def send_keys(request: SendKeysRequest):
    """Send keys to element"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        selenium_manager.send_keys(
            request.session_id,
            request.by,
            request.value,
            request.text,
            request.wait_timeout
        )
        
        return {
            "status": "keys_sent",
            "element": f"{request.by}={request.value}",
            "text": request.text
        }
    
    except Exception as e:
        logger.error(f"[API] Send keys failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/screenshot")
async def take_screenshot(request: ScreenshotRequest):
    """Take screenshot"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        filepath = selenium_manager.take_screenshot(
            request.session_id,
            request.filepath
        )
        
        return {"status": "captured", "filepath": filepath}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute-script")
async def execute_script(request: ExecuteScriptRequest):
    """Execute JavaScript"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        result = selenium_manager.execute_script(
            request.session_id,
            request.script
        )
        
        return {"status": "executed", "result": result}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions")
async def get_sessions():
    """Get all active sessions info"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        return selenium_manager.get_sessions_info()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/session/{session_id}/info")
async def get_session_info(session_id: str):
    """Get specific session info"""
    try:
        from services.web.selenium_manager import selenium_manager
        
        return {
            "session_id": session_id,
            "url": selenium_manager.get_current_url(session_id),
            "title": selenium_manager.get_title(session_id)
        }
    
    except Exception as e:
        raise HTTPException(status_code=404, detail="Session not found")
