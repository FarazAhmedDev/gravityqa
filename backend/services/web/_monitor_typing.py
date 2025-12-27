# Add this method to PlaywrightController class

async def _monitor_typing(self):
    """Background task to monitor and auto-record typing"""
    print("[Typing] 🎯 Auto-monitor started")
    
    try:
        while self.is_recording:
            if not self.page:
                break
            
            # Get last typing action from page
            typing_data = await get_last_typing(self.page)
            
            if typing_data and typing_data.get('text'):
                text = typing_data['text']
                selector = typing_data['selector']
                
                # Deduplicate - only record if text changed
                if text != self._last_typing_text:
                    self._last_typing_text = text
                    
                    # Add to recorded actions
                    self.recorded_actions.append({
                        'id': len(self.recorded_actions) + 1,
                        'type': 'type',
                        'selector': selector,
                        'data': {'text': text},
                        'timestamp': datetime.now().isoformat(),
                        'enabled': True
                    })
                    
                    print(f"[Typing] ⌨️ Auto-recorded: '{text}' at {selector}")
            
            # Poll every 1 second
            await asyncio.sleep(1.0)
            
    except asyncio.CancelledError:
        print("[Typing] 🛑 Monitor cancelled")
    except Exception as e:
        print(f"[Typing] ❌ Monitor error: {e}")
