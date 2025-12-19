from pydantic import BaseModel
from typing import Optional

class DeviceResponse(BaseModel):
    id: int
    device_id: str
    name: str
    platform: str
    platform_version: Optional[str]
    device_type: str
    manufacturer: Optional[str]
    model: Optional[str]
    is_connected: bool
    
    class Config:
        from_attributes = True
