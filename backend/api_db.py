# backend/api_db.py - API endpoints برای دیتابیس
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from backend.database import DatabaseManager

router = APIRouter(prefix="/api/db", tags=["database"])
db = DatabaseManager()


# ==================== Models ====================

class TaxpayerCreate(BaseModel):
    full_name: str
    national_code: str
    economic_code: Optional[str] = None


class TaxpayerUpdate(BaseModel):
    full_name: Optional[str] = None
    economic_code: Optional[str] = None


class YearlyFinancialData(BaseModel):
    year_label: str
    year_order: int
    declared_sales: float = 0
    finalized_sales: float = 0
    declared_income: float = 0
    finalized_income: float = 0
    declared_profit: float = 0
    finalized_profit: float = 0
    conversion_factor: float = 0


class TaxPerformance(BaseModel):
    tax_file_history: List[bool]
    declaration_history: List[bool]
    on_time_payment: List[bool]
    workfolder_compliance: List[bool]
    electronic_invoice: List[bool]


class TaxCalculation(BaseModel):
    loyalty_factor: float
    performance_score: int
    max_discount_percent: float
    actual_discount_percent: float
    base_tax_declared: float
    base_tax_finalized: float
    discount_amount_declared: float
    discount_amount_finalized: float
    final_tax_declared: float
    final_tax_finalized: float
    loyalty_status: str
    adjusted_year_data: Optional[Dict[str, Any]] = None
    current_year_estimate: Optional[Dict[str, Any]] = None


# ==================== Taxpayer Endpoints ====================

@router.post("/taxpayers", response_model=Dict)
async def create_taxpayer(taxpayer: TaxpayerCreate):
    """ایجاد مودی جدید"""
    try:
        taxpayer_id = db.create_taxpayer(
            full_name=taxpayer.full_name,
            national_code=taxpayer.national_code,
            economic_code=taxpayer.economic_code
        )
        
        if not taxpayer_id:
            raise HTTPException(
                status_code=400,
                detail="مودی با این کد ملی از قبل وجود دارد"
            )
        
        return {
            "success": True,
            "taxpayer_id": taxpayer_id,
            "message": "مودی با موفقیت ایجاد شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/taxpayers/{taxpayer_id}")
async def get_taxpayer(taxpayer_id: int):
    """دریافت اطلاعات مودی"""
    taxpayer = db.get_taxpayer(taxpayer_id=taxpayer_id)
    
    if not taxpayer:
        raise HTTPException(status_code=404, detail="مودی یافت نشد")
    
    return taxpayer


@router.get("/taxpayers/by-national-code/{national_code}")
async def get_taxpayer_by_national_code(national_code: str):
    """دریافت اطلاعات مودی با کد ملی"""
    taxpayer = db.get_taxpayer(national_code=national_code)
    
    if not taxpayer:
        raise HTTPException(status_code=404, detail="مودی یافت نشد")
    
    return taxpayer


@router.put("/taxpayers/{taxpayer_id}")
async def update_taxpayer(taxpayer_id: int, taxpayer: TaxpayerUpdate):
    """به‌روزرسانی اطلاعات مودی"""
    success = db.update_taxpayer(
        taxpayer_id=taxpayer_id,
        full_name=taxpayer.full_name,
        economic_code=taxpayer.economic_code
    )
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="مودی یافت نشد یا داده‌ای برای به‌روزرسانی وجود ندارد"
        )
    
    return {
        "success": True,
        "message": "اطلاعات مودی به‌روزرسانی شد"
    }


@router.delete("/taxpayers/{taxpayer_id}")
async def delete_taxpayer(taxpayer_id: int):
    """حذف مودی"""
    success = db.delete_taxpayer(taxpayer_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="مودی یافت نشد")
    
    return {
        "success": True,
        "message": "مودی با موفقیت حذف شد"
    }


@router.get("/taxpayers/search/{query}")
async def search_taxpayers(query: str):
    """جستجوی مودیان"""
    results = db.search_taxpayers(query)
    
    return {
        "count": len(results),
        "results": results
    }


# ==================== Yearly Financial Data Endpoints ====================

@router.post("/taxpayers/{taxpayer_id}/yearly-data")
async def save_yearly_data(
    taxpayer_id: int,
    data: YearlyFinancialData
):
    """ذخیره اطلاعات مالی سالانه"""
    try:
        data_id = db.save_yearly_data(
            taxpayer_id=taxpayer_id,
            year_label=data.year_label,
            year_order=data.year_order,
            data=data.dict()
        )
        
        return {
            "success": True,
            "data_id": data_id,
            "message": "اطلاعات مالی ذخیره شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/taxpayers/{taxpayer_id}/yearly-data")
async def get_yearly_data(taxpayer_id: int):
    """دریافت اطلاعات مالی سالانه"""
    data = db.get_yearly_data(taxpayer_id)
    
    return {
        "count": len(data),
        "data": data
    }


# ==================== Tax Performance Endpoints ====================

@router.post("/taxpayers/{taxpayer_id}/performance")
async def save_tax_performance(
    taxpayer_id: int,
    performance: TaxPerformance
):
    """ذخیره عملکرد مالیاتی"""
    try:
        perf_id = db.save_tax_performance(
            taxpayer_id=taxpayer_id,
            performance_data=performance.dict()
        )
        
        return {
            "success": True,
            "performance_id": perf_id,
            "message": "عملکرد مالیاتی ذخیره شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/taxpayers/{taxpayer_id}/performance")
async def get_tax_performance(taxpayer_id: int):
    """دریافت عملکرد مالیاتی"""
    performance = db.get_tax_performance(taxpayer_id)
    
    if not performance:
        raise HTTPException(
            status_code=404,
            detail="عملکرد مالیاتی یافت نشد"
        )
    
    return performance


# ==================== Tax Calculation Endpoints ====================

@router.post("/taxpayers/{taxpayer_id}/calculations")
async def save_calculation(
    taxpayer_id: int,
    calculation: TaxCalculation
):
    """ذخیره محاسبات مالیاتی"""
    try:
        calc_id = db.save_calculation(
            taxpayer_id=taxpayer_id,
            calculation_data=calculation.dict()
        )
        
        return {
            "success": True,
            "calculation_id": calc_id,
            "message": "محاسبات مالیاتی ذخیره شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/taxpayers/{taxpayer_id}/calculations")
async def get_calculations(
    taxpayer_id: int,
    limit: int = Query(default=100, ge=1, le=1000)
):
    """دریافت محاسبات مالیاتی مودی"""
    calculations = db.get_calculations(
        taxpayer_id=taxpayer_id,
        limit=limit
    )
    
    return {
        "count": len(calculations),
        "calculations": calculations
    }


@router.get("/calculations/{calculation_id}")
async def get_calculation_by_id(calculation_id: int):
    """دریافت یک محاسبه خاص"""
    calculation = db.get_calculation_by_id(calculation_id)
    
    if not calculation:
        raise HTTPException(status_code=404, detail="محاسبه یافت نشد")
    
    return calculation


@router.get("/calculations")
async def get_all_calculations(
    limit: int = Query(default=100, ge=1, le=1000)
):
    """دریافت همه محاسبات"""
    calculations = db.get_calculations(limit=limit)
    
    return {
        "count": len(calculations),
        "calculations": calculations
    }


# ==================== Statistics & Reports ====================

@router.get("/statistics")
async def get_statistics():
    """دریافت آمار کلی"""
    stats = db.get_statistics()
    return stats


@router.get("/audit-log")
async def get_audit_log(
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    limit: int = Query(default=100, ge=1, le=1000)
):
    """دریافت لاگ تغییرات"""
    logs = db.get_audit_log(
        table_name=table_name,
        record_id=record_id,
        limit=limit
    )
    
    return {
        "count": len(logs),
        "logs": logs
    }


# ==================== Backup & Export ====================

@router.post("/backup")
async def backup_database(backup_path: str = "backup.db"):
    """پشتیبان‌گیری از دیتابیس"""
    try:
        success = db.backup_database(backup_path)
        return {
            "success": success,
            "message": f"پشتیبان در {backup_path} ذخیره شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export/{table_name}")
async def export_table_to_csv(
    table_name: str,
    output_path: str = "export.csv"
):
    """خروجی CSV از جدول"""
    try:
        success = db.export_to_csv(table_name, output_path)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="جدول خالی است یا یافت نشد"
            )
        
        return {
            "success": True,
            "message": f"خروجی در {output_path} ذخیره شد"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Complete Workflow ====================

@router.post("/complete-submission")
async def complete_submission(
    taxpayer: TaxpayerCreate,
    yearly_data: List[YearlyFinancialData],
    performance: TaxPerformance,
    calculation: TaxCalculation
):
    """ثبت کامل یک مودی با تمام اطلاعات"""
    try:
        # 1. ایجاد یا دریافت مودی
        taxpayer_id = db.create_taxpayer(
            full_name=taxpayer.full_name,
            national_code=taxpayer.national_code,
            economic_code=taxpayer.economic_code
        )
        
        if not taxpayer_id:
            # مودی از قبل وجود دارد
            existing = db.get_taxpayer(
                national_code=taxpayer.national_code
            )
            taxpayer_id = existing['id']
        
        # 2. ذخیره اطلاعات مالی سالانه
        for year_data in yearly_data:
            db.save_yearly_data(
                taxpayer_id=taxpayer_id,
                year_label=year_data.year_label,
                year_order=year_data.year_order,
                data=year_data.dict()
            )
        
        # 3. ذخیره عملکرد مالیاتی
        db.save_tax_performance(
            taxpayer_id=taxpayer_id,
            performance_data=performance.dict()
        )
        
        # 4. ذخیره محاسبات
        calc_id = db.save_calculation(
            taxpayer_id=taxpayer_id,
            calculation_data=calculation.dict()
        )
        
        return {
            "success": True,
            "taxpayer_id": taxpayer_id,
            "calculation_id": calc_id,
            "message": "تمام اطلاعات با موفقیت ثبت شد"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
