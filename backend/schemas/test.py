from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TestRunCreate(BaseModel):
    project_id: int
    test_suite_id: Optional[int] = None
    name: str
    mode: str = "autonomous"
    test_type: str = "mobile"
    device_id: Optional[str] = None
    app_id: Optional[int] = None

class TestRunResponse(BaseModel):
    id: int
    project_id: int
    name: str
    status: str
    mode: str
    test_type: str
    total_steps: int
    passed_steps: int
    failed_steps: int
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class TestStepResponse(BaseModel):
    id: int
    test_run_id: int
    step_number: int
    action_type: str
    description: str
    status: str
    timestamp: datetime
    
    class Config:
        from_attributes = True
