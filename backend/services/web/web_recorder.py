"""
Phase 5: Web Recorder Service
Captures web interactions and generates smart selectors
"""

from typing import Dict, List, Optional
from selenium.webdriver.remote.webelement import WebElement
from selenium.webdriver.common.by import By
import uuid
import logging

logger = logging.getLogger(__name__)


class WebRecorder:
    """Records web interactions and generates intelligent selectors"""
    
    def __init__(self):
        self.recordings: Dict[str, List[dict]] = {}
    
    def start_recording(self, session_id: str) -> str:
        """Start a new recording session"""
        recording_id = str(uuid.uuid4())
        self.recordings[recording_id] = []
        logger.info(f"[WebRecorder] Started recording: {recording_id}")
        return recording_id
    
    def stop_recording(self, recording_id: str) -> List[dict]:
        """Stop recording and return captured actions"""
        if recording_id not in self.recordings:
            raise Exception(f"Recording not found: {recording_id}")
        
        actions = self.recordings[recording_id]
        logger.info(f"[WebRecorder] Stopped recording: {recording_id}, {len(actions)} actions")
        return actions
    
    def record_action(
        self,
        recording_id: str,
        action_type: str,
        element: WebElement = None,
        value: str = None,
        url: str = None
    ) -> dict:
        """
        Record a single action
        
        Args:
            recording_id: Active recording session
            action_type: Type of action (click, input, navigate, etc.)
            element: WebElement involved (if applicable)
            value: Value for input actions
            url: URL for navigation actions
        """
        if recording_id not in self.recordings:
            raise Exception(f"Recording not found: {recording_id}")
        
        action = {
            'id': str(uuid.uuid4()),
            'type': action_type,
            'timestamp': uuid.uuid1().time
        }
        
        # Generate selectors if element provided
        if element:
            selectors = self.generate_selectors(element)
            action['selector'] = selectors
            action['element_info'] = self.get_element_info(element)
        
        # Add value for input actions
        if value:
            action['value'] = value
        
        # Add URL for navigation
        if url:
            action['url'] = url
        
        self.recordings[recording_id].append(action)
        logger.info(f"[WebRecorder] Recorded {action_type}: {action.get('selector', {}).get('best', 'N/A')}")
        
        return action
    
    def generate_selectors(self, element: WebElement) -> dict:
        """
        Generate multiple selector strategies for an element
        
        Returns dict with:
        - id: ID-based selector (if available)
        - name: Name-based selector (if available)
        - css: CSS selector
        - xpath: XPath selector
        - best: Recommended selector (priority: ID > Name > CSS > XPath)
        """
        selectors = {}
        
        try:
            # ID selector (highest priority)
            element_id = element.get_attribute('id')
            if element_id:
                selectors['id'] = f"#{element_id}"
                selectors['id_locator'] = element_id
            
            # Name selector
            element_name = element.get_attribute('name')
            if element_name:
                selectors['name'] = f"[name='{element_name}']"
                selectors['name_locator'] = element_name
            
            # CSS selector (optimized)
            css_selector = self._generate_css_selector(element)
            if css_selector:
                selectors['css'] = css_selector
            
            # XPath selector (fallback)
            xpath_selector = self._generate_xpath_selector(element)
            if xpath_selector:
                selectors['xpath'] = xpath_selector
            
            # Determine best selector (priority: ID > Name > CSS > XPath)
            if 'id' in selectors:
                selectors['best'] = selectors['id']
                selectors['best_type'] = 'css'
            elif 'name' in selectors:
                selectors['best'] = selectors['name']
                selectors['best_type'] = 'css'
            elif 'css' in selectors:
                selectors['best'] = selectors['css']
                selectors['best_type'] = 'css'
            elif 'xpath' in selectors:
                selectors['best'] = selectors['xpath']
                selectors['best_type'] = 'xpath'
            
        except Exception as e:
            logger.error(f"[WebRecorder] Selector generation failed: {str(e)}")
        
        return selectors
    
    def _generate_css_selector(self, element: WebElement) -> str:
        """Generate optimized CSS selector"""
        try:
            tag = element.tag_name
            element_id = element.get_attribute('id')
            classes = element.get_attribute('class')
            
            # If ID exists, use it
            if element_id:
                return f"{tag}#{element_id}"
            
            # If classes exist, use them
            if classes:
                class_list = classes.strip().split()
                if class_list:
                    class_str = '.'.join(class_list)
                    return f"{tag}.{class_str}"
            
            # Fallback to tag + nth-child
            return tag
        
        except Exception as e:
            logger.error(f"[WebRecorder] CSS selector failed: {str(e)}")
            return None
    
    def _generate_xpath_selector(self, element: WebElement) -> str:
        """Generate XPath selector"""
        try:
            # Use JavaScript to generate XPath
            driver = element.parent
            script = """
            function getXPath(element) {
                if (element.id !== '')
                    return "//*[@id='" + element.id + "']";
                if (element === document.body)
                    return element.tagName.toLowerCase();
                
                var ix = 0;
                var siblings = element.parentNode.childNodes;
                for (var i = 0; i < siblings.length; i++) {
                    var sibling = siblings[i];
                    if (sibling === element)
                        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
                    if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
                        ix++;
                }
            }
            return getXPath(arguments[0]);
            """
            xpath = driver.execute_script(script, element)
            return xpath
        
        except Exception as e:
            logger.error(f"[WebRecorder] XPath generation failed: {str(e)}")
            return None
    
    def get_element_info(self, element: WebElement) -> dict:
        """Get detailed information about an element"""
        try:
            return {
                'tag': element.tag_name,
                'text': element.text,
                'id': element.get_attribute('id'),
                'name': element.get_attribute('name'),
                'class': element.get_attribute('class'),
                'type': element.get_attribute('type'),
                'value': element.get_attribute('value'),
                'href': element.get_attribute('href'),
                'visible': element.is_displayed(),
                'enabled': element.is_enabled(),
                'selected': element.is_selected() if element.tag_name.lower() in ['option', 'input'] else None
            }
        except Exception as e:
            logger.error(f"[WebRecorder] Element info extraction failed: {str(e)}")
            return {}
    
    def get_recording(self, recording_id: str) -> List[dict]:
        """Get all actions from a recording"""
        return self.recordings.get(recording_id, [])
    
    def delete_recording(self, recording_id: str) -> bool:
        """Delete a recording"""
        if recording_id in self.recordings:
            del self.recordings[recording_id]
            return True
        return False
    
    def export_recording(self, recording_id: str, format: str = 'json') -> dict:
        """
        Export recording in various formats
        
        Args:
            recording_id: Recording to export
            format: Export format (json, code, etc.)
        """
        actions = self.get_recording(recording_id)
        
        if format == 'json':
            return {
                'recording_id': recording_id,
                'total_actions': len(actions),
                'actions': actions
            }
        
        elif format == 'python':
            return self._export_as_python(actions)
        
        elif format == 'javascript':
            return self._export_as_javascript(actions)
        
        return {'error': 'Unsupported format'}
    
    def _export_as_python(self, actions: List[dict]) -> str:
        """Export as Python Selenium code"""
        code_lines = [
            "from selenium import webdriver",
            "from selenium.webdriver.common.by import By",
            "from selenium.webdriver.support.ui import WebDriverWait",
            "from selenium.webdriver.support import expected_conditions as EC",
            "",
            "# Initialize driver",
            "driver = webdriver.Chrome()",
            "wait = WebDriverWait(driver, 10)",
            ""
        ]
        
        for action in actions:
            if action['type'] == 'navigate':
                code_lines.append(f"driver.get('{action['url']}')")
            
            elif action['type'] == 'click':
                selector = action['selector']['best']
                selector_type = action['selector']['best_type']
                if selector_type == 'css':
                    code_lines.append(f"driver.find_element(By.CSS_SELECTOR, '{selector}').click()")
                else:
                    code_lines.append(f"driver.find_element(By.XPATH, '{selector}').click()")
            
            elif action['type'] == 'input':
                selector = action['selector']['best']
                value = action['value']
                selector_type = action['selector']['best_type']
                if selector_type == 'css':
                    code_lines.append(f"driver.find_element(By.CSS_SELECTOR, '{selector}').send_keys('{value}')")
                else:
                    code_lines.append(f"driver.find_element(By.XPATH, '{selector}').send_keys('{value}')")
        
        code_lines.append("")
        code_lines.append("# Close driver")
        code_lines.append("driver.quit()")
        
        return '\n'.join(code_lines)
    
    def _export_as_javascript(self, actions: List[dict]) -> str:
        """Export as JavaScript Selenium code"""
        code_lines = [
            "const { Builder, By, until } = require('selenium-webdriver');",
            "",
            "async function runTest() {",
            "  const driver = await new Builder().forBrowser('chrome').build();",
            "  try {"
        ]
        
        for action in actions:
            if action['type'] == 'navigate':
                code_lines.append(f"    await driver.get('{action['url']}');")
            
            elif action['type'] == 'click':
                selector = action['selector']['best']
                selector_type = action['selector']['best_type']
                if selector_type == 'css':
                    code_lines.append(f"    await driver.findElement(By.css('{selector}')).click();")
                else:
                    code_lines.append(f"    await driver.findElement(By.xpath('{selector}')).click();")
            
            elif action['type'] == 'input':
                selector = action['selector']['best']
                value = action['value']
                selector_type = action['selector']['best_type']
                if selector_type == 'css':
                    code_lines.append(f"    await driver.findElement(By.css('{selector}')).sendKeys('{value}');")
                else:
                    code_lines.append(f"    await driver.findElement(By.xpath('{selector}')).sendKeys('{value}');")
        
        code_lines.extend([
            "  } finally {",
            "    await driver.quit();",
            "  }",
            "}",
            "",
            "runTest();"
        ])
        
        return '\n'.join(code_lines)


# Global instance
web_recorder = WebRecorder()
