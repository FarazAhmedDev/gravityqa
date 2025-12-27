# Add this method to PlaywrightController class after line 106

async def _setup_typing_detection(self):
    """Setup typing detection using util"""
    await setup_typing_detection(self.page)
