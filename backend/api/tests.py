from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.test_suite import TestRun, TestStep
from schemas.test import TestRunCreate, TestRunResponse
from services.orchestrator.test_orchestrator import TestOrchestrator
from datetime import datetime

router = APIRouter()
orchestrator = TestOrchestrator()

@router.post("/start-ai-exploration", response_model=dict)
async def start_ai_exploration(
    test_config: dict,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start AI autonomous exploration"""
    # Create test run
    test_run = TestRun(
        project_id=test_config.get("project_id"),
        name=f"AI Exploration - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        status="pending",
        mode="autonomous",
        test_type=test_config.get("test_type", "mobile"),
        device_id=test_config.get("device_id"),
        app_id=test_config.get("app_id"),
        started_at=datetime.utcnow()
    )
    
    db.add(test_run)
    db.commit()
    db.refresh(test_run)
    
    # Start exploration in background
    background_tasks.add_task(
        orchestrator.run_ai_exploration,
        test_run.id,
        test_config
    )
    
    return {
        "test_run_id": test_run.id,
        "status": "started",
        "websocket_channel": f"test-run-{test_run.id}"
    }

@router.post("/run", response_model=dict)
async def run_test(
    test_suite_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Run a test suite"""
    # Create test run
    test_run = TestRun(
        test_suite_id=test_suite_id,
        name=f"Test Run - {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        status="pending",
        mode="manual",
        started_at=datetime.utcnow()
    )
    
    db.add(test_run)
    db.commit()
    db.refresh(test_run)
    
    # Run test in background
    background_tasks.add_task(
        orchestrator.run_test_suite,
        test_run.id,
        test_suite_id
    )
    
    return {
        "test_run_id": test_run.id,
        "status": "started"
    }

@router.get("/runs/{test_run_id}", response_model=dict)
async def get_test_run(test_run_id: int, db: Session = Depends(get_db)):
    """Get test run details"""
    test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    steps = db.query(TestStep).filter(TestStep.test_run_id == test_run_id).all()
    
    return {
        "id": test_run.id,
        "name": test_run.name,
        "status": test_run.status,
        "mode": test_run.mode,
        "test_type": test_run.test_type,
        "total_steps": test_run.total_steps,
        "passed_steps": test_run.passed_steps,
        "failed_steps": test_run.failed_steps,
        "started_at": test_run.started_at,
        "ended_at": test_run.ended_at,
        "steps": [
            {
                "id": s.id,
                "step_number": s.step_number,
                "action_type": s.action_type,
                "description": s.description,
                "status": s.status,
                "screenshot_path": s.screenshot_path,
                "timestamp": s.timestamp
            }
            for s in steps
        ]
    }

@router.post("/runs/{test_run_id}/stop")
async def stop_test_run(test_run_id: int, db: Session = Depends(get_db)):
    """Stop a running test"""
    test_run = db.query(TestRun).filter(TestRun.id == test_run_id).first()
    if not test_run:
        raise HTTPException(status_code=404, detail="Test run not found")
    
    # Signal orchestrator to stop
    orchestrator.stop_test(test_run_id)
    
    test_run.status = "stopped"
    test_run.ended_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Test run stopped"}
