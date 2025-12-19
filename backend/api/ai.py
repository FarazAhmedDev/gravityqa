from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.ai.agent_orchestrator import AIAgent

router = APIRouter()
ai_agent = AIAgent()

@router.post("/analyze-screen")
async def analyze_screen(screen_data: dict):
    """Analyze a screenshot using AI"""
    screenshot = screen_data.get("screenshot")
    page_source = screen_data.get("page_source")
    platform = screen_data.get("platform", "android")
    
    analysis = await ai_agent.vision_analyzer.analyze_screen(
        screenshot=screenshot,
        page_source=page_source,
        platform=platform
    )
    
    return analysis

@router.post("/generate-test-code")
async def generate_test_code(test_data: dict):
    """Generate test code from recorded steps"""
    test_steps = test_data.get("test_steps", [])
    language = test_data.get("language", "python")
    framework = test_data.get("framework", "pytest")
    
    code = await ai_agent.code_generator.generate_test_suite(
        test_steps=test_steps,
        language=language,
        framework=framework
    )
    
    return {"code": code}

@router.post("/suggest-actions")
async def suggest_actions(context: dict):
    """Get AI suggestions for next test actions"""
    screen_analysis = context.get("screen_analysis")
    previous_actions = context.get("previous_actions", [])
    
    suggestions = await ai_agent.action_planner.plan_next_action(
        screen_analysis=screen_analysis,
        previous_actions=previous_actions
    )
    
    return suggestions

@router.get("/settings")
async def get_ai_settings():
    """Get current AI configuration"""
    return {
        "provider": ai_agent.llm_client.provider,
        "model": ai_agent.llm_client.model,
        "temperature": 0.7,
        "max_tokens": 2000
    }

@router.post("/settings")
async def update_ai_settings(settings: dict):
    """Update AI configuration"""
    if "provider" in settings:
        ai_agent.llm_client.provider = settings["provider"]
    if "model" in settings:
        ai_agent.llm_client.model = settings["model"]
    
    return {"message": "Settings updated successfully"}
