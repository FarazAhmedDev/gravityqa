from sqlalchemy import Column, Integer, String, Text, ForeignKey, JSON
from database import Base

class Environment(Base):
    __tablename__ = "environments"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)  # dev, staging, production
    base_url = Column(String, nullable=True)
    variables = Column(JSON, nullable=True)  # Environment variables
    secrets = Column(Text, nullable=True)  # Encrypted secrets
