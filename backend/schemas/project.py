from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AppCreate(BaseModel):
    name: str
    package_name: str
    platform: str
    version: Optional[str] = None
    file_path: str

class AppResponse(BaseModel):
    id: int
    project_id: int
    name: str
    package_name: str
    platform: str
    version: Optional[str]
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True
