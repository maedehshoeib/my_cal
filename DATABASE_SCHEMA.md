# 🗄️ ساختار دیتابیس - سیستم مالیات علی‌الحساب

## 📋 فهرست مطالب
- [معرفی](#معرفی)
- [نمودار روابط](#نمودار-روابط)
- [جداول دیتابیس](#جداول-دیتابیس)
- [ایندکس‌ها](#ایندکسها)
- [نکات مهم](#نکات-مهم)

---

## 📌 معرفی

این دیتابیس SQLite برای ذخیره‌سازی و مدیریت اطلاعات مالیاتی مودیان طراحی شده است و شامل 5 جدول اصلی می‌باشد.

**ویژگی‌های کلیدی:**
- ✅ ذخیره اطلاعات هویتی مودیان
- ✅ ثبت اطلاعات مالی 3 سال گذشته
- ✅ پیگیری عملکرد مالیاتی 5 سال اخیر
- ✅ محاسبات مالیاتی با ضریب وفاداری
- ✅ لاگ کامل تغییرات
- ✅ روابط یکپارچه با CASCADE DELETE
- ✅ ایندکس‌گذاری برای جستجوی سریع

---

## 🔗 نمودار روابط (ER Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                         taxpayers                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 🔑 id (PK)                                               │   │
│  │ 👤 full_name                                             │   │
│  │ 🆔 national_code (UNIQUE)                                │   │
│  │ 💼 economic_code                                         │   │
│  │ 📅 created_at                                            │   │
│  │ 📅 updated_at                                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────┬────────────────┬────────────────┬───────────────────┘
             │                │                │
             │ (1:N)          │ (1:1)          │ (1:N)
             │                │                │
             ▼                ▼                ▼
   ┌─────────────────┐  ┌─────────────┐  ┌──────────────────┐
   │ yearly_financial│  │tax_performance│ │tax_calculations │
   │     _data       │  │              │  │                  │
   ├─────────────────┤  ├─────────────┤  ├──────────────────┤
   │ 🔑 id (PK)      │  │ 🔑 id (PK)  │  │ 🔑 id (PK)       │
   │ 🔗 taxpayer_id  │  │ 🔗 taxpayer_│  │ 🔗 taxpayer_id   │
   │ 📊 year_label   │  │    _id (FK) │  │ 📅 calculation_  │
   │ #️⃣ year_order   │  │ ✅ tax_file_│  │    date          │
   │ 💰 declared_    │  │    history  │  │ 📈 loyalty_      │
   │    sales        │  │ 📋 declarat-│  │    factor        │
   │ 💰 finalized_   │  │    ion_hist-│  │ 🎯 performance_  │
   │    sales        │  │    ory      │  │    score         │
   │ 💵 declared_    │  │ ⏰ on_time_ │  │ 💯 max_discount_ │
   │    income       │  │    payment  │  │    percent       │
   │ 💵 finalized_   │  │ 📁 workfold-│  │ 🎁 actual_disc-  │
   │    income       │  │    er_compl-│  │    ount_percent  │
   │ 💎 declared_    │  │    iance    │  │ 💰 base_tax_     │
   │    profit       │  │ 📧 electron-│  │    declared      │
   │ 💎 finalized_   │  │    ic_invoi-│  │ 💰 base_tax_     │
   │    profit       │  │    ce       │  │    finalized     │
   │ 🔢 conversion_  │  │ 📅 created_ │  │ 💸 discount_amt_ │
   │    factor       │  │    at       │  │    declared      │
   │ 📅 created_at   │  │ 📅 updated_ │  │ 💸 discount_amt_ │
   │                 │  │    at       │  │    finalized     │
   └─────────────────┘  └─────────────┘  │ 💵 final_tax_    │
                                         │    declared      │
                                         │ 💵 final_tax_    │
                                         │    finalized     │
                                         │ 🏆 loyalty_      │
                                         │    status        │
                                         │ 📊 adjusted_data │
                                         │ 📈 regression_   │
                                         │    data          │
                                         └──────────────────┘

                        ┌─────────────────┐
                        │   audit_log     │
                        ├─────────────────┤
                        │ 🔑 id (PK)      │
                        │ 📋 table_name   │
                        │ 🔢 record_id    │
                        │ ⚡ action       │
                        │ 📦 old_data     │
                        │ 📦 new_data     │
                        │ 👤 changed_by   │
                        │ 📅 changed_at   │
                        └─────────────────┘
```

---

## 📊 جداول دیتابیس

### 1️⃣ جدول `taxpayers` - اطلاعات هویتی مودیان

**توضیح:** این جدول اطلاعات شناسایی مودیان مالیاتی را ذخیره می‌کند.

| # | نام فیلد | نوع داده | NULL | پیش‌فرض | کلید | توضیحات |
|---|----------|----------|------|---------|------|---------|
| 1 | `id` | INTEGER | ❌ | AUTO_INCREMENT | 🔑 PRIMARY KEY | شناسه یکتای مودی |
| 2 | `full_name` | TEXT | ❌ | - | - | نام و نام خانوادگی کامل مودی |
| 3 | `national_code` | TEXT | ❌ | - | 🔒 UNIQUE | کد ملی 10 رقمی (یکتا) |
| 4 | `economic_code` | TEXT | ✅ | NULL | - | کد اقتصادی مودی |
| 5 | `created_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ و زمان ایجاد رکورد |
| 6 | `updated_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ و زمان آخرین به‌روزرسانی |

**محدودیت‌ها:**
- `UNIQUE (national_code)`: هر کد ملی فقط یک بار قابل ثبت است

**مثال داده:**
```json
{
  "id": 1,
  "full_name": "علی احمدی",
  "national_code": "1234567890",
  "economic_code": "123456789",
  "created_at": "2024-02-17 10:30:00",
  "updated_at": "2024-02-17 10:30:00"
}
```

---

### 2️⃣ جدول `yearly_financial_data` - اطلاعات مالی سالانه

**توضیح:** این جدول اطلاعات مالی مودی را برای 3 سال گذشته ذخیره می‌کند.

| # | نام فیلد | نوع داده | NULL | پیش‌فرض | کلید | توضیحات |
|---|----------|----------|------|---------|------|---------|
| 1 | `id` | INTEGER | ❌ | AUTO_INCREMENT | 🔑 PRIMARY KEY | شناسه یکتای رکورد |
| 2 | `taxpayer_id` | INTEGER | ❌ | - | 🔗 FOREIGN KEY | ارجاع به شناسه مودی |
| 3 | `year_label` | TEXT | ❌ | - | - | برچسب سال (مثلاً "سال قبل") |
| 4 | `year_order` | INTEGER | ❌ | - | - | ترتیب سال (1، 2، 3) |
| 5 | `declared_sales` | REAL | ✅ | 0 | - | فروش ابرازی (ریال) |
| 6 | `finalized_sales` | REAL | ✅ | 0 | - | فروش قطعی شده (ریال) |
| 7 | `declared_income` | REAL | ✅ | 0 | - | درآمد ابرازی (ریال) |
| 8 | `finalized_income` | REAL | ✅ | 0 | - | درآمد قطعی شده (ریال) |
| 9 | `declared_profit` | REAL | ✅ | 0 | - | سود ابرازی (ریال) |
| 10 | `finalized_profit` | REAL | ✅ | 0 | - | سود قطعی شده (ریال) |
| 11 | `conversion_factor` | REAL | ✅ | 0 | - | ضریب تبدیل (شاخص تولیدکننده) |
| 12 | `created_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ ثبت اطلاعات |

**محدودیت‌ها:**
- `FOREIGN KEY (taxpayer_id)` → `taxpayers(id)` با `ON DELETE CASCADE`
- `UNIQUE (taxpayer_id, year_order)`: هر مودی فقط یک رکورد برای هر سال

**مثال داده:**
```json
{
  "id": 1,
  "taxpayer_id": 1,
  "year_label": "سال قبل",
  "year_order": 3,
  "declared_sales": 1000000000,
  "finalized_sales": 1200000000,
  "declared_income": 875000000,
  "finalized_income": 1050000000,
  "declared_profit": 105000000,
  "finalized_profit": 126000000,
  "conversion_factor": 0.25
}
```

---

### 3️⃣ جدول `tax_performance` - عملکرد مالیاتی

**توضیح:** این جدول عملکرد مالیاتی مودی را در 5 سال گذشته در 5 معیار مختلف ذخیره می‌کند.

| # | نام فیلد | نوع داده | NULL | پیش‌فرض | کلید | توضیحات |
|---|----------|----------|------|---------|------|---------|
| 1 | `id` | INTEGER | ❌ | AUTO_INCREMENT | 🔑 PRIMARY KEY | شناسه یکتای رکورد |
| 2 | `taxpayer_id` | INTEGER | ❌ | - | 🔗 FOREIGN KEY | ارجاع به شناسه مودی |
| 3 | `tax_file_history` | TEXT | ✅ | '11110' | - | سابقه تشکیل پرونده مالیاتی (5 سال) |
| 4 | `declaration_history` | TEXT | ✅ | '11100' | - | سابقه تسلیم اظهارنامه مالیاتی (5 سال) |
| 5 | `on_time_payment` | TEXT | ✅ | '11010' | - | سابقه پرداخت سرموعد مالیات (5 سال) |
| 6 | `workfolder_compliance` | TEXT | ✅ | '10101' | - | سابقه انجام الزامات کارپوشه (5 سال) |
| 7 | `electronic_invoice` | TEXT | ✅ | '11100' | - | سابقه صورتحساب الکترونیکی (5 سال) |
| 8 | `created_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ ایجاد رکورد |
| 9 | `updated_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ آخرین به‌روزرسانی |

**فرمت ذخیره‌سازی:**
هر فیلد عملکرد یک رشته 5 کاراکتری است که هر کاراکتر نشان‌دهنده یک سال است:
- `'1'` = عملکرد مثبت در آن سال ✅
- `'0'` = عملکرد منفی در آن سال ❌

**مثال:** `'11100'` یعنی:
- سال 1 (امسال): ✅
- سال 2 (سال قبل): ✅
- سال 3 (دو سال قبل): ✅
- سال 4 (سه سال قبل): ❌
- سال 5 (چهار سال قبل): ❌

**محاسبه نمره:**
نمره کل عملکرد = مجموع تعداد `1` ها در تمام 5 فیلد (حداکثر 25)

**محدودیت‌ها:**
- `FOREIGN KEY (taxpayer_id)` → `taxpayers(id)` با `ON DELETE CASCADE`
- `UNIQUE (taxpayer_id)`: هر مودی فقط یک رکورد عملکرد دارد

**مثال داده:**
```json
{
  "id": 1,
  "taxpayer_id": 1,
  "tax_file_history": "11111",
  "declaration_history": "11110",
  "on_time_payment": "11100",
  "workfolder_compliance": "11010",
  "electronic_invoice": "11000"
}
```
**نمره کل:** 5 + 4 + 3 + 3 + 2 = **17 از 25**

---

### 4️⃣ جدول `tax_calculations` - محاسبات مالیاتی

**توضیح:** این جدول نتایج محاسبات مالیات علی‌الحساب با ضریب وفاداری را ذخیره می‌کند.

| # | نام فیلد | نوع داده | NULL | پیش‌فرض | کلید | توضیحات |
|---|----------|----------|------|---------|------|---------|
| 1 | `id` | INTEGER | ❌ | AUTO_INCREMENT | 🔑 PRIMARY KEY | شناسه یکتای محاسبه |
| 2 | `taxpayer_id` | INTEGER | ❌ | - | 🔗 FOREIGN KEY | ارجاع به شناسه مودی |
| 3 | `calculation_date` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ و زمان محاسبه |
| 4 | `loyalty_factor` | REAL | ❌ | - | - | ضریب وفاداری (0 تا 1) |
| 5 | `performance_score` | INTEGER | ❌ | - | - | نمره عملکرد (0 تا 25) |
| 6 | `max_discount_percent` | REAL | ❌ | - | - | حداکثر درصد تخفیف مجاز |
| 7 | `actual_discount_percent` | REAL | ❌ | - | - | درصد تخفیف واقعی اعمال شده |
| 8 | `base_tax_declared` | REAL | ❌ | - | - | مالیات اولیه ابرازی (ریال) |
| 9 | `base_tax_finalized` | REAL | ❌ | - | - | مالیات اولیه قطعی (ریال) |
| 10 | `discount_amount_declared` | REAL | ❌ | - | - | مبلغ تخفیف ابرازی (ریال) |
| 11 | `discount_amount_finalized` | REAL | ❌ | - | - | مبلغ تخفیف قطعی (ریال) |
| 12 | `final_tax_declared` | REAL | ❌ | - | - | **مالیات نهایی ابرازی (ریال)** |
| 13 | `final_tax_finalized` | REAL | ❌ | - | - | **مالیات نهایی قطعی (ریال)** |
| 14 | `loyalty_status` | TEXT | ✅ | NULL | - | وضعیت وفاداری (عالی/خوب/متوسط/ضعیف) |
| 15 | `adjusted_data` | TEXT | ✅ | NULL | - | داده‌های تعدیل شده سالانه (JSON) |
| 16 | `regression_data` | TEXT | ✅ | NULL | - | داده‌های رگرسیون و پیش‌بینی (JSON) |

**فرمول‌های محاسبه:**
```
ضریب وفاداری = نمره عملکرد / 25
درصد تخفیف واقعی = ضریب وفاداری × حداکثر درصد تخفیف
مالیات نهایی = مالیات اولیه × (1 - درصد تخفیف / 100)
```

**محدودیت‌ها:**
- `FOREIGN KEY (taxpayer_id)` → `taxpayers(id)` با `ON DELETE CASCADE`

**مثال داده:**
```json
{
  "id": 1,
  "taxpayer_id": 1,
  "calculation_date": "2024-02-17 15:45:00",
  "loyalty_factor": 0.68,
  "performance_score": 17,
  "max_discount_percent": 50,
  "actual_discount_percent": 34,
  "base_tax_declared": 25000000,
  "base_tax_finalized": 30000000,
  "discount_amount_declared": 8500000,
  "discount_amount_finalized": 10200000,
  "final_tax_declared": 16500000,
  "final_tax_finalized": 19800000,
  "loyalty_status": "خوب"
}
```

---

### 5️⃣ جدول `audit_log` - لاگ تغییرات

**توضیح:** این جدول تمام تغییرات انجام شده در دیتابیس را برای ردیابی و حسابرسی ثبت می‌کند.

| # | نام فیلد | نوع داده | NULL | پیش‌فرض | کلید | توضیحات |
|---|----------|----------|------|---------|------|---------|
| 1 | `id` | INTEGER | ❌ | AUTO_INCREMENT | 🔑 PRIMARY KEY | شناسه یکتای لاگ |
| 2 | `table_name` | TEXT | ❌ | - | - | نام جدول تغییر یافته |
| 3 | `record_id` | INTEGER | ❌ | - | - | شناسه رکورد تغییر یافته |
| 4 | `action` | TEXT | ❌ | - | - | نوع عملیات (INSERT/UPDATE/DELETE) |
| 5 | `old_data` | TEXT | ✅ | NULL | - | داده‌های قبلی (JSON) |
| 6 | `new_data` | TEXT | ✅ | NULL | - | داده‌های جدید (JSON) |
| 7 | `changed_by` | TEXT | ✅ | NULL | - | نام کاربر انجام‌دهنده تغییر |
| 8 | `changed_at` | TIMESTAMP | ✅ | CURRENT_TIMESTAMP | - | تاریخ و زمان تغییر |

**نوع عملیات:**
- `INSERT`: افزودن رکورد جدید
- `UPDATE`: ویرایش رکورد موجود
- `DELETE`: حذف رکورد

**مثال داده:**
```json
{
  "id": 1,
  "table_name": "taxpayers",
  "record_id": 1,
  "action": "UPDATE",
  "old_data": "{\"full_name\": \"علی احمدی\"}",
  "new_data": "{\"full_name\": \"علی احمدی (ویرایش شده)\"}",
  "changed_by": "admin",
  "changed_at": "2024-02-17 16:20:00"
}
```

---

## 🔍 ایندکس‌ها

برای بهبود عملکرد و سرعت جستجو، ایندکس‌های زیر ایجاد شده‌اند:

| نام ایندکس | جدول | ستون(ها) | هدف |
|------------|------|----------|------|
| `idx_taxpayers_national_code` | taxpayers | national_code | جستجوی سریع با کد ملی |
| `idx_yearly_data_taxpayer` | yearly_financial_data | taxpayer_id | دریافت سریع داده‌های سالانه |
| `idx_calculations_taxpayer` | tax_calculations | taxpayer_id | دریافت سریع محاسبات مودی |
| `idx_calculations_date` | tax_calculations | calculation_date | فیلتر و مرتب‌سازی بر اساس تاریخ |

---

## ⚙️ نکات مهم

### 🔒 امنیت
- **Prepared Statements**: تمام query ها از Prepared Statements استفاده می‌کنند
- **UNIQUE Constraint**: کد ملی باید یکتا باشد
- **Foreign Keys**: یکپارچگی ارجاعی تضمین شده است

### 🔄 حذف آبشاری (CASCADE DELETE)
با حذف یک مودی از جدول `taxpayers`، تمام داده‌های مرتبط در جداول زیر به صورت خودکار حذف می‌شوند:
- ✅ `yearly_financial_data`
- ✅ `tax_performance`
- ✅ `tax_calculations`

### 📊 ذخیره‌سازی JSON
فیلدهای زیر داده‌های پیچیده را به صورت JSON ذخیره می‌کنند:
- `adjusted_data` در جدول `tax_calculations`
- `regression_data` در جدول `tax_calculations`
- `old_data` و `new_data` در جدول `audit_log`

### ⏰ Timestamps خودکار
فیلدهای `created_at` و `updated_at` به صورت خودکار با زمان فعلی پر می‌شوند.

### 📈 محاسبه ضریب وفاداری
```
ضریب وفاداری = (مجموع تیک‌های عملکرد در 5 معیار) / 25
```

### 🎯 طبقه‌بندی وفاداری
- **عالی**: ضریب ≥ 0.8 (نمره ≥ 20)
- **خوب**: ضریب ≥ 0.6 (نمره ≥ 15)
- **متوسط**: ضریب ≥ 0.4 (نمره ≥ 10)
- **ضعیف**: ضریب < 0.4 (نمره < 10)

---

## 📝 مثال استفاده کامل

```python
from backend.database import DatabaseManager

# اتصال به دیتابیس
db = DatabaseManager("tax_calculator.db")

# 1. ایجاد مودی
taxpayer_id = db.create_taxpayer(
    full_name="شرکت نمونه",
    national_code="1234567890",
    economic_code="987654321"
)

# 2. ثبت اطلاعات مالی 3 سال
for i, year in enumerate(["سال سوم قبل", "سال دوم قبل", "سال قبل"]):
    db.save_yearly_data(taxpayer_id, year, i+1, {
        'declared_sales': (i+1) * 100_000_000,
        'finalized_sales': (i+1) * 120_000_000,
        'declared_profit': (i+1) * 10_000_000,
        'finalized_profit': (i+1) * 12_000_000,
        'conversion_factor': 0.20 + (i * 0.05)
    })

# 3. ثبت عملکرد مالیاتی
db.save_tax_performance(taxpayer_id, {
    'tax_file_history': [True, True, True, True, True],
    'declaration_history': [True, True, True, True, False],
    'on_time_payment': [True, True, True, False, False],
    'workfolder_compliance': [True, True, False, True, True],
    'electronic_invoice': [True, True, True, False, False]
})

# 4. ذخیره محاسبات
db.save_calculation(taxpayer_id, {
    'loyalty_factor': 0.72,
    'performance_score': 18,
    'max_discount_percent': 50,
    'actual_discount_percent': 36,
    'base_tax_declared': 25_000_000,
    'final_tax_declared': 16_000_000,
    'loyalty_status': 'خوب'
})

# 5. دریافت آمار
stats = db.get_statistics()
print(f"تعداد مودیان: {stats['total_taxpayers']}")
print(f"میانگین ضریب وفاداری: {stats['average_loyalty_factor']}")
```

---

**نسخه دیتابیس:** 1.0.0  
**تاریخ ایجاد:** ۱۴۰۴/۱۱/۲۸  
**آخرین به‌روزرسانی:** ۱۴۰۴/۱۱/۲۸
