"""
Phase 5: Selenium WebDriver Manager
Manages browser sessions and WebDriver instances
"""

from typing import Dict, Optional
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.safari.service import Service as SafariService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
import uuid
import logging

logger = logging.getLogger(__name__)


class SeleniumManager:
    """Manages Selenium WebDriver instances and browser sessions"""
    
    def __init__(self):
        self.sessions: Dict[str, webdriver.Remote] = {}
        self.session_metadata: Dict[str, dict] = {}
    
    def create_session(
        self,
        browser: str = 'chrome',
        url: Optional[str] = None,
        headless: bool = False,
        window_size: tuple = (1920, 1080)
    ) -> str:
        """
        Create a new browser session
        
        Args:
            browser: Browser type ('chrome', 'firefox', 'safari')
            url: Initial URL to navigate to
            headless: Run in headless mode
            window_size: Browser window size (width, height)
        
        Returns:
            session_id: Unique session identifier
        """
        session_id = str(uuid.uuid4())
        
        try:
            logger.info(f"[Selenium] Creating {browser} session: {session_id}")
            
            # Create driver based on browser type
            if browser == 'chrome':
                options = webdriver.ChromeOptions()
                if headless:
                    options.add_argument('--headless')
                
                # Window configuration
                options.add_argument(f'--window-size={window_size[0]},{window_size[1]}')
                
                # Minimize window on start to avoid stealing focus
                options.add_argument('--window-position=-2400,-2400')  # Move off-screen initially
                
                # Stability options
                options.add_argument('--disable-blink-features=AutomationControlled')
                options.add_argument('--disable-gpu')  # Helps with screenshot stability
                options.add_argument('--no-sandbox')   # Helps avoid crashes
                options.add_argument('--disable-dev-shm-usage')  # Better memory handling
                
                # Logging
                options.add_experimental_option('excludeSwitches', ['enable-logging'])
                options.add_experimental_option('useAutomationExtension', False)
                
                driver = webdriver.Chrome(
                    service=ChromeService(ChromeDriverManager().install()),
                    options=options
                )
            
            elif browser == 'firefox':
                options = webdriver.FirefoxOptions()
                if headless:
                    options.add_argument('--headless')
                
                driver = webdriver.Firefox(
                    service=FirefoxService(GeckoDriverManager().install()),
                    options=options
                )
                driver.set_window_size(window_size[0], window_size[1])
            
            elif browser == 'safari':
                # Safari doesn't need driver installation on macOS
                driver = webdriver.Safari()
                driver.set_window_size(window_size[0], window_size[1])
            
            else:
                raise ValueError(f"Unsupported browser: {browser}")
            
            # Store session
            self.sessions[session_id] = driver
            self.session_metadata[session_id] = {
                'browser': browser,
                'created_at': uuid.uuid1().time,
                'headless': headless
            }
            
            # Navigate to URL if provided
            if url:
                driver.get(url)
                logger.info(f"[Selenium] Navigated to: {url}")
            
            logger.info(f"[Selenium] ✅ Session created: {session_id}")
            return session_id
        
        except Exception as e:
            logger.error(f"[Selenium] ❌ Failed to create session: {str(e)}")
            raise Exception(f"Failed to create browser session: {str(e)}")
    
    def close_session(self, session_id: str) -> bool:
        """Close and remove a browser session"""
        if session_id not in self.sessions:
            logger.warning(f"[Selenium] Session not found: {session_id}")
            return False
        
        try:
            driver = self.sessions[session_id]
            driver.quit()
            
            del self.sessions[session_id]
            del self.session_metadata[session_id]
            
            logger.info(f"[Selenium] ✅ Session closed: {session_id}")
            return True
        
        except Exception as e:
            logger.error(f"[Selenium] ❌ Failed to close session: {str(e)}")
            return False
    
    def navigate(self, session_id: str, url: str) -> bool:
        """Navigate to URL in existing session"""
        driver = self._get_driver(session_id)
        
        try:
            driver.get(url)
            logger.info(f"[Selenium] Navigated to: {url}")
            return True
        except Exception as e:
            logger.error(f"[Selenium] ❌ Navigation failed: {str(e)}")
            raise Exception(f"Navigation failed: {str(e)}")
    
    def go_back(self, session_id: str) -> bool:
        """Navigate back in browser history"""
        driver = self._get_driver(session_id)
        driver.back()
        return True
    
    def go_forward(self, session_id: str) -> bool:
        """Navigate forward in browser history"""
        driver = self._get_driver(session_id)
        driver.forward()
        return True
    
    def refresh(self, session_id: str) -> bool:
        """Refresh current page"""
        driver = self._get_driver(session_id)
        driver.refresh()
        return True
    
    def get_current_url(self, session_id: str) -> str:
        """Get current URL"""
        driver = self._get_driver(session_id)
        return driver.current_url
    
    def get_title(self, session_id: str) -> str:
        """Get page title"""
        driver = self._get_driver(session_id)
        return driver.title
    
    def take_screenshot(self, session_id: str, filepath: str = None) -> str:
        """Take screenshot of current page with retry logic"""
        driver = self._get_driver(session_id)
        
        if filepath is None:
            filepath = f"/tmp/screenshot_{session_id}_{uuid.uuid4()}.png"
        
        # Try multiple times with small delay
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.save_screenshot(filepath)
                logger.info(f"[Selenium] Screenshot saved: {filepath}")
                return filepath
            except Exception as e:
                logger.warning(f"[Selenium] Screenshot attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    import time
                    time.sleep(0.5)  # Wait 500ms before retry
                else:
                    raise Exception(f"Screenshot failed after {max_retries} attempts: {str(e)}")
    
    def get_screenshot_as_base64(self, session_id: str) -> str:
        """Get screenshot directly as base64 (avoids file I/O)"""
        driver = self._get_driver(session_id)
        
        try:
            # This returns base64 string directly, no file needed!
            screenshot_base64 = driver.get_screenshot_as_base64()
            logger.info(f"[Selenium] Screenshot captured as base64")
            return screenshot_base64
        except Exception as e:
            logger.error(f"[Selenium] Base64 screenshot failed: {str(e)}")
            raise Exception(f"Screenshot capture failed: {str(e)}")
    
    def execute_script(self, session_id: str, script: str) -> any:
        """Execute JavaScript in browser"""
        driver = self._get_driver(session_id)
        return driver.execute_script(script)
    
    def find_element(
        self,
        session_id: str,
        by: str = 'xpath',
        value: str = None,
        wait_timeout: int = 10
    ):
        """
        Find element on page
        
        Args:
            session_id: Session ID
            by: Locator strategy ('xpath', 'css', 'id', 'name', 'tag', 'class')
            value: Locator value
            wait_timeout: Maximum wait time in seconds
        """
        driver = self._get_driver(session_id)
        
        # Map locator strategies
        by_map = {
            'xpath': By.XPATH,
            'css': By.CSS_SELECTOR,
            'id': By.ID,
            'name': By.NAME,
            'tag': By.TAG_NAME,
            'class': By.CLASS_NAME
        }
        
        if by not in by_map:
            raise ValueError(f"Invalid locator strategy: {by}")
        
        try:
            element = WebDriverWait(driver, wait_timeout).until(
                EC.presence_of_element_located((by_map[by], value))
            )
            return element
        except Exception as e:
            logger.error(f"[Selenium] Element not found: {by}={value}")
            raise Exception(f"Element not found: {str(e)}")
    
    def click_element(
        self,
        session_id: str,
        by: str,
        value: str,
        wait_timeout: int = 10
    ) -> bool:
        """Click an element"""
        element = self.find_element(session_id, by, value, wait_timeout)
        element.click()
        logger.info(f"[Selenium] Clicked: {by}={value}")
        return True
    
    def send_keys(
        self,
        session_id: str,
        by: str,
        value: str,
        text: str,
        wait_timeout: int = 10
    ) -> bool:
        """Send keys to an element"""
        element = self.find_element(session_id, by, value, wait_timeout)
        element.clear()
        element.send_keys(text)
        logger.info(f"[Selenium] Input: {by}={value}, text={text}")
        return True
    
    def get_sessions_info(self) -> dict:
        """Get information about all active sessions"""
        return {
            'total_sessions': len(self.sessions),
            'sessions': {
                sid: {
                    **meta,
                    'url': self.get_current_url(sid),
                    'title': self.get_title(sid)
                }
                for sid, meta in self.session_metadata.items()
            }
        }
    
    def _get_driver(self, session_id: str) -> webdriver.Remote:
        """Get driver instance, raise if not found"""
        if session_id not in self.sessions:
            raise Exception(f"Session not found: {session_id}")
        return self.sessions[session_id]
    
    def cleanup_all(self):
        """Close all sessions (for shutdown)"""
        logger.info(f"[Selenium] Cleaning up {len(self.sessions)} sessions")
        for session_id in list(self.sessions.keys()):
            self.close_session(session_id)


# Global instance
selenium_manager = SeleniumManager()
