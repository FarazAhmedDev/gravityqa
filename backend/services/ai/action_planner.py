from typing import Dict, List
from services.ai.llm_client import LLMClient
import json

class ActionPlanner:
    """Plans next test actions based on screen analysis"""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def plan_next_action(
        self,
        screen_analysis: Dict,
        test_context: Dict
    ) -> Dict:
        """Plan the next action to take"""
        
        prompt = f"""You are an AI test planner for mobile app testing.

Current Screen Analysis:
{json.dumps(screen_analysis, indent=2)}

Test Context:
- Steps executed: {test_context.get('step_count', 0)}
- Test goal: Explore all major features

Your task: Decide the NEXT action to take.

Prioritization rules:
1. If on login screen and not logged in → attempt login
2. If on signup screen → attempt signup flow
3. If on form → fill and submit
4. If on list → tap first item to see detail
5. If on detail → go back and explore other items
6. Prioritize unexplored screens

Avoid:
- Repeating the same action twice in a row
- Clicking destructive actions (delete, logout) too early
- Getting stuck in infinite loops

Respond ONLY with valid JSON:
{{
  "action_type": "click|input|swipe|back|wait",
  "element": {{
    "xpath": "...",
    "description": "..."
  }},
  "input_value": "..." (only if action_type is input),
  "description": "Human-readable description of what this action does",
  "rationale": "Why this action makes sense?"
}}"""
        
        response = await self.llm_client.chat_completion(
            messages=[
                {"role": "system", "content": "You are an expert test automation planner."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        
        if not response:
            return self._fallback_action(screen_analysis)
        
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                action = json.loads(json_str)
                return action
            
            return self._fallback_action(screen_analysis)
        
        except Exception as e:
            print(f"Error parsing action plan: {e}")
            return self._fallback_action(screen_analysis)
    
    def _fallback_action(self, screen_analysis: Dict) -> Dict:
        """Fallback action when AI fails"""
        # Try to find first clickable element
        elements = screen_analysis.get("elements", [])
        
        for element in elements:
            if element.get("type") in ["button", "link"]:
                return {
                    "action_type": "click",
                    "element": {
                        "xpath": element.get("xpath", ""),
                        "description": element.get("label", "Unknown")
                    },
                    "description": f"Click {element.get('label', 'element')}",
                    "rationale": "Fallback action - exploring UI"
                }
        
        # No action possible
        return {
            "action_type": "wait",
            "element": {"xpath": "", "description": ""},
            "description": "No action available",
            "rationale": "Unable to find clickable elements"
        }
