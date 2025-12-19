from typing import Dict, List, Optional
from services.mobile.appium_service import AppiumService
from services.ai.agent_orchestrator import AIAgent
from api.websocket import get_ws_manager
from database import SessionLocal
from models.test_suite import TestRun, TestStep
from datetime import datetime
import asyncio

class TestOrchestrator:
    """Orchestrates test execution"""
    
    def __init__(self):
        self.appium_service = AppiumService()
        self.ai_agent = AIAgent()
        self.ws_manager = get_ws_manager()
        self.running_tests = {}
    
    async def run_ai_exploration(self, test_run_id: int, test_config: Dict):
        """Run AI autonomous exploration"""
        db = SessionLocal()
        
        try:
            # Update status
            test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
            test_run.status = "running"
            db.commit()
            
            # Start Appium server
            await self.appium_service.start_server()
            
            # Create capabilities
            device_id = test_config.get("device_id")
            app_id = test_config.get("app_id")
            platform = test_config.get("platform", "android")
            
            capabilities = {
                "platformName": platform.capitalize(),
                "deviceName": device_id,
                "automationName": "UiAutomator2" if platform == "android" else "XCUITest",
                "newCommandTimeout": 300
            }
            
            if app_id:
                # Get app path from database
                from models.project import App
                app = db.query(App).filter(App.id == app_id).first()
                if app:
                    capabilities["app"] = app.file_path
            
            # Create session
            session_id = await self.appium_service.create_session(capabilities)
            
            if not session_id:
                test_run.status = "failed"
                db.commit()
                return
            
            # Run exploration
            step_count = 0
            max_steps = test_config.get("max_steps", 50)
            
            while step_count < max_steps and test_run_id in self.running_tests:
                # Capture screen
                screenshot = await self.appium_service.get_screenshot(session_id)
                page_source = await self.appium_service.get_page_source(session_id)
                
                # AI analysis
                screen_analysis = await self.ai_agent.vision_analyzer.analyze_screen(
                    screenshot=screenshot,
                    page_source=page_source,
                    platform=platform
                )
                
                # Plan action
                action = await self.ai_agent.action_planner.plan_next_action(
                    screen_analysis=screen_analysis,
                    test_context={"step_count": step_count}
                )
                
                # Execute action
                success = await self._execute_action(
                    session_id,
                    action,
                    self.appium_service
                )
                
                # Save step
                test_step = TestStep(
                    test_run_id=test_run_id,
                    step_number=step_count + 1,
                    action_type=action.get("action_type", "unknown"),
                    description=action.get("description", ""),
                    element_xpath=action.get("element", {}).get("xpath"),
                    status="success" if success else "failed"
                )
                db.add(test_step)
                db.commit()
                
                # Update test run
                test_run.total_steps = step_count + 1
                if success:
                    test_run.passed_steps += 1
                else:
                    test_run.failed_steps += 1
                db.commit()
                
                # Broadcast update
                await self.ws_manager.broadcast(
                    f"test-run-{test_run_id}",
                    {
                        "event": "test_step",
                        "data": {
                            "step_number": step_count + 1,
                            "action": action.get("description"),
                            "status": "success" if success else "failed",
                            "screenshot": screenshot
                        }
                    }
                )
                
                step_count += 1
                await asyncio.sleep(1)  # Pause between steps
            
            # Clean up
            await self.appium_service.delete_session(session_id)
            
            # Mark complete
            test_run.status = "completed"
            test_run.ended_at = datetime.utcnow()
            db.commit()
            
            # Generate test code
            steps = db.query(TestStep).filter(TestStep.test_run_id == test_run_id).all()
            test_code = await self.ai_agent.code_generator.generate_test_suite(
                test_steps=[
                    {
                        "action_type": s.action_type,
                        "description": s.description,
                        "element_xpath": s.element_xpath
                    }
                    for s in steps
                ],
                language="python",
                framework="pytest"
            )
            
            # Broadcast completion
            await self.ws_manager.broadcast(
                f"test-run-{test_run_id}",
                {
                    "event": "test_completed",
                    "data": {
                        "test_run_id": test_run_id,
                        "status": "completed",
                        "test_code": test_code
                    }
                }
            )
        
        except Exception as e:
            print(f"Error in AI exploration: {e}")
            test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
            if test_run:
                test_run.status = "failed"
                test_run.ended_at = datetime.utcnow()
                db.commit()
        
        finally:
            db.close()
            if test_run_id in self.running_tests:
                del self.running_tests[test_run_id]
    
    async def _execute_action(self, session_id: str, action: Dict, appium: AppiumService) -> bool:
        """Execute a single action"""
        try:
            action_type = action.get("action_type")
            element_info = action.get("element", {})
            xpath = element_info.get("xpath")
            
            if not xpath:
                return False
            
            # Find element
            element_id = await appium.find_element(session_id, "xpath", xpath)
            if not element_id:
                return False
            
            # Execute based on type
            if action_type == "click":
                return await appium.click_element(session_id, element_id)
            
            elif action_type == "input":
                text = action.get("input_value", "")
                return await appium.send_keys(session_id, element_id, text)
            
            return False
        
        except Exception as e:
            print(f"Error executing action: {e}")
            return False
    
    async def run_test_suite(self, test_run_id: int, test_suite_id: int):
        """Run a predefined test suite"""
        # TODO: Implement test suite execution
        pass
    
    def stop_test(self, test_run_id: int):
        """Stop a running test"""
        if test_run_id in self.running_tests:
            del self.running_tests[test_run_id]
