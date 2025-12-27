"""
Element Inspector - Detect UI elements at coordinates
Works with Appium to find elements by coordinates and generate smart selectors
"""

from typing import Optional, Dict, List
import xml.etree.ElementTree as ET
import re


class ElementInspector:
    """
    Inspect UI elements at screen coordinates
    Platform-aware: Android (XML hierarchy) and iOS (JSON hierarchy)
    """
    
    def __init__(self, driver, platform: str):
        """
        Initialize inspector
        
        Args:
            driver: Appium WebDriver instance
            platform: "android" or "ios"
        """
        self.driver = driver
        self.platform = platform
    
    def get_element_at_position(self, x: int, y: int) -> Optional[Dict]:
        """
        Find UI element at screen coordinates
        
        Args:
            x: Screen X coordinate
            y: Screen Y coordinate
            
        Returns:
            Element info dict with selectors, or None if not found
        """
        try:
            print(f"[ElementInspector] Finding element at ({x}, {y}) on {self.platform}")
            
            # Get UI hierarchy
            page_source = self.driver.page_source
            
            # Parse based on platform
            if self.platform == "android":
                elements = self._parse_android_hierarchy(page_source)
            else:
                elements = self._parse_ios_hierarchy(page_source)
            
            # Find element containing the coordinates
            element = self._find_element_at_coords(elements, x, y)
            
            if not element:
                print(f"[ElementInspector] No element found at ({x}, {y})")
                return None
            
            # Extract comprehensive element info
            element_info = self._extract_element_info(element)
            print(f"[ElementInspector] Found: {element_info.get('type')} - {element_info.get('text', 'no text')}")
            
            return element_info
            
        except Exception as e:
            print(f"[ElementInspector] Error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _parse_android_hierarchy(self, source: str) -> List[Dict]:
        """Parse Android XML hierarchy"""
        elements = []
        
        try:
            root = ET.fromstring(source)
            
            def traverse(node, depth=0):
                # Extract bounds from "[x1,y1][x2,y2]" format
                bounds_str = node.get("bounds", "")
                if bounds_str:
                    # Parse "[0,0][100,50]" format
                    parts = bounds_str.replace("][", ",").replace("[", "").replace("]", "").split(",")
                    if len(parts) == 4:
                        x1, y1, x2, y2 = map(int, parts)
                        bounds = {
                            "x": x1,
                            "y": y1,
                            "width": x2 - x1,
                            "height": y2 - y1
                        }
                        
                        elements.append({
                            "node": node,
                            "bounds": bounds,
                            "type": node.tag.split(".")[-1],  # android.widget.Button -> Button
                            "resourceId": node.get("resource-id", ""),
                            "text": node.get("text", ""),
                            "contentDesc": node.get("content-desc", ""),
                            "className": node.get("class", ""),
                            "clickable": node.get("clickable", "false") == "true",
                            "enabled": node.get("enabled", "false") == "true",
                            "focused": node.get("focused", "false") == "true",
                            "depth": depth
                        })
                
                # Traverse children
                for child in node:
                    traverse(child, depth + 1)
            
            traverse(root)
            print(f"[ElementInspector] Parsed {len(elements)} Android elements")
            
        except Exception as e:
            print(f"[ElementInspector] Error parsing Android hierarchy: {e}")
        
        return elements
    
    def _parse_ios_hierarchy(self, source: str) -> List[Dict]:
        """Parse iOS hierarchy (would need JSON parsing)"""
        # TODO: Implement iOS hierarchy parsing
        # iOS uses JSON format, needs different parsing
        print("[ElementInspector] iOS hierarchy parsing not yet implemented")
        return []
    
    def _find_element_at_coords(self, elements: List[Dict], x: int, y: int) -> Optional[Dict]:
        """Find deepest element containing coordinates"""
        # Sort by depth (deepest first) for precise selection
        sorted_elements = sorted(elements, key=lambda e: e["depth"], reverse=True)
        
        for elem in sorted_elements:
            bounds = elem["bounds"]
            if self._point_in_bounds(x, y, bounds):
                return elem
        
        return None
    
    def _point_in_bounds(self, x: int, y: int, bounds: Dict) -> bool:
        """Check if point is within bounds"""
        return (
            bounds["x"] <= x <= bounds["x"] + bounds["width"] and
            bounds["y"] <= y <= bounds["y"] + bounds["height"]
        )
    
    def _extract_element_info(self, element: Dict) -> Dict:
        """Extract comprehensive element information with selectors"""
        
        if self.platform == "android":
            return {
                "type": element["type"],
                "text": element["text"],
                "resourceId": element["resourceId"],
                "contentDesc": element["contentDesc"],
                "className": element["className"],
                "bounds": element["bounds"],
                "clickable": element["clickable"],
                "enabled": element["enabled"],
                "focused": element["focused"],
                
                # Generate smart selectors with priority order
                "selectors": self._generate_android_selectors(element)
            }
        else:
            # iOS implementation
            return {}
    
    def _generate_android_selectors(self, element: Dict) -> List[Dict]:
        """Generate fallback selectors for Android (priority order)"""
        selectors = []
        
        # Priority 1: Resource ID (most reliable)
        if element["resourceId"]:
            selectors.append({
                "type": "id",
                "value": element["resourceId"],
                "priority": 1,
                "description": "Resource ID (recommended)"
            })
        
        # Priority 2: Text (good if unique)
        if element["text"]:
            selectors.append({
                "type": "text",
                "value": element["text"],
                "priority": 2,
                "description": "Visible text"
            })
        
        # Priority 3: Content Description (accessibility)
        if element["contentDesc"]:
            selectors.append({
                "type": "contentDesc",
                "value": element["contentDesc"],
                "priority": 3,
                "description": "Content description"
            })
        
        # Priority 4: XPath (generated, less reliable)
        xpath = self._generate_android_xpath(element)
        if xpath:
            selectors.append({
                "type": "xpath",
                "value": xpath,
                "priority": 4,
                "description": "XPath selector"
            })
        
        # Priority 5: Coordinates (last resort)
        center_x = element["bounds"]["x"] + element["bounds"]["width"] // 2
        center_y = element["bounds"]["y"] + element["bounds"]["height"] // 2
        selectors.append({
            "type": "coordinates",
            "value": {"x": center_x, "y": center_y},
            "priority": 5,
            "description": "Tap coordinates (fallback)"
        })
        
        return selectors
    
    def _generate_android_xpath(self, element: Dict) -> str:
        """Generate XPath for element (basic implementation)"""
        # Simple XPath based on class and text/resource-id
        xpath_parts = [element["className"]]
        
        if element["resourceId"]:
            xpath_parts.append(f"[@resource-id='{element['resourceId']}']")
        elif element["text"]:
            xpath_parts.append(f"[@text='{element['text']}']")
        
        return f"//{xpath_parts[0]}{xpath_parts[1] if len(xpath_parts) > 1 else ''}"
