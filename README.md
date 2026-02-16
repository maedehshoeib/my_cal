# 🧮 سیستم محاسبه مالیات علی‌الحساب (ماشین حساب مالیات وفاداری)

سیستم هوشمند محاسبه مالیات علی‌الحساب با در نظر گرفتن ضریب وفاداری مالیاتی - یک برنامه Full-Stack با React, FastAPI و SQLite

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](./DOCKER.md)
[![Python](https://img.shields.io/badge/Python-3.11-green)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688)](https://fastapi.tiangolo.com/)

---

## 📋 ویژگی‌ها

### محاسبات مالیاتی
- ✅ محاسبه مالیات بر اساس **رگرسیون خطی**
- ✅ پیش‌بینی سود سال جاری با استفاده از داده‌های 3 سال گذشته
- ✅ تعدیل اتوماتیک با **ضریب تبدیل** (شاخص تولیدکننده بانک مرکزی)
- ✅ محاسبه **ضریب وفاداری** بر اساس 5 دسته عملکرد مالیاتی
- ✅ اعمال تخفیف بر اساس رفتار مالیاتی مودی
- ✅ محاسبه موازی برای **ابرازی** و **قطعی**

### مدیریت داده‌ها
- ✅ دیتابیس SQLite کامل با 5 جدول
- ✅ ذخیره و مدیریت رکوردهای متعدد
- ✅ REST API کامل با FastAPI
- ✅ پشتیبان‌گیری و export به CSV
- ✅ تاریخچه محاسبات و audit log

### رابط کاربری
- ✅ UI مدرن و responsive با React
- ✅ پشتیبانی کامل از زبان فارسی (RTL)
- ✅ هایلایت رنگی برای ردیف‌های مهم
- ✅ نمایش دقیق اعداد بدون گردکردن
- ✅ مدیریت چندین رکورد همزمان

### زیرساخت
- ✅ Docker و Docker Compose
- ✅ Multi-stage builds برای optimization
- ✅ Health checks و monitoring
- ✅ Nginx reverse proxy
- ✅ Production-ready configuration

---

## 🎯 فرمول‌های استفاده شده

تمام فرمول‌ها بر اساس فایل اکسل رسمی سازمان امور مالیاتی پیاده‌سازی شده‌اند:

### 1. تعدیل با ضریب تبدیل
```
مقدار تعدیلی = مقدار × ضریب تبدیل
```

### 2. رگرسیون خطی
```
y = bx + y₀

b = [(مقدار₂ - مقدار₁) + (مقدار₃ - مقدار₂)] ÷ 2
y₀ = مقدار₁ - b
پیش‌بینی سال 4 = 4b + y₀
```

### 3. محاسبه مالیات
```
مالیات اولیه = سود × 0.25
درصد تخفیف = (نمره کل ÷ 25) × حداکثر تخفیف
مالیات نهایی = مالیات اولیه × (1 - تخفیف ÷ 100)
```

📚 **مستندات کامل فرمول‌ها:** [FORMULAS.md](./FORMULAS.md)  
📊 **مثال محاسبه:** [EXAMPLE.md](./EXAMPLE.md)  
🗄️ **طراحی دیتابیس:** [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## 🚀 راه‌اندازی پروژه

### گزینه 1: استفاده از Docker (پیشنهادی) 🐳

#### پیش‌نیازها
- Docker (نسخه 20.10+)
- Docker Compose (نسخه 2.0+)

#### راه‌اندازی سریع

```bash
# کلون پروژه
git clone <repository-url>
cd my_cal

# اجرا با یک دستور!
docker-compose up -d
```

برنامه در آدرس‌های زیر اجرا می‌شود:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

#### دستورات مفید

```bash
# مشاهده لاگ‌ها
docker-compose logs -f

# توقف سرویس‌ها
docker-compose down

# rebuild
docker-compose build --no-cache
docker-compose up -d
```

📖 **راهنمای کامل Docker**: [DOCKER.md](./DOCKER.md)

#### با استفاده از Makefile

```bash
# مشاهده تمام دستورات
make help

# ساخت و اجرا
make prod

# حالت development
make dev

# مشاهده لاگ‌ها
make logs

# پشتیبان‌گیری از دیتابیس
make db-backup
```

---

### گزینه 2: راه‌اندازی Manual

#### پیش‌نیازها
- Node.js 18+
- Python 3.11+
- npm یا yarn

#### 1. نصب و اجرای Backend

```bash
# نصب dependencies
pip install -r requirements.txt

# اجرای backend
python main.py
```

Backend در `http://localhost:8000` اجرا می‌شود.

#### 2. نصب و اجرای Frontend

```bash
# رفتن به پوشه frontend
cd frontend

# نصب dependencies
npm install

# اجرای development server
npm start
```

Frontend در `http://localhost:3000` اجرا می‌شود.

---

## 📁 ساختار پروژه

```
my_cal/
├── 🐳 Docker Files
│   ├── Dockerfile.backend          # Backend image
│   ├── Dockerfile.frontend         # Frontend image  
│   ├── docker-compose.yml          # Production setup
│   ├── docker-compose.dev.yml      # Development setup
│   ├── nginx.conf                  # Nginx configuration
│   └── .dockerignore               # Docker ignore rules
│
├── 🎨 Frontend (React)
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── LoyaltyTaxCalculator.jsx    # کامپوننت اصلی
│       │   └── LoyaltyTaxCalculator.css    # استایل‌ها
│       ├── App.js
│       └── index.js
│
├── 🔧 Backend (FastAPI)
│   ├── __init__.py
│   ├── api.py                      # API endpoints اصلی
│   ├── api_db.py                   # Database API endpoints
│   ├── calculator.py               # محاسبات مالیاتی
│   ├── database.py                 # Database manager
│   └── models.py                   # Pydantic models
│
├── 📚 Documentation
│   ├── README.md                   # این فایل
│   ├── DOCKER.md                   # راهنمای کامل Docker
│   ├── DOCKER_QUICKSTART.md        # شروع سریع Docker
│   ├── DEPLOYMENT.md               # راهنمای کامل Deploy و Production
│   ├── DEPLOYMENT_QUICK.md         # Deploy سریع (30 دقیقه)
│   ├── FORMULAS.md                 # مستندات فرمول‌ها
│   ├── EXAMPLE.md                  # مثال محاسبه
│   ├── DATABASE_SCHEMA.md          # طراحی دیتابیس
│   └── CHANGELOG.md                # تغییرات نسخه‌ها
│
├── ⚙️ Configuration
│   ├── .env.example                # Environment variables نمونه
│   ├── requirements.txt            # Python dependencies
│   ├── Makefile                    # دستورات کمکی
│   └── main.py                     # Entry point backend
│
└── 🗄️ Data (runtime)
    └── data/                       # SQLite database
```

---

## 🗄️ دیتابیس

پروژه از SQLite با 5 جدول اصلی استفاده می‌کند:

### جداول دیتابیس

1. **taxpayers**: اطلاعات مودیان
2. **yearly_financial_data**: داده‌های مالی سه ساله
3. **tax_performance**: عملکرد مالیاتی 5 ساله
4. **tax_calculations**: نتایج محاسبات
5. **audit_log**: تاریخچه تغییرات

### API Endpoints

```bash
# مودیان
GET    /api/db/taxpayers              # لیست مودیان
POST   /api/db/taxpayers              # افزودن مودی
GET    /api/db/taxpayers/{id}         # جزئیات مودی

# محاسبات
GET    /api/db/calculations           # لیست محاسبات
POST   /api/db/calculations           # ذخیره محاسبه

# آمار
GET    /api/db/statistics             # آمار کلی

# پشتیبان‌گیری
POST   /api/db/backup                 # ایجاد backup
```

📖 **مستندات کامل دیتابیس**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)

---

## 🧪 تست و توسعه

### اجرای تست‌ها

```bash
# تست backend
docker exec tax_calculator_backend python -m pytest

# یا در local
pytest
```

### Development Mode

```bash
# با Docker Compose
docker-compose -f docker-compose.dev.yml up

# با Makefile
make dev
```

در حالت development:
- ✅ Hot reload برای frontend و backend
- ✅ Debug logging
- ✅ Source maps
- ✅ Development tools

---

## 📊 استفاده از برنامه

### 1. ورود اطلاعات پایه

- نام و کد ملی مودی
- حداکثر درصد تخفیف
- عملکرد مالیاتی 5 ساله (1 = موفق، 0 = ناموفق)

### 2. ورود داده‌های مالی

برای هر یک از 3 سال گذشته:
- درآمد (ابرازی و قطعی)
- مالیات پرداختی (ابرازی و قطعی)
- ضریب تبدیل سال

### 3. محاسبه

- کلیک روی دکمه "محاسبه مالیات"
- مشاهده نتایج شامل:
  - مالیات اولیه و نهایی
  - میزان تخفیف
  - ضریب وفاداری
  - نمره عملکرد

### 4. مدیریت رکوردها

- ذخیره محاسبه
- مشاهده رکوردهای ذخیره‌شده
- بارگذاری مجدد
- حذف رکوردها

---

## 🔧 تنظیمات

### Environment Variables

کپی `.env.example` به `.env` و تنظیم مقادیر:

```bash
cp .env.example .env
```

متغیرهای مهم:

```env
# Application
ENV=production
LOG_LEVEL=info

# Database
DATABASE_PATH=/app/data/tax_calculator.db

# CORS
CORS_ORIGINS=http://localhost,http://localhost:80

# Backend
BACKEND_PORT=8000
UVICORN_WORKERS=2
```

### تنظیمات Nginx

برای تغییر تنظیمات Nginx، فایل `nginx.conf` را ویرایش کنید.

---

## 🚀 Production Deployment

### با Docker

```bash
# Clean build
make clean
make build-no-cache

# Run
make up

# یا استفاده از docker-compose
docker-compose build --no-cache
docker-compose up -d
```

### نکات مهم Production

1. **SSL/TLS**: از Let's Encrypt یا Cloudflare استفاده کنید
2. **Backup**: از دیتابیس به صورت منظم backup بگیرید
3. **Monitoring**: لاگ‌ها را بررسی کنید
4. **Security**: Environment variables را ایمن نگه دارید
5. **Updates**: به روزرسانی‌های امنیتی را اعمال کنید

### Backup و Restore

```bash
# Backup دیتابیس
make db-backup

# یا دستی
docker exec tax_calculator_backend python -c "
from backend.database import DatabaseManager
db = DatabaseManager()
db.create_backup('/app/data/backups')
"

# کپی به host
docker cp tax_calculator_backend:/app/data/tax_calculator.db ./backup.db
```

---

## 📚 مستندات تکمیلی

| فایل | توضیحات | زمان مطالعه |
|------|---------|-------------|
| [DEPLOYMENT_QUICK.md](./DEPLOYMENT_QUICK.md) | 🚀 Deploy سریع (30 دقیقه) | 5 دقیقه |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | 📘 راهنمای کامل Deploy و Production | 20 دقیقه |
| [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) | 🐳 شروع سریع Docker | 3 دقیقه |
| [DOCKER.md](./DOCKER.md) | 📗 راهنمای کامل Docker | 15 دقیقه |
| [FORMULAS.md](./FORMULAS.md) | 🧮 فرمول‌های محاسباتی | 10 دقیقه |
| [EXAMPLE.md](./EXAMPLE.md) | 📊 مثال کامل محاسبه | 5 دقیقه |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | 🗄️ طراحی دیتابیس | 10 دقیقه |
| [CHANGELOG.md](./CHANGELOG.md) | 📝 تاریخچه تغییرات | 2 دقیقه |

---

## 🛠️ تکنولوژی‌های استفاده شده

### Frontend
- **React 18**: UI framework
- **CSS3**: Styling با RTL support
- **JavaScript ES6+**: Modern JavaScript

### Backend
- **Python 3.11**: Programming language
- **FastAPI**: Modern web framework
- **SQLite**: Database
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Web server & reverse proxy
- **Make**: Build automation

---

## 🤝 مشارکت

برای مشارکت در پروژه:

1. Fork کنید
2. Branch جدید بسازید (`git checkout -b feature/amazing-feature`)
3. تغییرات را commit کنید (`git commit -m 'Add amazing feature'`)
4. Push کنید (`git push origin feature/amazing-feature`)
5. Pull Request ایجاد کنید

---

## � لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

## � پشتیبانی

در صورت بروز مشکل:

1. ابتدا [DOCKER.md](./DOCKER.md) را مطالعه کنید
2. لاگ‌ها را بررسی کنید: `make logs`
3. Health check کنید: `make health`
4. Issue جدید در GitHub ایجاد کنید

---

## 🙏 تشکر

این پروژه بر اساس فرمول‌های رسمی سازمان امور مالیاتی کشور توسعه یافته است.

---

**نسخه**: 2.0.0  
**آخرین بروزرسانی**: 2026-02-17  
**توسعه‌دهنده**: Tax Calculator Team
