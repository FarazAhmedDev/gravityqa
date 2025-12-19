from typing import Dict, Optional
from services.ai.llm_client import LLMClient
import json

class VisionAnalyzer:
    """Analyzes screenshots using vision AI"""
    
    def __init__(self):
        self.llm_client = LLMClient()
    
    async def analyze_screen(
        self,
        screenshot: str,
        page_source: str,
        platform: str = "android"
    ) -> Dict:
        """Analyze a mobile app screenshot"""
        
        prompt = f"""You are an expert mobile app tester analyzing a screenshot.

Platform: {platform}
Page source (XML hierarchy):
{page_source[:2000]}... # Truncated

Analyze this screen and provide:

1. Screen Type: (e.g., login, home, profile, form, list, detail)
2. Screen Purpose: Brief description
3. Interactive Elements: List ALL clickable/tappable elements with:
   - Element type (button, input, link, etc.)
   - Label/text
   - XPath
   - Likely action result
4. Input Fields: List all text inputs with field purpose and XPath
5. Current State: Is user logged in? Any errors? Loading indicators?
6. Suggested Test Actions: List 3-5 meaningful actions prioritized by:
   - Critical user flows (login, signup)
   - Unexplored features
   - Edge cases
7. Assertions: What should be validated?

Respond ONLY with valid JSON in this format:
{{
  "screen_type": "...",
  "purpose": "...",
  "elements": [
    {{"type": "...", "label": "...", "xpath": "...", "action_result": "..."}}
  ],
  "inputs": [
    {{"purpose": "...", "xpath": "..."}}
  ],
  "state": {{"logged_in": false, "errors": [], "loading": false}},
  "suggested_actions": [
    {{"action": "...", "priority": "high/medium/low", "rationale": "..."}}
  ],
  "assertions": ["..."]
}}"""
        
        response = await self.llm_client.vision_completion(
            prompt=prompt,
            image_base64=screenshot,
            temperature=0.3
        )
        
        if not response:
            return self._fallback_analysis()
        
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                analysis = json.loads(json_str)
                return analysis
            
            return self._fallback_analysis()
        
        except Exception as e:
            print(f"Error parsing vision analysis: {e}")
            return self._fallback_analysis()
    
    def _fallback_analysis(self) -> Dict:
        """Fallback analysis when AI fails"""
        return {
            "screen_type": "unknown",
            "purpose": "Unable to analyze",
            "elements": [],
            "inputs": [],
            "state": {"logged_in": False, "errors": [], "loading": False},
            "suggested_actions": [],
            "assertions": []
        }
