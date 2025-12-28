# backend/api.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from calculator import TaxCalculator, Activity, ProfitLossStatement
from models import DeclarationRequest, DeclarationResponse

# ایجاد FastAPI app
app = FastAPI(
    title="سامانه محاسبه اظهارنامه مالیاتی",
    description="API برای محاسبه خودکار اظهارنامه مالیات ایران",
    version="1.0.0"
)

# تنظیمات CORS - اجازه درخواست‌های Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "working",
        "message": "سامانه محاسبه اظهارنامه آماده است"
    }

@app.post("/api/v1/calculate")
async def calculate_declaration(request: DeclarationRequest):
    """محاسبه اظهارنامه کامل
    
    Parameters:
    - taxpayer_name: نام مودی
    - taxpayer_id: شناسه ملی/اقتصادی
    - activities: لیست فعالیت‌ها
    - profit_loss: صورت سود و زیان
    - other_deductions: کسورات دیگر
    - previous_year_income: درآمد سال قبل (اختیاری)
    
    Returns:
    - گزارش کامل محاسبه با سه سناریو
    """
    try:
        # ایجاد calculator
        calc = TaxCalculator()
        
        # اضافه کردن فعالیت‌ها
        for act in request.activities:
            activity = Activity(
                code=act.code,
                name=act.name,
                activity_type=act.activity_type,
                activity_percentage=act.activity_percentage,
                non_specialized_percentage=act.non_specialized_percentage,
                sales=act.sales
            )
            calc.add_activity(activity)
        
        # تنظیم صورت سود و زیان
        pl = ProfitLossStatement(
            goods_sales=request.profit_loss.goods_sales,
            service_sales=request.profit_loss.service_sales,
            goods_cogs=request.profit_loss.goods_cogs,
            service_cogs=request.profit_loss.service_cogs,
            admin_expenses=request.profit_loss.admin_expenses
        )
        calc.set_profit_loss(pl)
        
        # تنظیمات اضافی
        calc.other_deductions = request.other_deductions
        calc.previous_year_income = request.previous_year_income
        
        # تولید گزارش
        report = calc.generate_complete_report()
        
        return {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "taxpayer": {
                "name": request.taxpayer_name,
                "id": request.taxpayer_id
            },
            "data": report
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"خطا در محاسبه: {str(e)}"
        )

@app.get("/api/v1/tax-regulations")
async def get_tax_regulations():
    """دریافت مقررات مالیاتی فعلی"""
    return {
        "year": 1404,
        "tax_brackets": [
            {
                "min": 0,
                "max": 50_000_000,
                "rate": 0.15,
                "rate_percent": "15%"
            },
            {
                "min": 50_000_000,
                "max": 100_000_000,
                "rate": 0.20,
                "rate_percent": "20%"
            },
            {
                "min": 100_000_000,
                "max": float('inf'),
                "rate": 0.25,
                "rate_percent": "25%"
            }
        ],
        "article_101_ceiling": 2_000_000_000,
        "article_101_ceiling_display": "2 میلیارد ریال"
    }

@app.post("/api/v1/validate-data")
async def validate_input_data(request: DeclarationRequest):
    """اعتبارسنجی داده‌های ورودی قبل از محاسبه"""
    errors = []
    
    # بررسی نام
    if not request.taxpayer_name or len(request.taxpayer_name.strip()) == 0:
        errors.append("نام مودی الزامی است")
    
    # بررسی شناسه
    if not request.taxpayer_id or len(request.taxpayer_id.strip()) == 0:
        errors.append("شناسه ملی/اقتصادی الزامی است")
    
    # بررسی فعالیت‌ها
    if not request.activities or len(request.activities) == 0:
        errors.append("حداقل یک فعالیت ضروری است")
    
    # بررسی اعداد
    if request.profit_loss.goods_sales < 0:
        errors.append("فروش کالا نمی‌تواند منفی باشد")
    
    if request.profit_loss.admin_expenses < 0:
        errors.append("هزینه‌های اداری نمی‌تواند منفی باشد")
    
    if errors:
        raise HTTPException(status_code=422, detail=errors)
    
    return {"status": "valid", "message": "داده‌های ورودی معتبر هستند"}
