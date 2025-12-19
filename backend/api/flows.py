"""Flow Management API - Save, load, list, delete flows"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.flow import Flow
from pydantic import BaseModel

router = APIRouter(prefix="/api/flows", tags=["flows"])

class FlowCreate(BaseModel):
    name: str
    description: str = None
    device_id: str
    device_name: str
    device_platform: str
    device_os_version: str = None
    app_package: str
    app_name: str = None
    app_version:str = None
    app_activity: str = None  # Main activity for launching
    steps: list
    flow_metadata: dict = None

class FlowUpdate(BaseModel):
    name: str = None
    description: str = None
    steps: list = None

@router.post("/", response_model=dict)
async def create_flow(flow: FlowCreate, db: Session = Depends(get_db)):
    """Create a new flow"""
    
    # Auto-fetch activity from active session if not provided
    activity_to_save = flow.app_activity
    
    if not activity_to_save:
        try:
            from services.mobile.appium_service import AppiumService
            appium_service = AppiumService()
            
            if appium_service.active_sessions:
                session_id = list(appium_service.active_sessions.keys())[-1]
                session_caps = appium_service.active_sessions[session_id]
                activity_to_save = session_caps.get('appium:appActivity')
                print(f"[FlowSave] Auto-fetched activity from session: {activity_to_save}")
            else:
                print(f"[FlowSave] ⚠️ No active session, activity will be NULL")
        except Exception as e:
            print(f"[FlowSave] ⚠️ Failed to auto-fetch activity: {e}")
    
    db_flow = Flow(
        name=flow.name,
        description=flow.description,
        device_id=flow.device_id,
        device_name=flow.device_name,
        device_platform=flow.device_platform,
        device_os_version=flow.device_os_version,
        app_package=flow.app_package,
        app_name=flow.app_name,
        app_version=flow.app_version,
        app_activity=activity_to_save,  # Save activity!
        steps=flow.steps,
        flow_metadata=flow.flow_metadata
    )
    
    db.add(db_flow)
    db.commit()
    db.refresh(db_flow)
    
    return db_flow.to_dict()

@router.get("/", response_model=List[dict])
async def list_flows(db: Session = Depends(get_db)):
    """List all flows"""
    flows = db.query(Flow).order_by(Flow.created_at.desc()).all()
    return [flow.to_dict() for flow in flows]

@router.get("/{flow_id}", response_model=dict)
async def get_flow(flow_id: int, db: Session = Depends(get_db)):
    """Get a specific flow"""
    flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    return flow.to_dict()

@router.put("/{flow_id}", response_model=dict)
async def update_flow(flow_id: int, flow: FlowUpdate, db: Session = Depends(get_db)):
    """Update a flow"""
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    if flow.name:
        db_flow.name = flow.name
    if flow.description is not None:
        db_flow.description = flow.description
    if flow.steps:
        db_flow.steps = flow.steps
    
    db.commit()
    db.refresh(db_flow)
    
    return db_flow.to_dict()

@router.delete("/{flow_id}")
async def delete_flow(flow_id: int, db: Session = Depends(get_db)):
    """Delete a flow"""
    db_flow = db.query(Flow).filter(Flow.id == flow_id).first()
    if not db_flow:
        raise HTTPException(status_code=404, detail="Flow not found")
    
    db.delete(db_flow)
    db.commit()
    
    return {"message": "Flow deleted successfully"}
