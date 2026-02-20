"""
Database models for tax calculation system
"""
from sqlalchemy import Column, Integer, String, DateTime, Float, Text, Boolean
from sqlalchemy.sql import func
from database import Base


class TaxCalculationHistory(Base):
    """Store tax calculation history"""
    __tablename__ = "tax_calculations"
    
    id = Column(Integer, primary_key=True, index=True)
    taxpayer_name = Column(String(255), nullable=False)
    
    # Profit & Loss Data
    goods_sales = Column(Float, default=0)
    service_sales = Column(Float, default=0)
    goods_cogs = Column(Float, default=0)
    service_cogs = Column(Float, default=0)
    admin_expenses = Column(Float, default=0)
    
    # Additional Data
    other_deductions = Column(Float, default=0)
    previous_year_income = Column(Float, default=0)
    
    # Calculation Results (stored as JSON text)
    calculation_result = Column(Text)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Optional: User identification
    user_ip = Column(String(45))  # Support IPv6
    is_deleted = Column(Boolean, default=False)


class SystemSettings(Base):
    """Store system configuration"""
    __tablename__ = "system_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuditLog(Base):
    """Audit log for tracking system access"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(100), nullable=False)
    user_ip = Column(String(45))
    user_agent = Column(Text)
    request_data = Column(Text)
    response_status = Column(Integer)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())