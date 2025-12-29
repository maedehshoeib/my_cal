# backend/calculator.py - نسخه کامل و کارآمد
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Activity:
    code: str
    name: str
    activity_type: str
    activity_percentage: float
    non_specialized_percentage: float
    sales: int

@dataclass
class ProfitLossStatement:
    goods_sales: int = 0
    service_sales: int = 0
    goods_cogs: int = 0
    service_cogs: int = 0
    admin_expenses: int = 0

class TaxCalculator:
    # نرخ‌های مالیاتی 1404
    TAX_BRACKETS = [
        (0, 50_000_000, 0.15),
        (50_000_000, 100_000_000, 0.20),
        (100_000_000, float('inf'), 0.25)
    ]
    
    ARTICLE_101_CEILING = 2_000_000_000  # 2 میلیارد
    
    def __init__(self):
        self.activities: List[Activity] = []
        self.pl_statement = ProfitLossStatement()
        self.other_deductions = 0
        self.previous_year_income = 0
    
    def add_activity(self, activity: Activity):
        self.activities.append(activity)
    
    def set_profit_loss(self, pl: ProfitLossStatement):
        self.pl_statement = pl
    
    def calculate_gross_profit(self) -> int:
        """سود ناخالص = فروش - بهای تمام شده"""
        goods_profit = self.pl_statement.goods_sales - self.pl_statement.goods_cogs
        service_profit = self.pl_statement.service_sales - self.pl_statement.service_cogs
        return max(0, goods_profit + service_profit)
    
    def calculate_net_profit(self) -> int:
        """سود خالص = سود ناخالص - هزینه‌های اداری"""
        gross_profit = self.calculate_gross_profit()
        net_profit = gross_profit - self.pl_statement.admin_expenses
        return max(0, net_profit)
    
    def _calculate_progressive_tax(self, income: int) -> int:
        """محاسبه مالیات پلکانی"""
        tax = 0
        remaining = income
        
        for min_income, max_income, rate in self.TAX_BRACKETS:
            if remaining <= 0:
                break
            
            bracket_size = max_income - min_income if max_income != float('inf') else remaining
            taxable_in_bracket = min(remaining, bracket_size)
            tax += int(taxable_in_bracket * rate)
            remaining -= taxable_in_bracket
        
        return tax
    
    def calculate_taxable_income(self) -> Dict:
        """درآمد مشمول مالیات"""
        net_profit = self.calculate_net_profit()
        
        # معافیت ماده 101
        article_101_deduction = min(net_profit, self.ARTICLE_101_CEILING)
        taxable_income = net_profit - article_101_deduction - self.other_deductions
        
        return {
            "net_profit": net_profit,
            "article_101_deduction": article_101_deduction,
            "other_deductions": self.other_deductions,
            "taxable_income": max(0, taxable_income)
        }
    
    def generate_complete_report(self) -> Dict:
        """گزارش کامل - مثل zamani.tax"""
        gross_profit = self.calculate_gross_profit()
        net_profit = self.calculate_net_profit()
        taxable_info = self.calculate_taxable_income()
        taxable_income = taxable_info["taxable_income"]
        
        # سه سناریو محاسبه
        scenarios = {
            "intack_based": self._create_scenario(taxable_income, "بر اساس نسبت سود فعالیت"),
            "auditor_ideal": self._create_scenario(int(taxable_income * 1.1), "ایده‌ال ممیز"),
            "declaration_proposal": self._create_scenario_with_discount(taxable_income, "پیشنهاد ابرازی")
        }
        
        return {
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
            "tax_scenarios": scenarios
        }
    
    def _create_scenario(self, income: int, method: str) -> Dict:
        """سناریو عادی"""
        tax = self._calculate_progressive_tax(income)
        return {
            "method": method,
            "taxable_income": income,
            "final_tax": tax
        }
    
    def _create_scenario_with_discount(self, income: int, method: str) -> Dict:
        """سناریو با تخفیف"""
        base_tax = self._calculate_progressive_tax(income)
        discount = min(0.05, income / 1_000_000_000 * 0.01)  # 1% به ازای هر میلیارد
        final_tax = int(base_tax * (1 - discount))
        
        return {
            "method": method,
            "taxable_income": income,
            "base_tax": base_tax,
            "discount_rate": f"{discount*100:.1f}%",
            "final_tax": final_tax
        }
