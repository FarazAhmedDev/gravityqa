from typing import List, Dict
from services.ai.llm_client import LLMClient

class CodeGenerator:
    """Generates test code from recorded steps"""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def generate_test_suite(
        self,
        test_steps: List[Dict],
        language: str = "python",
        framework: str = "pytest"
    ) -> str:
        """Generate complete test suite from steps"""
        
        steps_description = "\n".join([
            f"{i+1}. {step.get('description', 'Unknown action')}"
            for i, step in enumerate(test_steps)
        ])
        
        prompt = f"""Generate a complete, runnable test file from these recorded steps:

Test Steps:
{steps_description}

Requirements:
- Language: {language}
- Framework: {framework}
- Platform: Mobile (Appium)

Generate:
1. Proper imports
2. Test class/suite structure
3. Setup/teardown methods
4. One or more test methods
5. Explicit waits (WebDriverWait)
6. Meaningful assertions
7. Comments explaining each step
8. Error handling

Best practices:
- Use descriptive variable names
- Add retry logic for flaky elements
- Use relative XPaths when possible
- Add logging

Output ONLY the complete test file code, no explanations."""
        
        response = await self.llm_client.chat_completion(
            messages=[
                {"role": "system", "content": "You are an expert test automation engineer."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=3000
        )
        
        if not response:
            return self._generate_fallback_code(test_steps, language, framework)
        
        # Extract code from markdown if present
        if "```" in response:
            lines = response.split("\n")
            code_lines = []
            in_code = False
            
            for line in lines:
                if line.startswith("```"):
                    in_code = not in_code
                    continue
                if in_code:
                    code_lines.append(line)
            
            return "\n".join(code_lines)
        
        return response
    
    def _generate_fallback_code(self, test_steps: List[Dict], language: str, framework: str) -> str:
        """Generate basic test code when AI fails"""
        
        if language == "python" and framework == "pytest":
            code = """import pytest
from appium import webdriver
from appium.webdriver.common.appiumby import AppiumBy
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestGeneratedTest:
    @pytest.fixture
    def driver(self):
        caps = {
            "platformName": "Android",
            "deviceName": "emulator-5554",
            "automationName": "UiAutomator2",
            "newCommandTimeout": 300
        }
        driver = webdriver.Remote("http://localhost:4723", caps)
        yield driver
        driver.quit()
    
    def test_recorded_flow(self, driver):
        \"\"\"Auto-generated test from recorded steps\"\"\"
"""
            
            for i, step in enumerate(test_steps):
                action_type = step.get("action_type", "unknown")
                xpath = step.get("element_xpath", "")
                description = step.get("description", "")
                
                code += f"\n        # Step {i+1}: {description}\n"
                
                if action_type == "click" and xpath:
                    code += f"        element = WebDriverWait(driver, 10).until(\n"
                    code += f"            EC.element_to_be_clickable((AppiumBy.XPATH, \"{xpath}\"))\n"
                    code += f"        )\n"
                    code += f"        element.click()\n"
                
                elif action_type == "input" and xpath:
                    input_value = step.get("input_value", "test")
                    code += f"        element = driver.find_element(AppiumBy.XPATH, \"{xpath}\")\n"
                    code += f"        element.send_keys(\"{input_value}\")\n"
            
            return code
        
        return "# Code generation failed"
    
    def generate_step(self, action: Dict, language: str = "python") -> str:
        """Generate code for a single step"""
        
        action_type = action.get("action_type")
        xpath = action.get("element", {}).get("xpath", "")
        
        if language == "python":
            if action_type == "click":
                return f'driver.find_element(AppiumBy.XPATH, "{xpath}").click()'
            elif action_type == "input":
                value = action.get("input_value", "")
                return f'driver.find_element(AppiumBy.XPATH, "{xpath}").send_keys("{value}")'
        
        return "# Unknown action"
