from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FIX: مسیر backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from calculator import TaxCalculator, ProfitLossStatement
from models import DeclarationRequest
from database import check_db_health, init_db

app = FastAPI(
    title="ماشین حساب اظهارنامه",
    version="1.0.0",
    description="Production-ready Tax Calculator API"
)

# CORS configuration for production
allowed_origins_str = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost"
)
allowed_origins = allowed_origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")


@app.get("/")
async def root():
    return {"status": "working", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    db_healthy = check_db_health()
    
    return {
        "status": "ok" if db_healthy else "degraded",
        "timestamp": datetime.now().isoformat(),
        "database": "healthy" if db_healthy else "unhealthy",
        "version": "1.0.0"
    }


@app.post("/api/v1/calculate")
async def calculate_declaration(request: DeclarationRequest):
    """محاسبه اظهارنامه - FIXED"""
    logger.info(f"📥 دریافت درخواست: {request.taxpayer_name}")
    logger.info(f"📊 profit_loss: {request.profit_loss}")
    
    try:
        # ایجاد TaxCalculator
        calc = TaxCalculator()
        
        # **FIX 1: تنظیم profit_loss**
        calc.pl_statement = ProfitLossStatement(
            goods_sales=request.profit_loss.goods_sales,
            service_sales=request.profit_loss.service_sales,
            goods_cogs=request.profit_loss.goods_cogs,
            service_cogs=request.profit_loss.service_cogs,
            admin_expenses=request.profit_loss.admin_expenses
        )
        
        # **FIX 2: تنظیم کسورات**
        calc.other_deductions = request.other_deductions
        calc.previous_year_income = request.previous_year_income
        
        # **DEBUG: چاپ مقادیر**
        logger.info(f"💰 goods_sales: {calc.pl_statement.goods_sales}")
        logger.info(f"💰 admin_expenses: {calc.pl_statement.admin_expenses}")
        
        # تولید گزارش
        report = calc.generate_complete_report()
        
        logger.info("📈 گزارش تولید شد با موفقیت")
        
        return {
            "status": "success",
            "data": report
        }
    
    except Exception as e:
        logger.error(f"خطا در محاسبه: {str(e)}")
        raise HTTPException(status_code=500, detail=f"خطا در محاسبه: {str(e)}")
