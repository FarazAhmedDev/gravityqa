"""Appium Driver Manager - Simple driver storage and retrieval"""

# Global driver storage (device_id -> driver instance)
_drivers = {}

def get_driver(device_id: str):
    """Get the driver instance for a specific device"""
    if device_id not in _drivers:
        return None
    return _drivers[device_id]

def set_driver(device_id: str, driver):
    """Store a driver instance for a device"""
    _drivers[device_id] = driver

def remove_driver(device_id: str):
    """Remove a driver instance"""
    if device_id in _drivers:
        del _drivers[device_id]

def clear_all_drivers():
    """Clear all driver instances"""
    _drivers.clear()
