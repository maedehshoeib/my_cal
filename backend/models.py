# backend/models.py
from pydantic import BaseModel
from typing import List, Optional

class ActivityInput(BaseModel):
    """مدل ورودی برای فعالیت"""
    code: str
    name: str
    activity_type: str = "goods"
    activity_percentage: float
    non_specialized_percentage: float = 0
    sales: int

class ProfitLossInput(BaseModel):
    """مدل ورودی برای صورت سود و زیان"""
    goods_sales: int = 0
    service_sales: int = 0
    goods_cogs: int = 0
    service_cogs: int = 0
    admin_expenses: int = 0

class DeclarationRequest(BaseModel):
    """درخواست محاسبه اظهارنامه"""
    taxpayer_name: str
    taxpayer_id: str
    activities: List[ActivityInput]
    profit_loss: ProfitLossInput
    other_deductions: int = 0
    previous_year_income: int = 0

class DeclarationResponse(BaseModel):
    """پاسخ محاسبه اظهارنامه"""
    status: str
    data: dict
    timestamp: str
