from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List
import sys
import os

# FIX: مسیر backend
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from calculator import TaxCalculator, Activity, ProfitLossStatement
from models import DeclarationRequest

app = FastAPI(title="ماشین حساب اظهارنامه")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "working"}

@app.post("/api/v1/calculate")
async def calculate_declaration(request: DeclarationRequest):
    """محاسبه اظهارنامه - FIXED"""
    print(f"📥 دریافت درخواست: {request.taxpayer_name}")
    print(f"📊 profit_loss: {request.profit_loss}")
    
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
    print(f"💰 goods_sales: {calc.pl_statement.goods_sales}")
    print(f"💰 admin_expenses: {calc.pl_statement.admin_expenses}")
    
    # تولید گزارش
    report = calc.generate_complete_report()
    
    print(f"📈 گزارش تولید شد: {report['profit_loss_statement']}")
    
    return {
        "status": "success",
        "data": report
    }
