"""
AUTOMATIC KEYBOARD TYPING - Implementation

Add this method to PlaywrightController class (around line 106):
"""

async def _setup_typing_detection(self):
    """Setup automatic keyboard typing detection"""
    if not self.page:
        return
    
    try:
        # Inject script to track typing in input fields
        await self.page.evaluate("""
            () => {
                // Listen to all input/textarea changes
                document.addEventListener('input', (e) => {
                    const target = e.target;
                    
                    // Only track input and textarea elements
                    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
                        return;
                    }
                    
                    // Generate selector
                    const getSelector = (el) => {
                        if (el.id) return `#${el.id}`;
                        if (el.name) return `[name="${el.name}"]`;
                        const path = [];
                        while (el && el.nodeType === Node.ELEMENT_NODE) {
                            let selector = el.nodeName.toLowerCase();
                            if (el.className) {
                                const classes = el.className.split(' ').filter(c => c);
                                if (classes.length > 0) {
                                    selector += '.' + classes[0];
                                }
                            }
                            path.unshift(selector);
                            el = el.parentNode;
                        }
                        return path.join(' > ');
                    };
                    
                    const selector = getSelector(target);
                    const value = target.value;
                    
                    // Store in window for backend to access
                    window._lastTypingAction = {
                        selector: selector,
                        text: value,
                        timestamp: new Date().toISOString()
                    };
                });
            }
        """)
        
        print("[Playwright] ⌨️ Typing detection enabled")
        
    except Exception as e:
        print(f"[Playwright] ⚠️ Typing detection setup failed: {e}")
