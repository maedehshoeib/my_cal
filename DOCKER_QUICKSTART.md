# 🐳 راهنمای سریع Docker

## شروع سریع

```bash
# 1. ساخت images
docker-compose build

# 2. اجرای containers
docker-compose up -d

# 3. مشاهده وضعیت
docker-compose ps

# 4. مشاهده لاگ‌ها
docker-compose logs -f
```

## دسترسی به برنامه

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## دستورات مفید با Makefile

```bash
make help           # نمایش تمام دستورات
make build          # ساخت images
make up             # اجرای containers
make down           # توقف containers
make logs           # مشاهده لاگ‌ها
make restart        # راه‌اندازی مجدد
make clean          # پاک‌سازی
make db-backup      # پشتیبان‌گیری
```

## Development Mode

```bash
# با Makefile
make dev

# با docker-compose
docker-compose -f docker-compose.dev.yml up
```

## عیب‌یابی

```bash
# بررسی سلامت
make health

# مشاهده آمار منابع
make stats

# دسترسی به shell
make shell-backend
make shell-frontend

# بررسی شبکه
make network-inspect
```

## توقف و حذف

```bash
# توقف
make down

# حذف همه چیز
make clean-all
```

---

📖 **راهنمای کامل**: [DOCKER.md](./DOCKER.md)
