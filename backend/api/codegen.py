"""Code Generation API - Convert actions to code"""
from fastapi import APIRouter, HTTPException
from typing import List, Dict
from utils.code_generator import generate_javascript_code, generate_python_code

router = APIRouter(prefix="/api/codegen", tags=["codegen"])

@router.post("/generate")
async def generate_code(request: Dict):
    """Generate test code from recorded actions"""
    try:
        actions = request.get('actions', [])
        language = request.get('language', 'javascript')  # 'javascript' or 'python'
        
        if not actions:
            raise HTTPException(status_code=400, detail="No actions provided")
        
        print(f"[CodeGen] Generating {language} code for {len(actions)} actions")
        
        if language == 'python':
            code = generate_python_code(actions)
        else:
            code = generate_javascript_code(actions)
        
        print(f"[CodeGen] ✅ Generated {len(code)} characters of code")
        
        return {
            "success": True,
            "language": language,
            "code": code,
            "actions_count": len(actions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CodeGen] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
