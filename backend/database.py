# backend/database.py - مدیریت دیتابیس SQLite
import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import json


class DatabaseManager:
    """مدیریت دیتابیس SQLite برای سیستم مالیاتی"""
    
    def __init__(self, db_path: str = "tax_calculator.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """ایجاد اتصال به دیتابیس"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_database(self):
        """ایجاد جداول دیتابیس"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # جدول اطلاعات هویتی مودیان
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS taxpayers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                national_code TEXT UNIQUE NOT NULL,
                economic_code TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # جدول اطلاعات مالی سالانه
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS yearly_financial_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taxpayer_id INTEGER NOT NULL,
                year_label TEXT NOT NULL,
                year_order INTEGER NOT NULL,
                declared_sales REAL DEFAULT 0,
                finalized_sales REAL DEFAULT 0,
                declared_income REAL DEFAULT 0,
                finalized_income REAL DEFAULT 0,
                declared_profit REAL DEFAULT 0,
                finalized_profit REAL DEFAULT 0,
                conversion_factor REAL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (taxpayer_id) REFERENCES taxpayers(id) ON DELETE CASCADE,
                UNIQUE(taxpayer_id, year_order)
            )
        """)
        
        # جدول عملکرد مالیاتی
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tax_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taxpayer_id INTEGER NOT NULL,
                tax_file_history TEXT DEFAULT '11110',
                declaration_history TEXT DEFAULT '11100',
                on_time_payment TEXT DEFAULT '11010',
                workfolder_compliance TEXT DEFAULT '10101',
                electronic_invoice TEXT DEFAULT '11100',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (taxpayer_id) REFERENCES taxpayers(id) ON DELETE CASCADE,
                UNIQUE(taxpayer_id)
            )
        """)
        
        # جدول محاسبات مالیاتی
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tax_calculations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                taxpayer_id INTEGER NOT NULL,
                calculation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                loyalty_factor REAL NOT NULL,
                performance_score INTEGER NOT NULL,
                max_discount_percent REAL NOT NULL,
                actual_discount_percent REAL NOT NULL,
                base_tax_declared REAL NOT NULL,
                base_tax_finalized REAL NOT NULL,
                discount_amount_declared REAL NOT NULL,
                discount_amount_finalized REAL NOT NULL,
                final_tax_declared REAL NOT NULL,
                final_tax_finalized REAL NOT NULL,
                loyalty_status TEXT,
                adjusted_data TEXT,
                regression_data TEXT,
                FOREIGN KEY (taxpayer_id) REFERENCES taxpayers(id) ON DELETE CASCADE
            )
        """)
        
        # جدول تاریخچه تغییرات
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                old_data TEXT,
                new_data TEXT,
                changed_by TEXT,
                changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # ایجاد ایندکس‌ها برای بهبود عملکرد
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_taxpayers_national_code 
            ON taxpayers(national_code)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_yearly_data_taxpayer 
            ON yearly_financial_data(taxpayer_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_calculations_taxpayer 
            ON tax_calculations(taxpayer_id)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_calculations_date 
            ON tax_calculations(calculation_date)
        """)
        
        conn.commit()
        conn.close()
    
    # ==================== عملیات مودی ====================
    
    def create_taxpayer(self, full_name: str, national_code: str, 
                       economic_code: str = None) -> int:
        """ایجاد مودی جدید"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO taxpayers (full_name, national_code, economic_code)
                VALUES (?, ?, ?)
            """, (full_name, national_code, economic_code))
            
            taxpayer_id = cursor.lastrowid
            
            # ثبت در لاگ
            self._log_action(cursor, 'taxpayers', taxpayer_id, 'INSERT', 
                           None, {'full_name': full_name, 
                                  'national_code': national_code})
            
            conn.commit()
            return taxpayer_id
        except sqlite3.IntegrityError:
            # اگر مودی از قبل وجود دارد
            cursor.execute(
                "SELECT id FROM taxpayers WHERE national_code = ?",
                (national_code,)
            )
            result = cursor.fetchone()
            return result['id'] if result else None
        finally:
            conn.close()
    
    def get_taxpayer(self, taxpayer_id: int = None, 
                    national_code: str = None) -> Optional[Dict]:
        """دریافت اطلاعات مودی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if taxpayer_id:
            cursor.execute(
                "SELECT * FROM taxpayers WHERE id = ?", 
                (taxpayer_id,)
            )
        elif national_code:
            cursor.execute(
                "SELECT * FROM taxpayers WHERE national_code = ?",
                (national_code,)
            )
        else:
            conn.close()
            return None
        
        result = cursor.fetchone()
        conn.close()
        
        return dict(result) if result else None
    
    def update_taxpayer(self, taxpayer_id: int, full_name: str = None,
                       economic_code: str = None) -> bool:
        """به‌روزرسانی اطلاعات مودی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # دریافت داده‌های قبلی
        old_data = self.get_taxpayer(taxpayer_id)
        
        updates = []
        params = []
        
        if full_name:
            updates.append("full_name = ?")
            params.append(full_name)
        
        if economic_code:
            updates.append("economic_code = ?")
            params.append(economic_code)
        
        if not updates:
            conn.close()
            return False
        
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(taxpayer_id)
        
        query = f"UPDATE taxpayers SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        
        # ثبت در لاگ
        new_data = self.get_taxpayer(taxpayer_id)
        self._log_action(cursor, 'taxpayers', taxpayer_id, 'UPDATE',
                        old_data, new_data)
        
        conn.commit()
        conn.close()
        return True
    
    def delete_taxpayer(self, taxpayer_id: int) -> bool:
        """حذف مودی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        old_data = self.get_taxpayer(taxpayer_id)
        
        cursor.execute("DELETE FROM taxpayers WHERE id = ?", (taxpayer_id,))
        
        self._log_action(cursor, 'taxpayers', taxpayer_id, 'DELETE',
                        old_data, None)
        
        conn.commit()
        conn.close()
        return cursor.rowcount > 0
    
    # ==================== عملیات داده‌های مالی سالانه ====================
    
    def save_yearly_data(self, taxpayer_id: int, year_label: str,
                        year_order: int, data: Dict) -> int:
        """ذخیره اطلاعات مالی سالانه"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO yearly_financial_data 
            (taxpayer_id, year_label, year_order, declared_sales, 
             finalized_sales, declared_income, finalized_income,
             declared_profit, finalized_profit, conversion_factor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            taxpayer_id, year_label, year_order,
            data.get('declared_sales', 0),
            data.get('finalized_sales', 0),
            data.get('declared_income', 0),
            data.get('finalized_income', 0),
            data.get('declared_profit', 0),
            data.get('finalized_profit', 0),
            data.get('conversion_factor', 0)
        ))
        
        data_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return data_id
    
    def get_yearly_data(self, taxpayer_id: int) -> List[Dict]:
        """دریافت اطلاعات مالی سالانه مودی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM yearly_financial_data 
            WHERE taxpayer_id = ? 
            ORDER BY year_order
        """, (taxpayer_id,))
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
    
    # ==================== عملیات عملکرد مالیاتی ====================
    
    def save_tax_performance(self, taxpayer_id: int, 
                            performance_data: Dict) -> int:
        """ذخیره عملکرد مالیاتی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # تبدیل آرایه‌ها به رشته
        def array_to_string(arr):
            return ''.join(['1' if x else '0' for x in arr])
        
        cursor.execute("""
            INSERT OR REPLACE INTO tax_performance
            (taxpayer_id, tax_file_history, declaration_history,
             on_time_payment, workfolder_compliance, electronic_invoice)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            taxpayer_id,
            array_to_string(performance_data.get('tax_file_history', [])),
            array_to_string(performance_data.get('declaration_history', [])),
            array_to_string(performance_data.get('on_time_payment', [])),
            array_to_string(
                performance_data.get('workfolder_compliance', [])
            ),
            array_to_string(performance_data.get('electronic_invoice', []))
        ))
        
        perf_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return perf_id
    
    def get_tax_performance(self, taxpayer_id: int) -> Optional[Dict]:
        """دریافت عملکرد مالیاتی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM tax_performance WHERE taxpayer_id = ?
        """, (taxpayer_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return None
        
        # تبدیل رشته به آرایه
        def string_to_array(s):
            return [c == '1' for c in s]
        
        data = dict(result)
        return {
            'id': data['id'],
            'taxpayer_id': data['taxpayer_id'],
            'tax_file_history': string_to_array(
                data['tax_file_history']
            ),
            'declaration_history': string_to_array(
                data['declaration_history']
            ),
            'on_time_payment': string_to_array(data['on_time_payment']),
            'workfolder_compliance': string_to_array(
                data['workfolder_compliance']
            ),
            'electronic_invoice': string_to_array(
                data['electronic_invoice']
            )
        }
    
    # ==================== عملیات محاسبات مالیاتی ====================
    
    def save_calculation(self, taxpayer_id: int, 
                        calculation_data: Dict) -> int:
        """ذخیره محاسبات مالیاتی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO tax_calculations
            (taxpayer_id, loyalty_factor, performance_score,
             max_discount_percent, actual_discount_percent,
             base_tax_declared, base_tax_finalized,
             discount_amount_declared, discount_amount_finalized,
             final_tax_declared, final_tax_finalized,
             loyalty_status, adjusted_data, regression_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            taxpayer_id,
            calculation_data.get('loyalty_factor', 0),
            calculation_data.get('performance_score', 0),
            calculation_data.get('max_discount_percent', 0),
            calculation_data.get('actual_discount_percent', 0),
            calculation_data.get('base_tax_declared', 0),
            calculation_data.get('base_tax_finalized', 0),
            calculation_data.get('discount_amount_declared', 0),
            calculation_data.get('discount_amount_finalized', 0),
            calculation_data.get('final_tax_declared', 0),
            calculation_data.get('final_tax_finalized', 0),
            calculation_data.get('loyalty_status', ''),
            json.dumps(calculation_data.get('adjusted_year_data', {})),
            json.dumps(calculation_data.get('current_year_estimate', {}))
        ))
        
        calc_id = cursor.lastrowid
        conn.commit()
        conn.close()
        return calc_id
    
    def get_calculations(self, taxpayer_id: int = None,
                        limit: int = 100) -> List[Dict]:
        """دریافت محاسبات مالیاتی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        if taxpayer_id:
            cursor.execute("""
                SELECT c.*, t.full_name, t.national_code, t.economic_code
                FROM tax_calculations c
                JOIN taxpayers t ON c.taxpayer_id = t.id
                WHERE c.taxpayer_id = ?
                ORDER BY c.calculation_date DESC
                LIMIT ?
            """, (taxpayer_id, limit))
        else:
            cursor.execute("""
                SELECT c.*, t.full_name, t.national_code, t.economic_code
                FROM tax_calculations c
                JOIN taxpayers t ON c.taxpayer_id = t.id
                ORDER BY c.calculation_date DESC
                LIMIT ?
            """, (limit,))
        
        results = cursor.fetchall()
        conn.close()
        
        calculations = []
        for row in results:
            data = dict(row)
            # Parse JSON fields
            if data.get('adjusted_data'):
                data['adjusted_data'] = json.loads(data['adjusted_data'])
            if data.get('regression_data'):
                data['regression_data'] = json.loads(data['regression_data'])
            calculations.append(data)
        
        return calculations
    
    def get_calculation_by_id(self, calculation_id: int) -> Optional[Dict]:
        """دریافت یک محاسبه خاص"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT c.*, t.full_name, t.national_code, t.economic_code
            FROM tax_calculations c
            JOIN taxpayers t ON c.taxpayer_id = t.id
            WHERE c.id = ?
        """, (calculation_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return None
        
        data = dict(result)
        if data.get('adjusted_data'):
            data['adjusted_data'] = json.loads(data['adjusted_data'])
        if data.get('regression_data'):
            data['regression_data'] = json.loads(data['regression_data'])
        
        return data
    
    # ==================== گزارشات ====================
    
    def get_statistics(self) -> Dict:
        """دریافت آمار کلی"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # تعداد کل مودیان
        cursor.execute("SELECT COUNT(*) as count FROM taxpayers")
        total_taxpayers = cursor.fetchone()['count']
        
        # تعداد کل محاسبات
        cursor.execute("SELECT COUNT(*) as count FROM tax_calculations")
        total_calculations = cursor.fetchone()['count']
        
        # میانگین ضریب وفاداری
        cursor.execute("""
            SELECT AVG(loyalty_factor) as avg_loyalty 
            FROM tax_calculations
        """)
        avg_loyalty = cursor.fetchone()['avg_loyalty'] or 0
        
        # میانگین تخفیف
        cursor.execute("""
            SELECT AVG(actual_discount_percent) as avg_discount 
            FROM tax_calculations
        """)
        avg_discount = cursor.fetchone()['avg_discount'] or 0
        
        # مجموع مالیات نهایی
        cursor.execute("""
            SELECT SUM(final_tax_declared) as total_declared,
                   SUM(final_tax_finalized) as total_finalized
            FROM tax_calculations
        """)
        tax_totals = cursor.fetchone()
        
        conn.close()
        
        return {
            'total_taxpayers': total_taxpayers,
            'total_calculations': total_calculations,
            'average_loyalty_factor': round(avg_loyalty, 4),
            'average_discount_percent': round(avg_discount, 2),
            'total_tax_declared': tax_totals['total_declared'] or 0,
            'total_tax_finalized': tax_totals['total_finalized'] or 0
        }
    
    def search_taxpayers(self, query: str) -> List[Dict]:
        """جستجوی مودیان"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM taxpayers 
            WHERE full_name LIKE ? 
               OR national_code LIKE ? 
               OR economic_code LIKE ?
            ORDER BY full_name
            LIMIT 50
        """, (f'%{query}%', f'%{query}%', f'%{query}%'))
        
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
    
    # ==================== توابع کمکی ====================
    
    def _log_action(self, cursor, table_name: str, record_id: int,
                   action: str, old_data: Dict = None, 
                   new_data: Dict = None):
        """ثبت تغییرات در لاگ"""
        cursor.execute("""
            INSERT INTO audit_log 
            (table_name, record_id, action, old_data, new_data)
            VALUES (?, ?, ?, ?, ?)
        """, (
            table_name,
            record_id,
            action,
            json.dumps(old_data) if old_data else None,
            json.dumps(new_data) if new_data else None
        ))
    
    def get_audit_log(self, table_name: str = None, 
                     record_id: int = None, limit: int = 100) -> List[Dict]:
        """دریافت لاگ تغییرات"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = "SELECT * FROM audit_log WHERE 1=1"
        params = []
        
        if table_name:
            query += " AND table_name = ?"
            params.append(table_name)
        
        if record_id:
            query += " AND record_id = ?"
            params.append(record_id)
        
        query += " ORDER BY changed_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        results = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in results]
    
    def backup_database(self, backup_path: str):
        """پشتیبان‌گیری از دیتابیس"""
        import shutil
        shutil.copy2(self.db_path, backup_path)
        return True
    
    def export_to_csv(self, table_name: str, output_path: str) -> bool:
        """خروجی CSV از جدول"""
        import csv
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return False
        
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            # نوشتن هدرها
            writer.writerow(rows[0].keys())
            # نوشتن داده‌ها
            for row in rows:
                writer.writerow(row)
        
        conn.close()
        return True
