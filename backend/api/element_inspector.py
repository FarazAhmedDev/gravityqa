"""Element Inspector - Get UI hierarchy and find elements"""
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import xml.etree.ElementTree as ET

router = APIRouter(prefix="/api/inspector", tags=["inspector"])

# Global session storage (temporary - should use proper session management)
_active_sessions = {}

def parse_bounds(bounds_str: str) -> Dict[str, int]:
    """Parse bounds string like '[100,200][300,400]' to dict"""
    try:
        # Format: [x1,y1][x2,y2]
        parts = bounds_str.replace('][', ',').strip('[]').split(',')
        return {
            "x1": int(parts[0]),
            "y1": int(parts[1]),
            "x2": int(parts[2]),
            "y2": int(parts[3])
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

def find_element_at_position(elem: ET.Element, x: int, y: int, current_path: List[str] = None) -> Optional[Dict]:
    """Recursively find deepest element containing (x, y)"""
    if current_path is None:
        current_path = []
    
    bounds = parse_bounds(elem.get('bounds', '[0,0][0,0]'))
    
    # Check if point is within bounds
    if not (bounds['x1'] <= x <= bounds['x2'] and bounds['y1'] <= y <= bounds['y2']):
        return None
    
    # This element contains the point
    class_name = elem.get('class', '').split('.')[-1]  # Get short class name
    current_path.append(class_name)
    
    # Check children (try to find deepest element)
    deepest = None
    for child in elem:
        result = find_element_at_position(child, x, y, current_path.copy())
        if result:
            deepest = result
            break
    
    # If no child contains it, return this element
    if not deepest:
        element_data = element_to_dict(elem)
        element_data['hierarchy'] = current_path
        element_data['xpath'] = generate_xpath(elem)
        return element_data
    
    return deepest

def generate_xpath(elem: ET.Element) -> str:
    """Generate XPath for element"""
    resource_id = elem.get('resource-id', '')
    text = elem.get('text', '')
    class_name = elem.get('class', '')
    
    # Prefer resource-id (most reliable)
    if resource_id:
        return f"//*[@resource-id='{resource_id}']"
    
    # Then text
    if text:
        return f"//*[@text='{text}']"
    
    # Finally class
    if class_name:
        return f"//{class_name.split('.')[-1]}"
    
    return "//*"

@router.get("/page-source")
async def get_page_source():
    """Get UI hierarchy from active Appium session"""
    try:
        from services.mobile.appium_service import appium_service
        
        # Get latest active session
        if not appium_service.active_sessions:
            raise HTTPException(status_code=400, detail="No active Appium session. Please launch app first.")
        
        # Get the latest session ID
        session_id = list(appium_service.active_sessions.keys())[-1]
        
        print(f"[Inspector] Getting page source for session: {session_id}")
        
        # Get page source XML using existing appium_service method
        page_source = appium_service.get_page_source(session_id)
        
        if not page_source:
            raise HTTPException(status_code=500, detail="Failed to get page source")
        
        print(f"[Inspector] Got page source ({len(page_source)} chars)")
        
        # Parse XML to validate
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
        from services.mobile.appium_service import appium_service
        
        # Get latest active session
        if not appium_service.active_sessions:
            raise HTTPException(status_code=400, detail="No active Appium session")
        
        # Get the latest session ID
        session_id = list(appium_service.active_sessions.keys())[-1]
        
        # Get page source using existing method
        page_source = appium_service.get_page_source(session_id)
        
        if not page_source:
            raise HTTPException(status_code=500, detail="Failed to get page source")
        
        # Parse XML
        root = ET.fromstring(page_source)
        
        # Find element at position
        element = find_element_at_position(root, x, y)
        
        if not element:
            return {
                "found": False,
                "x": x,
                "y": y
            }
        
        print(f"[Inspector] Found element at ({x},{y}): {element.get('class', 'unknown')}")
        
        return {
            "found": True,
            "element": element,
            "x": x,
            "y": y
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Inspector] Error finding element: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
