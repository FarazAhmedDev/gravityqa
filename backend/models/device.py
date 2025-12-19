from sqlalchemy import Column, Integer, String, DateTime, Boolean, JSON
from datetime import datetime
from database import Base

class Device(Base):
    __tablename__ = "devices"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, nullable=False)  # ADB serial or iOS UDID
    name = Column(String, nullable=False)
    platform = Column(String, nullable=False)  # android, ios
    platform_version = Column(String, nullable=True)
    device_type = Column(String, nullable=False)  # emulator, simulator, real
    manufacturer = Column(String, nullable=True)
    model = Column(String, nullable=True)
    is_connected = Column(Boolean, default=False)
    capabilities = Column(JSON, nullable=True)
    last_seen_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
