# ⚡ راهنمای سریع Deploy

راهنمای خلاصه برای انتقال سریع پروژه به سرور Production

---

## 🎯 مراحل اصلی

### 1️⃣ آماده‌سازی سرور (10 دقیقه)

```bash
# اتصال به سرور
ssh user@your-server-ip

# نصب Docker و Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# نصب Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# خروج و ورود مجدد
exit
```

### 2️⃣ انتقال کد (5 دقیقه)

**روش A: با Git**
```bash
ssh user@your-server-ip
cd ~
git clone https://github.com/maedehshoeib/my_cal.git
cd my_cal
```

**روش B: با SCP (از کامپیوتر محلی)**
```bash
cd /home/maede/Projects
tar -czf my_cal.tar.gz my_cal/
scp my_cal.tar.gz user@your-server-ip:~/
ssh user@your-server-ip "tar -xzf my_cal.tar.gz"
```

### 3️⃣ تنظیمات (5 دقیقه)

```bash
cd ~/my_cal

# کپی environment variables
cp .env.example .env

# ویرایش .env (تغییر CORS_ORIGINS و REACT_APP_API_URL)
nano .env
```

**مهم**: در `.env` این موارد را تغییر دهید:
```env
REACT_APP_API_URL=http://YOUR_SERVER_IP:8000
CORS_ORIGINS=http://YOUR_SERVER_IP,http://localhost
```

### 4️⃣ اجرا (5 دقیقه)

```bash
# Build و اجرا
docker-compose build
docker-compose up -d

# بررسی
docker-compose ps
docker-compose logs -f
```

### 5️⃣ تست

```bash
# تست backend
curl http://YOUR_SERVER_IP:8000/health

# تست frontend
curl http://YOUR_SERVER_IP/
```

**دسترسی از مرورگر:**
- Frontend: `http://YOUR_SERVER_IP`
- Backend API: `http://YOUR_SERVER_IP:8000/docs`

---

## 🔒 افزودن SSL (اختیاری - 10 دقیقه)

```bash
# نصب Certbot
sudo apt install -y certbot nginx

# دریافت SSL
sudo certbot certonly --standalone -d yourdomain.com

# پیکربندی Nginx
sudo nano /etc/nginx/sites-available/tax-calculator
```

📖 **راهنمای کامل SSL**: [DEPLOYMENT.md](./DEPLOYMENT.md#نصب-sslhttps)

---

## 🔥 دستورات مفید

```bash
# مشاهده لاگ‌ها
docker-compose logs -f

# راه‌اندازی مجدد
docker-compose restart

# توقف
docker-compose down

# بروزرسانی
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Backup دیتابیس
docker cp tax_calculator_backend:/app/data/tax_calculator.db ./backup.db

# پاک‌سازی
docker system prune -a
```

---

## 🐛 عیب‌یابی سریع

**مشکل**: نمی‌توانم به سایت دسترسی داشته باشم

```bash
# بررسی firewall
sudo ufw allow 80
sudo ufw allow 8000

# بررسی containers
docker-compose ps
```

**مشکل**: خطای CORS

```bash
# ویرایش .env
nano .env
# تغییر CORS_ORIGINS به IP یا domain سرور

# راه‌اندازی مجدد
docker-compose restart
```

**مشکل**: فضای دیسک کم

```bash
# پاک‌سازی Docker
docker system prune -a --volumes
```

---

## 📚 مستندات کامل

برای اطلاعات بیشتر:

- **راهنمای کامل Deploy**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **راهنمای Docker**: [DOCKER.md](./DOCKER.md)
- **راهنمای پروژه**: [README.md](./README.md)

---

## ✅ Checklist

- [ ] سرور آماده با Docker
- [ ] کد منتقل شده
- [ ] `.env` تنظیم شده
- [ ] Firewall باز شده (پورت 80، 8000)
- [ ] Containers در حال اجرا
- [ ] تست موفق از مرورگر

---

**زمان کل**: ~30 دقیقه  
**سطح مهارت**: مبتدی تا متوسط
