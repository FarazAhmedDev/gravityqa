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

def parse_bounds_robust(bounds_str: str) -> Optional[Dict[str, int]]:
    """
    Parse Android bounds string robustly
    Handles: "[0,0][1080,2340]" or "[0, 0][1080, 2340]" or "[-10, 5][1080, 2340]"
    """
    import re
    
    # Regex to handle spaces and negative numbers
    pattern = r'\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]\s*\[\s*(-?\d+)\s*,\s*(-?\d+)\s*\]'
    match = re.match(pattern, bounds_str)
    
    if match:
        return {
            'x1': int(match.group(1)),
            'y1': int(match.group(2)),
            'x2': int(match.group(3)),
            'y2': int(match.group(4))
        }
    return None


def find_element_at_position(root: ET.Element, x: int, y: int) -> Optional[Dict]:
    """
    Find element at position (x, y) - NO FILTERING, ALL NODES INCLUDED
    
    Algorithm:
    1. Parse ALL nodes with bounds (no filtering)
    2. Find all candidates containing point
    3. Select smallest area (most specific)
    4. If tie, select deepest
    """
    
    all_candidates = []
    parsed_count = 0
    sample_bounds = []
    
    def traverse(elem: ET.Element, depth: int = 0):
        nonlocal parsed_count, sample_bounds
        
        bounds_str = elem.get('bounds', '')
        
        if not bounds_str:
            # No bounds, skip but continue to children
            for child in elem:
                traverse(child, depth + 1)
            return
        
        # Parse bounds ROBUSTLY
        bounds = parse_bounds_robust(bounds_str)
        
        if not bounds:
            # Parse failed, log and skip
            if parsed_count < 5:
                print(f"[Inspector] ⚠️ Failed to parse bounds: '{bounds_str}'")
            for child in elem:
                traverse(child, depth + 1)
            return
        
        parsed_count += 1
        
        # Log first 5 parsed bounds for debugging
        if parsed_count <= 5:
            sample_bounds.append(bounds)
            class_name = elem.get('class', 'Unknown').split('.')[-1]
            print(f"[Inspector] 📦 Node {parsed_count}: {class_name} bounds={bounds}")
        
        # Check if point is inside bounds
        x1, y1, x2, y2 = bounds['x1'], bounds['y1'], bounds['x2'], bounds['y2']
        
        if x1 <= x <= x2 and y1 <= y <= y2:
            # Point is inside!
            area = (x2 - x1) * (y2 - y1)
            
            all_candidates.append({
                'element': elem,
                'bounds': bounds,
                'area': area,
                'depth': depth,
                'class': elem.get('class', ''),
                'resource_id': elem.get('resource-id', ''),
                'text': elem.get('text', ''),
                'content_desc': elem.get('content-desc', ''),
                'clickable': elem.get('clickable', 'false') == 'true',
                'enabled': elem.get('enabled', 'true') == 'true'
            })
        
        # ALWAYS traverse children (no filtering)
        for child in elem:
            traverse(child, depth + 1)
    
    # Start traversal from root
    print(f"[Inspector] 🔍 Starting element search at ({x},{y})")
    traverse(root, 0)
    
    print(f"[Inspector] 📊 Parsed {parsed_count} nodes total")
    print(f"[Inspector] 📊 Found {len(all_candidates)} candidates containing point")
    
    if not all_candidates:
        print(f"[Inspector] ❌ NO CANDIDATES FOUND!")
        print(f"[Inspector] 📦 First 5 parsed bounds: {sample_bounds[:5]}")
        return None
    
    # SMART ELEMENT SELECTION
    # Score calculation to prefer:
    # 1. Smaller area (more specific)
    # 2. Clickable elements
    # 3. Elements with text/content-desc/resource-id
    # 4. Deeper elements
    # 5. Avoid ImageView without attributes
    
    def score_element(candidate):
        """Lower score = better candidate"""
        score = 0
        
        # Area score (primary) - smaller is better
        score += candidate['area'] * 0.1
        
        # Penalize ImageView heavily if it has no useful attributes
        is_imageview = 'ImageView' in candidate['class']
        has_attrs = bool(candidate['text'] or candidate['content_desc'] or candidate['resource_id'])
        
        if is_imageview and not has_attrs:
            score += 1000000  # Very high penalty
            
        # Prefer clickable elements
        if not candidate['clickable']:
            score += 50000
        
        # Prefer elements with identifying attributes
        if not has_attrs:
            score += 10000
        
        # Prefer deeper elements (more specific)
        score -= candidate['depth'] * 100
        
        return score
    
    # Sort by score
    all_candidates.sort(key=score_element)
    best = all_candidates[0]
    
    # Final check: If best is still ImageView without attrs, try to find clickable ancestor
    is_imageview = 'ImageView' in best['class']
    has_attrs = bool(best['text'] or best['content_desc'] or best['resource_id'])
    
    if is_imageview and not has_attrs:
        # Look for a clickable ancestor with attributes
        clickable_ancestor = None
        for c in all_candidates[1:]:  # Skip the ImageView itself
            if c['clickable'] and (c['text'] or c['content_desc'] or c['resource_id']):
                clickable_ancestor = c
                break
        
        if clickable_ancestor:
            print(f"[Inspector] 🔄 ImageView has no attrs, switching to clickable ancestor")
            best = clickable_ancestor
    
    print(f"[Inspector] ✅ Selected: {best['class'].split('.')[-1]} (area={best['area']}, depth={best['depth']}, clickable={best['clickable']})")
    if best['resource_id']:
        print(f"[Inspector]    resource-id: {best['resource_id']}")
    if best['text']:
        print(f"[Inspector]    text: {best['text']}")
    if best['content_desc']:
        print(f"[Inspector]    content-desc: {best['content_desc']}")
    
    # Generate XPath for the element
    def generate_xpath_for_elem(elem: ET.Element) -> str:
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
    
    return {
        'class': best['class'],
        'resource_id': best['resource_id'],
        'text': best['text'],
        'content_desc': best['content_desc'],
        'clickable': best['clickable'],
        'enabled': best['enabled'],
        'bounds': best['bounds'],
        'area': best['area'],
        'depth': best['depth'],
        'xpath': generate_xpath_for_elem(best['element'])
    }

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
    """
    Find element at screenshot pixel coordinates
    
    Args:
        x, y: Coordinates in screenshot pixel space (naturalWidth/Height)
    
    Returns:
        Element info with device coords in bounds
    """
    try:
        print(f"\n[Inspector] 🎯 Element at SCREENSHOT coords ({x},{y})")
        
        if not appium_service.active_sessions:
            print(f"[Inspector] ❌ No active sessions!")
            return {
                "found": False,
                "screenshotPoint": {"x": x, "y": y},
                "reason": "No active Appium session"
            }
        
        # Get the MOST RECENT session
        session_ids = list(appium_service.active_sessions.keys())
        session_id = session_ids[-1]
        print(f"[Inspector] Session: {session_id}")
        
        # Get dimensions
        screenshot_dims = appium_service.screenshot_dimensions.get(session_id)
        device_dims = await appium_service.get_device_dimensions(session_id)
        
        if not screenshot_dims:
            print(f"[Inspector] ⚠️ Screenshot dimensions not available, assuming 1:1 with device")
            screenshot_dims = device_dims
        
        print(f"[Inspector] 📸 Screenshot dims: {screenshot_dims['width']}x{screenshot_dims['height']}")
        print(f"[Inspector] 📱 Device dims: {device_dims['width']}x{device_dims['height']}")
        
        # COORDINATE TRANSFORMATION: Screenshot → Device
        screenshot_width = screenshot_dims['width']
        screenshot_height = screenshot_dims['height']
        device_width = device_dims['width']
        device_height = device_dims['height']
        
        device_x = round(x * device_width / screenshot_width)
        device_y = round(y * device_height / screenshot_height)
        
        # Clamp to device bounds
        device_x = max(0, min(device_width - 1, device_x))
        device_y = max(0, min(device_height - 1, device_y))
        
        print(f"[Inspector] 🔄 Transform: ({x},{y}) → ({device_x},{device_y})")
        
        # Get page source
        page_source = appium_service.get_page_source(session_id)
        
        if not page_source or len(page_source) < 100:
            print(f"[Inspector] ❌ Page source invalid: {len(page_source) if page_source else 0} chars")
            return {
                "found": False,
                "screenshotPoint": {"x": x, "y": y},
                "devicePoint": {"x": device_x, "y": device_y},
                "sizes": {"screenshot": screenshot_dims, "device": device_dims},
                "reason": "Failed to get page source"
            }
        
        print(f"[Inspector] ✅ Page source: {len(page_source)} chars")
        
        # Parse XML
        root = ET.fromstring(page_source)
        total_nodes = len(list(root.iter()))
        print(f"[Inspector] 📄 Parsed XML: {total_nodes} nodes")
        
        # Find element at DEVICE coordinates
        element = find_element_at_position(root, device_x, device_y)
        
        if not element:
            print(f"[Inspector] ❌ No element at device coords ({device_x},{device_y})")
            return {
                "found": False,
                "screenshotPoint": {"x": x, "y": y},
                "devicePoint": {"x": device_x, "y": device_y},
                "sizes": {"screenshot": screenshot_dims, "device": device_dims},
                "reason": f"No element contains point in {total_nodes} nodes"
            }
        
        print(f"[Inspector] ✅ FOUND: {element.get('class', '')} (depth={element.get('depth', 0)})")
        
        return {
            "found": True,
            "element": element,
            "screenshotPoint": {"x": x, "y": y},
            "devicePoint": {"x": device_x, "y": device_y},
            "sizes": {"screenshot": screenshot_dims, "device": device_dims}
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
