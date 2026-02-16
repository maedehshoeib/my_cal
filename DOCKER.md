# 🐳 راهنمای Docker - ماشین حساب مالیات وفاداری

این پروژه به صورت کامل با Docker و Docker Compose پیکربندی شده است.

## 📋 فهرست مطالب

- [پیش‌نیازها](#پیش‌نیازها)
- [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)
- [دستورات مفید](#دستورات-مفید)
- [معماری](#معماری)
- [پورت‌ها](#پورتها)
- [Volumes و داده‌ها](#volumes-و-دادهها)
- [توسعه](#توسعه)
- [عیب‌یابی](#عیبیابی)

---

## 🔧 پیش‌نیازها

قبل از شروع، مطمئن شوید که موارد زیر نصب شده باشند:

- **Docker**: نسخه 20.10 یا بالاتر
- **Docker Compose**: نسخه 2.0 یا بالاتر
- **Make**: (اختیاری) برای استفاده از دستورات کوتاه‌تر

### بررسی نصب:

```bash
docker --version
docker-compose --version
make --version  # اختیاری
```

---

## 🚀 نصب و راه‌اندازی

### روش 1: استفاده از Makefile (پیشنهادی)

```bash
# مشاهده تمام دستورات
make help

# ساخت و اجرای پروژه
make prod

# یا به صورت مرحله‌ای:
make build    # ساخت images
make up       # اجرای containers
```

### روش 2: استفاده مستقیم از Docker Compose

```bash
# ساخت images
docker-compose build

# اجرای سرویس‌ها در پس‌زمینه
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f
```

### دسترسی به برنامه:

پس از اجرا، سرویس‌ها در آدرس‌های زیر در دسترس هستند:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## 📝 دستورات مفید

### دستورات اصلی:

```bash
# ساخت images
make build                # با cache
make build-no-cache      # بدون cache

# اجرای سرویس‌ها
make up                  # در پس‌زمینه
make dev                 # در foreground (برای development)

# توقف و حذف
make down               # توقف سرویس‌ها
make clean              # حذف containers و networks
make clean-all          # حذف همه چیز (شامل images و volumes)

# راه‌اندازی مجدد
make restart            # راه‌اندازی مجدد سرویس‌ها
make rebuild            # rebuild کامل
```

### مشاهده لاگ‌ها:

```bash
make logs               # تمام سرویس‌ها
make logs-backend       # فقط backend
make logs-frontend      # فقط frontend
```

### وضعیت و نظارت:

```bash
make ps                 # لیست containers
make health             # بررسی سلامت
make stats              # آمار مصرف منابع
```

### دسترسی به Shell:

```bash
make shell-backend      # Shell در backend container
make shell-frontend     # Shell در frontend container
```

### پشتیبان‌گیری از دیتابیس:

```bash
make db-backup          # ایجاد backup
make db-shell           # دسترسی به SQLite shell
```

---

## 🏗️ معماری

پروژه شامل 3 بخش اصلی است:

```
┌─────────────────────────────────────────┐
│         Nginx (Frontend)                │
│         Port: 80                        │
│  - React Application                    │
│  - Reverse Proxy to Backend             │
└──────────────┬──────────────────────────┘
               │
               │ /api/* requests
               ▼
┌─────────────────────────────────────────┐
│         FastAPI (Backend)               │
│         Port: 8000                      │
│  - REST API                             │
│  - Business Logic                       │
│  - Database Management                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         SQLite Database                 │
│         Volume: backend_data            │
│  - Persistent Storage                   │
└─────────────────────────────────────────┘
```

### سرویس‌ها:

#### 1. **Backend** (Python/FastAPI)
- **Image**: `python:3.11-slim`
- **Port**: 8000
- **Health Check**: `http://localhost:8000/health`
- **Features**:
  - Multi-stage build برای کاهش حجم
  - Non-root user برای امنیت
  - Auto-restart on failure
  - Volume برای database

#### 2. **Frontend** (React/Nginx)
- **Image**: `nginx:1.25-alpine`
- **Port**: 80
- **Health Check**: `http://localhost:80/`
- **Features**:
  - Production build از React
  - Gzip compression
  - Reverse proxy به backend
  - Cache optimization
  - Security headers

---

## 🔌 پورت‌ها

| سرویس | Container Port | Host Port | توضیحات |
|-------|----------------|-----------|---------|
| Backend | 8000 | 8000 | FastAPI Server |
| Frontend | 80 | 80 | Nginx Server |

برای تغییر پورت‌ها، فایل `docker-compose.yml` را ویرایش کنید:

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # استفاده از پورت 8080 به جای 80
```

---

## 💾 Volumes و داده‌ها

### Volumes:

```bash
# لیست volumes
docker volume ls | grep tax_calculator

# بررسی جزئیات volume
docker volume inspect tax_calculator_data

# حذف volume (⚠️ داده‌ها حذف می‌شوند)
docker volume rm tax_calculator_data
```

### مکان دیتابیس:

دیتابیس SQLite در volume ذخیره می‌شود:
- **Volume Name**: `tax_calculator_data`
- **Container Path**: `/app/data/tax_calculator.db`

### پشتیبان‌گیری:

```bash
# روش 1: استفاده از Makefile
make db-backup

# روش 2: کپی مستقیم
docker cp tax_calculator_backend:/app/data/tax_calculator.db ./backup.db

# روش 3: استفاده از API
docker exec tax_calculator_backend python -c "
from backend.database import DatabaseManager
db = DatabaseManager()
db.create_backup('/app/data/backups')
"
```

---

## 👨‍💻 توسعه

### حالت Development:

برای توسعه از `docker-compose.dev.yml` استفاده کنید:

```bash
# اجرا در حالت development
docker-compose -f docker-compose.dev.yml up

# با Makefile
make dev
```

تفاوت‌های حالت Development:
- ✅ Hot reload برای backend و frontend
- ✅ Code mounting برای تغییرات لحظه‌ای
- ✅ Debug logs
- ✅ Frontend روی پورت 3000
- ✅ CORS تنظیم شده برای development

### ویرایش کد:

در حالت development، تغییرات در فایل‌ها بلافاصله اعمال می‌شود:

```bash
# تغییر backend
vim backend/api.py          # تغییرات خودکار اعمال می‌شود

# تغییر frontend
vim frontend/src/App.js     # تغییرات خودکار اعمال می‌شود
```

### نصب Dependencies جدید:

```bash
# Backend (Python)
echo "new-package==1.0.0" >> requirements.txt
make rebuild

# Frontend (Node)
cd frontend
npm install new-package
make rebuild
```

---

## 🐛 عیب‌یابی

### مشکلات رایج:

#### 1. **Port در حال استفاده است**

```bash
# بررسی پورت‌های در حال استفاده
sudo lsof -i :80
sudo lsof -i :8000

# تغییر پورت در docker-compose.yml
services:
  frontend:
    ports:
      - "8080:80"
```

#### 2. **Container راه‌اندازی نمی‌شود**

```bash
# مشاهده لاگ‌ها
make logs

# بررسی وضعیت
docker-compose ps

# راه‌اندازی مجدد
make rebuild
```

#### 3. **دیتابیس خالی است**

```bash
# بررسی وجود فایل دیتابیس
docker exec tax_calculator_backend ls -la /app/data/

# دسترسی به SQLite shell
make db-shell
```

#### 4. **Backend به Frontend متصل نمی‌شود**

```bash
# بررسی network
make network-inspect

# بررسی CORS settings
docker exec tax_calculator_backend env | grep CORS
```

#### 5. **Frontend فایل‌های static را نمایش نمی‌دهد**

```bash
# بررسی nginx config
docker exec tax_calculator_frontend cat /etc/nginx/conf.d/default.conf

# بررسی فایل‌های build
docker exec tax_calculator_frontend ls -la /usr/share/nginx/html/
```

### دستورات تشخیصی:

```bash
# مشاهده تمام containers
docker ps -a

# مشاهده images
docker images

# مشاهده networks
docker network ls

# مشاهده volumes
docker volume ls

# بررسی آمار منابع
make stats

# مشاهده جزئیات کامل
make inspect-backend
make inspect-frontend
```

### پاک‌سازی کامل:

اگر همه چیز خراب شد، از این دستورات استفاده کنید:

```bash
# حذف همه چیز
make clean-all

# یا به صورت دستی
docker-compose down -v --rmi all
docker system prune -a -f
docker volume prune -f

# سپس rebuild
make build
make up
```

---

## 📊 نظارت و Performance

### مشاهده مصرف منابع:

```bash
# Real-time stats
make stats

# یا
docker stats tax_calculator_backend tax_calculator_frontend
```

### Health Checks:

```bash
# بررسی سلامت backend
curl http://localhost:8000/health

# بررسی سلامت frontend
curl http://localhost/health

# یا با Makefile
make health
```

### لاگ‌ها:

لاگ‌ها به صورت خودکار rotate می‌شوند (max 10MB × 3 files)

```bash
# مشاهده لاگ‌های اخیر
make logs

# مشاهده لاگ‌های قدیمی‌تر
docker-compose logs --tail=1000
```

---

## 🚢 Production Deployment

### آماده‌سازی:

```bash
# Clean build
make deploy

# یا به صورت دستی
make clean
make build-no-cache
```

### تنظیمات Production:

1. **Environment Variables**: کپی `.env.example` به `.env` و تنظیم مقادیر:

```bash
cp .env.example .env
vim .env
```

2. **Security Headers**: در `nginx.conf` فعال شده‌اند

3. **Resource Limits**: در صورت نیاز در `docker-compose.yml` اضافه کنید:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

4. **SSL/TLS**: برای HTTPS، certbot یا reverse proxy استفاده کنید

---

## 📚 منابع بیشتر

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 🆘 دریافت کمک

در صورت بروز مشکل:

1. ابتدا لاگ‌ها را بررسی کنید: `make logs`
2. وضعیت سرویس‌ها را چک کنید: `make health`
3. از دستورات عیب‌یابی استفاده کنید

---

**تاریخ آخرین بروزرسانی**: 2026-02-17
