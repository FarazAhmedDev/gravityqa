"""
Phase 5: Web Playback Engine
Executes recorded web tests with intelligent waits and error handling
"""

from typing import Dict, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import logging

logger = logging.getLogger(__name__)


class WebPlaybackEngine:
    """Executes recorded web test actions"""
    
    def __init__(self, selenium_manager):
        self.selenium_manager = selenium_manager
        self.playback_results: Dict[str, dict] = {}
    
    async def execute_test(
        self,
        session_id: str,
        actions: List[dict],
        settings: dict = None
    ) -> dict:
        """
        Execute a recorded web test
        
        Args:
            session_id: Active browser session
            actions: List of recorded actions
            settings: Execution settings (wait_timeout, retry_count, etc.)
        
        Returns:
            Execution results with status and details
        """
        if settings is None:
            settings = {
                'wait_timeout': 10,
                'retry_per_step': 1,
                'failure_behaviour': 'stop',
                'capture_screenshots': True
            }
        
        results = {
            'total_steps': len(actions),
            'successful_steps': 0,
            'failed_steps': 0,
            'skipped_steps': 0,
            'step_results': [],
            'overall_status': 'running',
            'start_time': time.time()
        }
        
        for idx, action in enumerate(actions):
            step_num = idx + 1
            logger.info(f"[WebPlayback] Executing step {step_num}/{len(actions)}: {action['type']}")
            
            step_result = await self._execute_step(
                session_id,
                action,
                step_num,
                settings
            )
            
            results['step_results'].append(step_result)
            
            # Update counters
            if step_result['status'] == 'pass':
                results['successful_steps'] += 1
            elif step_result['status'] == 'fail':
                results['failed_steps'] += 1
                
                # Handle failure behavior
                if settings['failure_behaviour'] == 'stop':
                    logger.warning(f"[WebPlayback] Stopping on failure at step {step_num}")
                    # Mark remaining steps as skipped
                    for remaining_action in actions[idx + 1:]:
                        results['step_results'].append({
                            'step': len(results['step_results']) + 1,
                            'action': remaining_action['type'],
                            'status': 'skip',
                            'message': 'Skipped due to previous failure'
                        })
                        results['skipped_steps'] += 1
                    break
                elif settings['failure_behaviour'] == 'skip':
                    logger.warning(f"[WebPlayback] Skipping failed step {step_num}, continuing...")
                    continue
            elif step_result['status'] == 'skip':
                results['skipped_steps'] += 1
            
            # Small delay between steps
            time.sleep(0.5)
        
        # Calculate overall status
        results['end_time'] = time.time()
        results['duration'] = results['end_time'] - results['start_time']
        
        if results['failed_steps'] == 0:
            results['overall_status'] = 'pass'
        elif results['successful_steps'] > 0:
            results['overall_status'] = 'partial'
        else:
            results['overall_status'] = 'fail'
        
        logger.info(f"[WebPlayback] Test complete: {results['overall_status']}")
        return results
    
    async def _execute_step(
        self,
        session_id: str,
        action: dict,
        step_num: int,
        settings: dict
    ) -> dict:
        """Execute a single test step with retry logic"""
        action_type = action['type']
        retry_count = settings.get('retry_per_step', 1)
        
        step_result = {
            'step': step_num,
            'action': action_type,
            'status': 'fail',
            'attempts': 0,
            'errors': [],
            'duration': 0
        }
        
        start_time = time.time()
        
        for attempt in range(retry_count):
            step_result['attempts'] = attempt + 1
            
            try:
                if action_type == 'navigate':
                    await self._execute_navigate(session_id, action, settings)
                
                elif action_type == 'click':
                    await self._execute_click(session_id, action, settings)
                
                elif action_type == 'input':
                    await self._execute_input(session_id, action, settings)
                
                elif action_type == 'select':
                    await self._execute_select(session_id, action, settings)
                
                elif action_type == 'scroll':
                    await self._execute_scroll(session_id, action, settings)
                
                else:
                    raise Exception(f"Unsupported action type: {action_type}")
                
                # Success!
                step_result['status'] = 'pass' if attempt == 0 else 'flaky'
                step_result['duration'] = time.time() - start_time
                
                # Capture screenshot if enabled
                if settings.get('capture_screenshots'):
                    screenshot_path = self.selenium_manager.take_screenshot(
                        session_id,
                        f"/tmp/step_{step_num}_success.png"
                    )
                    step_result['screenshot'] = screenshot_path
                
                break  # Success, exit retry loop
            
            except Exception as e:
                error_msg = str(e)
                step_result['errors'].append(f"Attempt {attempt + 1}: {error_msg}")
                logger.error(f"[WebPlayback] Step {step_num} attempt {attempt + 1} failed: {error_msg}")
                
                if attempt == retry_count - 1:
                    # Last attempt failed
                    step_result['status'] = 'fail'
                    step_result['duration'] = time.time() - start_time
                    step_result['error'] = error_msg
                    
                    # Capture failure screenshot
                    if settings.get('capture_screenshots'):
                        try:
                            screenshot_path = self.selenium_manager.take_screenshot(
                                session_id,
                                f"/tmp/step_{step_num}_failure.png"
                            )
                            step_result['screenshot'] = screenshot_path
                        except:
                            pass
                else:
                    # Wait before retry
                    time.sleep(1)
        
        return step_result
    
    async def _execute_navigate(self, session_id: str, action: dict, settings: dict):
        """Execute navigation action"""
        url = action.get('url')
        if not url:
            raise Exception("No URL provided for navigate action")
        
        self.selenium_manager.navigate(session_id, url)
        logger.info(f"[WebPlayback] Navigated to: {url}")
    
    async def _execute_click(self, session_id: str, action: dict, settings: dict):
        """Execute click action"""
        selector = action.get('selector', {})
        
        # Try best selector first
        if 'best' in selector:
            by = selector.get('best_type', 'css')
            value = selector['best']
        else:
            # Fallback to first available
            if 'id_locator' in selector:
                by = 'id'
                value = selector['id_locator']
            elif 'css' in selector:
                by = 'css'
                value = selector['css']
            elif 'xpath' in selector:
                by = 'xpath'
                value = selector['xpath']
            else:
                raise Exception("No valid selector found")
        
        self.selenium_manager.click_element(
            session_id,
            by,
            value,
            settings.get('wait_timeout', 10)
        )
        logger.info(f"[WebPlayback] Clicked: {by}={value}")
    
    async def _execute_input(self, session_id: str, action: dict, settings: dict):
        """Execute input action"""
        selector = action.get('selector', {})
        value = action.get('value', '')
        
        # Get selector
        if 'best' in selector:
            by = selector.get('best_type', 'css')
            locator = selector['best']
        elif 'id_locator' in selector:
            by = 'id'
            locator = selector['id_locator']
        elif 'css' in selector:
            by = 'css'
            locator = selector['css']
        else:
            raise Exception("No valid selector found")
        
        self.selenium_manager.send_keys(
            session_id,
            by,
            locator,
            value,
            settings.get('wait_timeout', 10)
        )
        logger.info(f"[WebPlayback] Input: {by}={locator}, value={value}")
    
    async def _execute_select(self, session_id: str, action: dict, settings: dict):
        """Execute select dropdown action"""
        # Similar to click but for dropdowns
        await self._execute_click(session_id, action, settings)
    
    async def _execute_scroll(self, session_id: str, action: dict, settings: dict):
        """Execute scroll action"""
        scroll_amount = action.get('value', '0')
        
        script = f"window.scrollBy(0, {scroll_amount});"
        self.selenium_manager.execute_script(session_id, script)
        logger.info(f"[WebPlayback] Scrolled by: {scroll_amount}px")
    
    def get_results(self, playback_id: str) -> Optional[dict]:
        """Get playback results"""
        return self.playback_results.get(playback_id)


# Global instance will be created in main.py
# web_playback_engine = WebPlaybackEngine(selenium_manager)
