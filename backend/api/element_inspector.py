"""Element Inspector - Get UI hierarchy and find elements"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import xml.etree.ElementTree as ET
from services.mobile.appium_service import get_appium_service

router = APIRouter(prefix="/api/inspector", tags=["inspector"])
appium_service = get_appium_service()  # Shared singleton instance

# Global session storage (temporary - should use proper session management)
_active_sessions = {}

def parse_bounds(bounds_str: str) -> Dict[str, int]:
    """Parse bounds string like '[100,200][300,400]' to dict"""
    try:
        parts = bounds_str.replace('][', ',').strip('[]').split(',')
        return {
            "x1": int(parts[0]),
            "y1": int(parts[1]),
            "x2": int(parts[2]),
            "y3": int(parts[3])
        }
    except:
        return {"x1": 0, "y1": 0, "x2": 0, "y2": 0}

def element_to_dict(elem: ET.Element) -> Dict:
    """Convert XML element to dict with properties"""
    bounds = parse_bounds(elem.get('bounds', '[0,0][0,0]'))
    
    return {
        "class": elem.get('class', ''),
        "resource_id": elem.get('resource-id', ''),
        "text": elem.get('text', ''),
        "content_desc": elem.get('content-desc', ''),
        "clickable": elem.get('clickable', 'false') == 'true',
        "enabled": elem.get('enabled', 'true') == 'true',
        "focused": elem.get('focused', 'false') == 'true',
        "bounds": bounds,
        "index": elem.get('index', '0')
    }

def find_element_at_position(elem: ET.Element, x: int, y: int, current_path: List[str] = None, depth: int = 0) -> Optional[Dict]:
    """Recursively find deepest element containing (x, y)"""
    if current_path is None:
        current_path = []
    
    bounds_str = elem.get('bounds', '[0,0][0,0]')
    try:
        parts = bounds_str.replace('][', ',').strip('[]').split(',')
        bounds = {
            "x1": int(parts[0]),
            "y1": int(parts[1]),
            "x2": int(parts[2]),
            "y2": int(parts[3])
        }
    except Exception as e:
        if depth < 3:
            print(f"[Inspector]   {'  ' * depth}⚠️ Bounds parse error: {bounds_str} -> {e}")
        return None
    
    # Debug log for root and first few levels
    if depth == 0:
        print(f"[Inspector] 🎯 ROOT Search at ({x},{y}), root bounds: {bounds}")
        print(f"[Inspector] Root element: {elem.tag}, class: {elem.get('class', 'N/A')}")
    
    # Check if point is within bounds
    in_bounds = bounds['x1'] <= x <= bounds['x2'] and bounds['y1'] <= y <= bounds['y2']
    
    # Log first few levels to see what's happening
    if depth < 5:
        class_name = elem.get('class', 'Unknown').split('.')[-1]
        resource_id = elem.get('resource-id', '')
        print(f"[Inspector]   {'  ' * depth}{'✓' if in_bounds else '✗'} D{depth} {class_name} {f'[{resource_id}]' if resource_id else ''}")
        print(f"[Inspector]   {'  ' * depth}  Bounds: [{bounds['x1']},{bounds['y1']}][{bounds['x2']},{bounds['y2']}]")
        print(f"[Inspector]   {'  ' * depth}  Point ({x},{y}) in bounds: {in_bounds}")
    
    if not in_bounds:
        return None
    
    # This element contains the point
    class_name = elem.get('class', '').split('.')[-1]
    current_path.append(class_name)
    
    if depth < 5:
        print(f"[Inspector]   {'  ' * depth}→ Element CONTAINS point, checking children...")
    
    # Check children to find deepest
    deepest = None
    child_count = len(list(elem))
    
    if depth < 5 and child_count > 0:
        print(f"[Inspector]   {'  ' * depth}  Searching {child_count} children...")
    
    for i, child in enumerate(elem):
        result = find_element_at_position(child, x, y, current_path.copy(), depth + 1)
        if result:
            deepest = result  # Keep going to find THE deepest
            if depth < 3:
                print(f"[Inspector]   {'  ' * depth}  Child {i+1} matched!")
    
    # If no deeper child, this is it!
    if not deepest:
        element_data = element_to_dict(elem)
        element_data['hierarchy'] = current_path
        element_data['xpath'] = generate_xpath(elem)
        print(f"[Inspector] ✅ FOUND DEEPEST: {class_name}, ID: {elem.get('resource-id', 'N/A')}, bounds: {bounds}")
        return element_data
    
    return deepest

def generate_xpath(elem: ET.Element) -> str:
    """Generate XPath for element"""
    resource_id = elem.get('resource-id', '')
    text = elem.get('text', '')
    class_name = elem.get('class', '')
    
    if resource_id:
        return f"//*[@resource-id='{resource_id}']"
    if text:
        return f"//*[@text='{text}']"
    if class_name:
        return f"//{class_name.split('.')[-1]}"
    
    return "//*"

@router.get("/page-source")
async def get_page_source():
    """Get UI hierarchy from active Appium session"""
    try:
        if not appium_service.active_sessions:
            raise HTTPException(status_code=400, detail="No active Appium session. Please launch app first.")
        
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[Inspector] Getting page source for session: {session_id}")
        
        page_source = appium_service.get_page_source(session_id)
        
        if not page_source:
            raise HTTPException(status_code=500, detail="Failed to get page source")
        
        print(f"[Inspector] Got page source ({len(page_source)} chars)")
        
        try:
            root = ET.fromstring(page_source)
            print(f"[Inspector] ✅ XML parsed successfully")
        except Exception as e:
            print(f"[Inspector] ❌ XML parse error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to parse page source: {str(e)}")
        
        return {
            "success": True,
            "xml": page_source,
            "root_class": root.get('class', 'unknown')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Inspector] Error getting page source: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/element-at-position")
async def get_element_at_position(x: int, y: int):
    """Find element at given coordinates"""
    try:
        print(f"[Inspector] 🎯 Finding element at ({x},{y})")
        
        if not appium_service.active_sessions:
            print(f"[Inspector] ❌ No active sessions!")
            raise HTTPException(status_code=400, detail="No active Appium session")
        
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[Inspector] Using session: {session_id}")
        
        page_source = appium_service.get_page_source(session_id)
        
        if not page_source or len(page_source) < 100:
            print(f"[Inspector] ❌ Page source empty or too small: {len(page_source) if page_source else 0} chars")
            raise HTTPException(status_code= 500, detail="Failed to get page source")
        
        print(f"[Inspector] Got page source: {len(page_source)} chars")
        
        root = ET.fromstring(page_source)
        print(f"[Inspector] Parsed XML, {len(list(root.iter()))} elements")
        
        element = find_element_at_position(root, x, y)
        
        if not element:
            print(f"[Inspector] ❌ No element found at ({x},{y})")
            return {
                "found": False,
                "x": x,
                "y": y
            }
        
        print(f"[Inspector] ✅ Returning element!")
        
        return {
            "found": True,
            "element": element,
            "x": x,
            "y": y
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Inspector] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute-tap")
async def execute_tap(request: dict):
    """Execute tap on device and return action object for recording"""
    try:
        element = request.get('element')
        coordinates = request.get('coordinates')
        
        print(f"[Inspector] Execute tap requested for element: {element.get('class', 'unknown')}")
        
        # Get active session
        if not appium_service.active_sessions:
            print("[Inspector] ❌ No active sessions!")
            raise HTTPException(status_code=400, detail="No active Appium session")
        
        session_id = list(appium_service.active_sessions.keys())[-1]
        print(f"[Inspector] Using session: {session_id}")
        
        # Calculate center of element bounds
        bounds = element.get('bounds',{})
        x = (bounds.get('x1', 0) + bounds.get('x2', 0)) // 2
        y = (bounds.get('y1', 0) + bounds.get('y2', 0)) // 2
        
        print(f"[Inspector] Tapping at element center: ({x}, {y})")
        
        # Execute tap on device
        await appium_service.tap_at_coordinate(session_id, x, y)
        
        print(f"[Inspector] ✅ Tap executed successfully!")
        
        # Create action object
        import time
        action = {
            "action": "tap",
            "timestamp": time.time(),
            "target": {
                "strategy": "id" if element.get('resource_id') else "xpath",
                "value": element.get('resource_id') or element.get('xpath') or ""
            },
            "fallback": {
                "x": coordinates.get('x', x),
                "y": coordinates.get('y', y)
            },
            "meta": {
                "class": element.get('class', ''),
                "text": element.get('text', ''),
                "contentDesc": element.get('content_desc', ''),
                "clickable": element.get('clickable', False)
            }
        }
        
        print(f"[Inspector] ✅ Action created: {action['action']} → {action['meta'].get('text') or action['meta']['class']}")
        
        return action
        
    except Exception as e:
        print(f"[Inspector] ❌ Execute tap failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
