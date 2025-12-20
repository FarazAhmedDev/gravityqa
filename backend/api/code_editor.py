"""Code Editor Backend - File management and execution"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List
import os
import subprocess
import tempfile
from pathlib import Path
import shutil

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
            # Create temp directory for execution with dependencies
            temp_dir = tempfile.mkdtemp()
            temp_file_path = os.path.join(temp_dir, 'test.js')
            
            try:
                # Write code to temp directory
                with open(temp_file_path, 'w') as f:
                    f.write(code)
                
                # Install webdriverio if code uses it
                if 'webdriverio' in code or 'require(\'webdriverio\')' in code:
                    print(f"[CodeEditor] 📦 Installing webdriverio in {temp_dir}...")
                    install_result = subprocess.run(
                        ['npm', 'install', 'webdriverio'],
                        cwd=temp_dir,
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    
                    if install_result.returncode == 0:
                        print("[CodeEditor] ✅ webdriverio installed successfully")
                    else:
                        print(f"[CodeEditor] ⚠️ webdriverio install warning: {install_result.stderr}")
                
                # Execute the code from temp directory (so it finds node_modules)
                result = subprocess.run(
                    ['node', 'test.js'],
                    cwd=temp_dir,  # Run in temp dir where node_modules exists
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
                # Clean up temp directory
                try:
                    shutil.rmtree(temp_dir)
                except:
                    pass
        
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

@router.post("/convert")
async def convert_code(request: Dict):
    """Convert code between JavaScript and Python"""
    try:
        from_lang = request.get('from_language', 'javascript')
        to_lang = request.get('to_language', 'python')
        app_package = request.get('app_package', 'com.example.app')
        app_activity = request.get('app_activity', 'com.example.app.MainActivity')
        
        print(f"[CodeEditor] 🔄 Converting {from_lang} → {to_lang}")
        print(f"[CodeEditor] 📱 App: {app_package}")
        
        # Import code generators
        import sys
        sys.path.append('..')
        from utils.code_generator import generate_javascript_code, generate_python_code
        
        # Generate template with app config
        actions = []
        
        if to_lang == 'python':
            converted = generate_python_code(actions, app_package, app_activity)
            print(f"[CodeEditor] ✅ Converted to Python")
        else:
            converted = generate_javascript_code(actions, app_package, app_activity)
            print(f"[CodeEditor] ✅ Converted to JavaScript")
        
        return {
            "success": True,
            "converted_code": converted,
            "app_package": app_package,
            "app_activity": app_activity
        }
        
    except Exception as e:
        print(f"[CodeEditor] ❌ Conversion failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
