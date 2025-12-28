# backend/calculator.py
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class ActivityType(Enum):
    """انواع فعالیت"""
    GOODS = "goods"              # فروش کالا
    SERVICES = "services"        # خدمات
    INDUSTRIAL = "industrial"    # صنعتی
    AGRICULTURAL = "agricultural" # کشاورزی

@dataclass
class Activity:
    """نمایندگی یک فعالیت"""
    code: str
    name: str
    activity_type: str
    activity_percentage: float
    non_specialized_percentage: float
    sales: int

@dataclass
class ProfitLossStatement:
    """صورت سود و زیان"""
    goods_sales: int = 0
    service_sales: int = 0
    goods_cogs: int = 0          # Cost of Goods Sold
    service_cogs: int = 0
    admin_expenses: int = 0

class TaxCalculator:
    """ماشین حساب مالیات اظهارنامه"""
    
    # نرخ‌های مالیاتی (قانون ماده 131)
    TAX_BRACKETS = [
        {"min": 0, "max": 50_000_000, "rate": 0.15},
        {"min": 50_000_000, "max": 100_000_000, "rate": 0.20},
        {"min": 100_000_000, "max": float('inf'), "rate": 0.25}
    ]
    
    # سقف ماده 101 (معافیت برای کارگاهها)
    ARTICLE_101_CEILING_1404 = 2_000_000_000
    
    def __init__(self):
        self.activities: List[Activity] = []
        self.pl_statement = ProfitLossStatement()
        self.other_deductions = 0
        self.previous_year_income = 0
    
    def add_activity(self, activity: Activity) -> None:
        """اضافه کردن فعالیت"""
        self.activities.append(activity)
    
    def set_profit_loss(self, pl: ProfitLossStatement) -> None:
        """تنظیم صورت سود و زیان"""
        self.pl_statement = pl
    
    def calculate_gross_profit(self) -> int:
        """محاسبه سود ناخالص
        
        فرمول:
        سود ناخالص = (فروش کالا - بهای تمام شده کالا) + 
                      (فروش خدمات - بهای تمام شده خدمات)
        """
        goods_profit = self.pl_statement.goods_sales - self.pl_statement.goods_cogs
        service_profit = self.pl_statement.service_sales - self.pl_statement.service_cogs
        
        return max(0, goods_profit + service_profit)
    
    def calculate_net_profit(self) -> int:
        """محاسبه سود خالص
        
        فرمول:
        سود خالص = سود ناخالص - هزینه‌های اداری عمومی
        """
        gross_profit = self.calculate_gross_profit()
        net_profit = gross_profit - self.pl_statement.admin_expenses
        
        return max(0, net_profit)
    
    def calculate_taxable_income(self) -> Dict:
        """محاسبه درآمد مشمول مالیات
        
        فرمول:
        درآمد مشمول = سود خالص - معافیت ماده 101 - کسورات دیگر
        """
        net_profit = self.calculate_net_profit()
        
        # محاسبه معافیت ماده 101
        article_101_deduction = min(net_profit, self.ARTICLE_101_CEILING_1404)
        
        # درآمد مشمول مالیات
        taxable_income = net_profit - article_101_deduction - self.other_deductions
        
        return {
            "net_profit": net_profit,
            "article_101_ceiling": self.ARTICLE_101_CEILING_1404,
            "article_101_deduction": article_101_deduction,
            "other_deductions": self.other_deductions,
            "taxable_income": max(0, taxable_income)
        }
    
    def _calculate_progressive_tax(self, income: int) -> Dict:
        """محاسبه مالیات پلکانی
        
        فرمول:
        - تا 50 میلیون: 15%
        - 50 تا 100 میلیون: 20%
        - بالاتر از 100 میلیون: 25%
        """
        total_tax = 0
        breakdown = []
        
        for bracket in self.TAX_BRACKETS:
            if income <= bracket["min"]:
                continue
            
            # محاسبه درآمد در این سطح
            upper_limit = bracket["max"]
            income_in_bracket = min(income, upper_limit) - bracket["min"]
            
            if income_in_bracket > 0:
                tax_in_bracket = int(income_in_bracket * bracket["rate"])
                total_tax += tax_in_bracket
                
                breakdown.append({
                    "range_min": bracket["min"],
                    "range_max": bracket["max"],
                    "income_in_bracket": income_in_bracket,
                    "rate": bracket["rate"],
                    "rate_percent": f"{bracket['rate'] * 100:.0f}%",
                    "tax": tax_in_bracket
                })
        
        return {
            "total_tax": total_tax,
            "breakdown": breakdown
        }
    
    def calculate_intack_based_tax(self, taxable_income: int) -> Dict:
        """سناریو 1: محاسبه بر اساس نسبت سود فعالیت"""
        
        tax_result = self._calculate_progressive_tax(taxable_income)
        
        return {
            "method": "بر اساس نسبت سود فعالیت (Intack)",
            "taxable_income": taxable_income,
            "base_tax": tax_result["total_tax"],
            "reduction_rate": 0,
            "reduction_amount": 0,
            "final_tax": tax_result["total_tax"],
            "breakdown": tax_result["breakdown"]
        }
    
    def calculate_auditor_ideal_tax(self, taxable_income: int) -> Dict:
        """سناریو 2: ایده‌ال ممیز
        
        ممیز مالیاتی ممکن است درآمد را 10% بالاتر برآورد کند
        """
        # افزایش فرضی برای محاسبه
        adjusted_income = int(taxable_income * 1.1)
        
        tax_result = self._calculate_progressive_tax(adjusted_income)
        
        return {
            "method": "ایده‌ال ممیز",
            "original_income": taxable_income,
            "adjusted_income": adjusted_income,
            "adjustment_percent": 10,
            "base_tax": tax_result["total_tax"],
            "final_tax": tax_result["total_tax"],
            "breakdown": tax_result["breakdown"]
        }
    
    def calculate_declaration_proposal_tax(self, taxable_income: int) -> Dict:
        """سناریو 3: پیشنهاد ابرازی (بهترین گزینه قانونی)
        
        تخفیف‌های اضافی:
        - اگر درآمد < 2 میلیارد: 5% تخفیف
        - اگر درآمد > سال قبل: 2% تخفیف اضافی
        """
        base_tax_result = self._calculate_progressive_tax(taxable_income)
        base_tax = base_tax_result["total_tax"]
        
        # محاسبه تخفیف
        reduction_rate = 0
        
        # تخفیف برای کارگاهها و صنایع کوچک
        if taxable_income < 2_000_000_000:
            reduction_rate = 0.05  # 5%
        
        # تخفیف اضافی برای رشد درآمد
        if self.previous_year_income > 0:
            income_growth = (taxable_income - self.previous_year_income) / self.previous_year_income
            if income_growth > 0.1:  # 10% رشد
                reduction_rate += 0.02  # 2% اضافی
        
        # حداکثر 5% تخفیف
        reduction_rate = min(reduction_rate, 0.05)
        
        reduction_amount = int(base_tax * reduction_rate)
        final_tax = base_tax - reduction_amount
        
        return {
            "method": "پیشنهاد ابرازی",
            "taxable_income": taxable_income,
            "base_tax": base_tax,
            "reduction_rate": reduction_rate,
            "reduction_rate_percent": f"{reduction_rate * 100:.1f}%",
            "reduction_amount": reduction_amount,
            "final_tax": final_tax,
            "breakdown": base_tax_result["breakdown"]
        }
    
    def generate_complete_report(self) -> Dict:
        """تولید گزارش کامل مشابه zamani.tax"""
        
        # محاسبات کلی
        gross_profit = self.calculate_gross_profit()
        net_profit = self.calculate_net_profit()
        taxable_info = self.calculate_taxable_income()
        taxable_income = taxable_info["taxable_income"]
        
        # سه سناریو مالیاتی
        intack_scenario = self.calculate_intack_based_tax(taxable_income)
        auditor_scenario = self.calculate_auditor_ideal_tax(taxable_income)
        proposal_scenario = self.calculate_declaration_proposal_tax(taxable_income)
        
        return {
            "activities": [
                {
                    "code": a.code,
                    "name": a.name,
                    "activity_type": a.activity_type,
                    "activity_percentage": a.activity_percentage,
                    "non_specialized_percentage": a.non_specialized_percentage,
                    "sales": a.sales
                }
                for a in self.activities
            ],
            "profit_loss_statement": {
                "goods_sales": self.pl_statement.goods_sales,
                "service_sales": self.pl_statement.service_sales,
                "goods_cogs": self.pl_statement.goods_cogs,
                "service_cogs": self.pl_statement.service_cogs,
                "gross_profit": gross_profit,
                "admin_expenses": self.pl_statement.admin_expenses,
                "net_profit": net_profit
            },
            "deductions_and_exemptions": taxable_info,
            "tax_scenarios": {
                "intack_based": intack_scenario,
                "auditor_ideal": auditor_scenario,
                "declaration_proposal": proposal_scenario
            }
        }
