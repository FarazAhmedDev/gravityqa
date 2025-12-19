from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class TestSuite(Base):
    __tablename__ = "test_suites"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    language = Column(String, default="python")  # python, javascript, typescript
    framework = Column(String, default="pytest")  # pytest, jest, mocha
    file_path = Column(String, nullable=True)
    content = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="test_suites")
    test_runs = relationship("TestRun", back_populates="test_suite", cascade="all, delete-orphan")

class TestRun(Base):
    __tablename__ = "test_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    test_suite_id = Column(Integer, ForeignKey("test_suites.id"), nullable=True)
    name = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, running, completed, failed
    mode = Column(String, default="autonomous")  # autonomous, manual, assisted
    test_type = Column(String, default="mobile")  # mobile, web, api
    
    # Results
    total_steps = Column(Integer, default=0)
    passed_steps = Column(Integer, default=0)
    failed_steps = Column(Integer, default=0)
    
    # Metadata
    device_id = Column(String, nullable=True)
    app_id = Column(Integer, ForeignKey("apps.id"), nullable=True)
    test_data = Column(JSON, nullable=True)
    report_path = Column(String, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="test_runs")
    test_suite = relationship("TestSuite", back_populates="test_runs")
    test_steps = relationship("TestStep", back_populates="test_run", cascade="all, delete-orphan")

class TestStep(Base):
    __tablename__ = "test_steps"
    
    id = Column(Integer, primary_key=True, index=True)
    test_run_id = Column(Integer, ForeignKey("test_runs.id"), nullable=False)
    step_number = Column(Integer, nullable=False)
    action_type = Column(String, nullable=False)  # click, input, swipe, wait
    description = Column(Text, nullable=False)
    element_xpath = Column(String, nullable=True)
    input_value = Column(String, nullable=True)
    screenshot_path = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, success, failed
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    test_run = relationship("TestRun", back_populates="test_steps")
