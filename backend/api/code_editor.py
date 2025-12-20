"""Code Editor Backend - File management and execution"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
import os
import subprocess
import tempfile
from pathlib import Path

router = APIRouter(prefix="/api/code", tags=["code"])

# Directory to store saved test files
CODE_DIR = Path("./saved_tests")
CODE_DIR.mkdir(exist_ok=True)

@router.get("/files")
async def get_saved_files():
    """Get list of saved test files"""
    try:
        files = []
        
        for file_path in CODE_DIR.glob("*"):
            if file_path.is_file() and file_path.suffix in ['.py', '.js']:
                with open(file_path, 'r') as f:
                    content = f.read()
                
                files.append({
                    "name": file_path.name,
                    "language": "python" if file_path.suffix == '.py' else "javascript",
                    "content": content,
                    "path": str(file_path)
                })
        
        print(f"[CodeEditor] Found {len(files)} saved files")
        return {"files": files}
        
    except Exception as e:
        print(f"[CodeEditor] Error loading files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_code_file(request: Dict):
    """Save code to file"""
    try:
        name = request.get('name', 'test_script.py')
        content = request.get('content', '')
        language = request.get('language', 'python')
        
        # Ensure correct extension
        if language == 'python' and not name.endswith('.py'):
            name += '.py'
        elif language == 'javascript' and not name.endswith('.js'):
            name += '.js'
        
        file_path = CODE_DIR / name
        
        with open(file_path, 'w') as f:
            f.write(content)
        
        print(f"[CodeEditor] ✅ Saved: {name} ({len(content)} chars)")
        
        return {
            "success": True,
            "path": str(file_path),
            "name": name
        }
        
    except Exception as e:
        print(f"[CodeEditor] ❌ Save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_code(request: Dict):
    """Execute code on device"""
    try:
        code = request.get('code', '')
        language = request.get('language', 'python')
        
        print(f"[CodeEditor] Executing {language} code ({len(code)} chars)")
        
        if language == 'python':
            # Create temp file and execute
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(code)
                temp_path = f.name
            
            try:
                # Execute Python code
                result = subprocess.run(
                    ['python3', temp_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                output = result.stdout + result.stderr
                
                if result.returncode == 0:
                    print(f"[CodeEditor] ✅ Execution successful")
                    return {
                        "success": True,
                        "output": output or "✅ Test completed successfully!"
                    }
                else:
                    print(f"[CodeEditor] ❌ Execution failed: {result.stderr}")
                    return {
                        "success": False,
                        "output": f"❌ Error:\n{result.stderr}"
                    }
                    
            finally:
                os.unlink(temp_path)
                
        elif language == 'javascript':
            # Execute JavaScript with Node.js
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(code)
                temp_path = f.name
            
            try:
                result = subprocess.run(
                    ['node', temp_path],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                output = result.stdout + result.stderr
                
                if result.returncode == 0:
                    print(f"[CodeEditor] ✅ Execution successful")
                    return {
                        "success": True,
                        "output": output or "✅ Test completed successfully!"
                    }
                else:
                    print(f"[CodeEditor] ❌ Execution failed: {result.stderr}")
                    return {
                        "success": False,
                        "output": f"❌ Error:\n{result.stderr}"
                    }
                    
            finally:
                os.unlink(temp_path)
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported language")
            
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "output": "❌ Execution timed out (30s limit)"
        }
    except Exception as e:
        print(f"[CodeEditor] ❌ Execution error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/file/{filename}")
async def delete_file(filename: str):
    """Delete a saved file"""
    try:
        file_path = CODE_DIR / filename
        
        if file_path.exists():
            os.unlink(file_path)
            print(f"[CodeEditor] ✅ Deleted: {filename}")
            return {"success": True}
        else:
            raise HTTPException(status_code=404, detail="File not found")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[CodeEditor] ❌ Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
