"""Global App Configuration Store"""

class AppConfigStore:
    """Store the current app package and activity"""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.package_name = None
            cls._instance.activity = None
            cls._instance.app_name = None
        return cls._instance
    
    def set_app(self, package_name: str, activity: str, app_name: str = None):
        """Set current app information"""
        self.package_name = package_name
        self.activity = activity
        self.app_name = app_name
        print(f"[AppConfig] ✅ Set app: {package_name} / {activity}")
    
    def get_app(self):
        """Get current app information"""
        return {
            "package_name": self.package_name,
            "activity": self.activity,
            "app_name": self.app_name
        }
    
    def has_app(self):
        """Check if app info is available"""
        return self.package_name is not None and self.activity is not None

# Singleton instance
app_config_store = AppConfigStore()
