"""Flow model for storing recorded test flows"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from sqlalchemy.sql import func
from database import Base

class Flow(Base):
    """Recorded test flow with steps and metadata"""
    __tablename__ = "flows"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    
    # Device information
    device_id = Column(String(100), nullable=False)
    device_name = Column(String(255))
    device_platform = Column(String(50))
    device_os_version = Column(String(50))
    
    # App information
    app_package = Column(String(255), nullable=False)
    app_name = Column(String(255))
    app_version = Column(String(50))
    app_activity = Column(String(255), nullable=True)  # Main activity for launching
    
    # Flow data
    steps = Column(JSON, nullable=False)  # Array of action objects
    # Each step: {step: 1, action: "tap", x: 540, y: 960, screenshot: "base64..."}
    
    flow_metadata = Column(JSON, nullable=True)  # Additional metadata (renamed from 'metadata')
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "device_info": {
                "device_id": self.device_id,
                "name": self.device_name,
                "platform": self.device_platform,
                "os_version": self.device_os_version
            },
            "app_info": {
                "package": self.app_package,
                "name": self.app_name,
                "version": self.app_version
            },
            "steps": self.steps,
            "metadata": self.flow_metadata,  # Return as metadata for API
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
