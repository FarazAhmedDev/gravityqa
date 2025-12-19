from services.ai.llm_client import LLMClient
from services.ai.vision_analyzer import VisionAnalyzer
from services.ai.action_planner import ActionPlanner
from services.ai.code_generator import CodeGenerator

class AIAgent:
    """Main AI agent orchestrating all AI services"""
    
    def __init__(self):
        self.llm_client = LLMClient()
        self.vision_analyzer = VisionAnalyzer()
        self.action_planner = ActionPlanner()
        self.code_generator = CodeGenerator()
    
    async def analyze_and_act(self, screenshot: str, page_source: str, platform: str):
        """Analyze screen and suggest action"""
        
        # Analyze screen
        analysis = await self.vision_analyzer.analyze_screen(
            screenshot=screenshot,
            page_source=page_source,
            platform=platform
        )
        
        # Plan action
        action = await self.action_planner.plan_next_action(
            screen_analysis=analysis,
            test_context={"step_count": 0}
        )
        
        return {
            "analysis": analysis,
            "action": action
        }
