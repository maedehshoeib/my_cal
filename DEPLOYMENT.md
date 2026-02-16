# 🚀 راهنمای Deploy و Production - ماشین حساب مالیات

این راهنما مراحل کامل برای انتقال پروژه به سرور و اجرای production را شرح می‌دهد.

---

## 📋 فهرست مطالب

- [پیش‌نیازها](#پیش‌نیازها)
- [آماده‌سازی سرور](#آمادهسازی-سرور)
- [انتقال کد به سرور](#انتقال-کد-به-سرور)
- [نصب و پیکربندی](#نصب-و-پیکربندی)
- [اجرای با Docker](#اجرای-با-docker)
- [تنظیمات DNS و Domain](#تنظیمات-dns-و-domain)
- [نصب SSL/HTTPS](#نصب-sslhttps)
- [پیکربندی Reverse Proxy](#پیکربندی-reverse-proxy)
- [Monitoring و Logging](#monitoring-و-logging)
- [Backup اتوماتیک](#backup-اتوماتیک)
- [بروزرسانی و نگهداری](#بروزرسانی-و-نگهداری)
- [عیب‌یابی](#عیبیابی)

---

## 🔧 پیش‌نیازها

### سرور

- **سیستم عامل**: Ubuntu 20.04/22.04 LTS یا Debian 11+
- **RAM**: حداقل 2GB (پیشنهادی: 4GB)
- **دیسک**: حداقل 20GB فضای خالی
- **CPU**: حداقل 2 Core
- **IP عمومی**: برای دسترسی از اینترنت

### نرم‌افزارهای مورد نیاز

- Docker 20.10+
- Docker Compose 2.0+
- Git
- Nginx (اختیاری - برای reverse proxy خارج از Docker)
- Certbot (برای SSL)

### دسترسی‌ها

- دسترسی SSH با کلید
- دسترسی sudo
- پورت‌های 80 و 443 باز باشند

---

## 🖥️ آماده‌سازی سرور

### 1. اتصال به سرور

```bash
# اتصال با SSH
ssh user@your-server-ip

# یا با کلید خصوصی
ssh -i /path/to/private-key user@your-server-ip
```

### 2. بروزرسانی سیستم

```bash
# بروزرسانی لیست پکیج‌ها
sudo apt update

# نصب بروزرسانی‌ها
sudo apt upgrade -y

# نصب ابزارهای پایه
sudo apt install -y curl wget git vim htop
```

### 3. نصب Docker

```bash
# حذف نسخه‌های قدیمی (اگر وجود دارد)
sudo apt remove docker docker-engine docker.io containerd runc

# نصب پیش‌نیازها
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# افزودن کلید GPG رسمی Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# افزودن repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# نصب Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# بررسی نصب
docker --version
```

### 4. نصب Docker Compose

```bash
# دانلود Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# اجازه اجرا
sudo chmod +x /usr/local/bin/docker-compose

# بررسی نصب
docker-compose --version
```

### 5. افزودن کاربر به گروه Docker

```bash
# افزودن کاربر فعلی به گروه docker
sudo usermod -aG docker $USER

# خروج و ورود مجدد برای اعمال تغییرات
# یا استفاده از:
newgrp docker

# بررسی
docker ps
```

### 6. راه‌اندازی Firewall

```bash
# نصب UFW (اگر نصب نیست)
sudo apt install -y ufw

# اجازه SSH
sudo ufw allow ssh
sudo ufw allow 22/tcp

# اجازه HTTP و HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# فعال‌سازی firewall
sudo ufw enable

# بررسی وضعیت
sudo ufw status
```

---

## 📦 انتقال کد به سرور

### روش 1: با Git (پیشنهادی)

```bash
# ایجاد دایرکتری برای پروژه
cd ~
mkdir -p projects
cd projects

# کلون از GitHub
git clone https://github.com/maedehshoeib/my_cal.git

# یا اگر repository خصوصی است:
git clone https://YOUR_TOKEN@github.com/maedehshoeib/my_cal.git

# ورود به پوشه پروژه
cd my_cal
```

### روش 2: با SCP (انتقال مستقیم)

**از کامپیوتر محلی:**

```bash
# فشرده‌سازی پروژه
cd /home/maede/Projects
tar -czf my_cal.tar.gz my_cal/

# انتقال به سرور
scp my_cal.tar.gz user@your-server-ip:~/

# اتصال به سرور و استخراج
ssh user@your-server-ip
cd ~
tar -xzf my_cal.tar.gz
cd my_cal
```

### روش 3: با rsync (همگام‌سازی)

**از کامپیوتر محلی:**

```bash
# همگام‌سازی فایل‌ها
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude '*.db' \
    /home/maede/Projects/my_cal/ \
    user@your-server-ip:~/projects/my_cal/
```

---

## ⚙️ نصب و پیکربندی

### 1. تنظیم Environment Variables

```bash
# کپی فایل .env نمونه
cp .env.example .env

# ویرایش فایل .env
vim .env
```

**محتوای `.env` برای Production:**

```env
# ==================== Application ====================
ENV=production
LOG_LEVEL=info

# ==================== Backend ====================
DATABASE_PATH=/app/data/tax_calculator.db
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
UVICORN_WORKERS=4

# ==================== Frontend ====================
REACT_APP_API_URL=https://yourdomain.com/api
NODE_ENV=production

# ==================== CORS ====================
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# ==================== Security ====================
SECRET_KEY=your-very-secure-random-secret-key-here
# برای تولید کلید امن:
# python -c "import secrets; print(secrets.token_urlsafe(32))"

# ==================== Database ====================
DB_BACKUP_ENABLED=true
DB_BACKUP_PATH=/app/data/backups
```

### 2. ایجاد دایرکتری‌های مورد نیاز

```bash
# ایجاد پوشه برای database و backup
mkdir -p data backups logs

# تنظیم مجوزها
chmod 755 data backups logs
```

### 3. تنظیم Git برای بروزرسانی‌های آینده

```bash
# تنظیم Git config
git config --global user.name "Your Name"
git config --global user.email "your@email.com"

# افزودن remote (اگر کلون نکردید)
git remote add origin https://github.com/maedehshoeib/my_cal.git
```

---

## 🐳 اجرای با Docker

### 1. Build و اجرا

```bash
# ساخت images
docker-compose build --no-cache

# اجرا در background
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f
```

### 2. بررسی وضعیت

```bash
# لیست containers
docker-compose ps

# بررسی health
curl http://localhost:8000/health
curl http://localhost/

# مشاهده لاگ‌های جداگانه
docker-compose logs backend
docker-compose logs frontend
```

### 3. تست عملکرد

```bash
# تست backend API
curl http://localhost:8000/docs

# تست frontend
curl http://localhost/

# تست database
docker exec tax_calculator_backend ls -la /app/data/
```

---

## 🌐 تنظیمات DNS و Domain

### 1. خرید دامنه

از یکی از سرویس‌دهندگان زیر:
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

### 2. تنظیم DNS Records

در پنل مدیریت دامنه، رکوردهای زیر را اضافه کنید:

```
Type    Name    Value                   TTL
A       @       YOUR_SERVER_IP          3600
A       www     YOUR_SERVER_IP          3600
CNAME   api     yourdomain.com          3600
```

### 3. بررسی DNS Propagation

```bash
# بررسی DNS
dig yourdomain.com
nslookup yourdomain.com

# یا از وبسایت
# https://www.whatsmydns.net/
```

---

## 🔒 نصب SSL/HTTPS

### روش 1: با Certbot (Let's Encrypt) - رایگان

#### 1. نصب Certbot

```bash
# نصب Certbot
sudo apt install -y certbot python3-certbot-nginx

# یا برای نسخه جدید:
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### 2. دریافت گواهی SSL

```bash
# توقف موقت nginx (اگر در حال اجراست)
sudo systemctl stop nginx

# دریافت گواهی
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# یا اگر nginx در حال اجرا است:
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 3. مکان فایل‌های SSL

```
Certificate: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
Private Key: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

#### 4. تنظیم Auto-Renewal

```bash
# بررسی renewal خودکار
sudo certbot renew --dry-run

# افزودن به crontab برای تمدید خودکار
sudo crontab -e

# افزودن این خط:
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### روش 2: با Cloudflare (ساده‌تر)

1. ثبت‌نام در Cloudflare
2. افزودن دامنه
3. تغییر Nameservers دامنه به Cloudflare
4. فعال‌سازی SSL/TLS → Full (strict)
5. در پنل Cloudflare: SSL/TLS → Origin Server → Create Certificate
6. کپی certificate و private key

---

## 🔄 پیکربندی Reverse Proxy

### روش 1: Nginx خارج از Docker (پیشنهادی برای Production)

#### 1. نصب Nginx

```bash
sudo apt install -y nginx
```

#### 2. ایجاد فایل پیکربندی

```bash
sudo vim /etc/nginx/sites-available/tax-calculator
```

**محتوای فایل:**

```nginx
# HTTP → HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/tax-calculator-access.log;
    error_log /var/log/nginx/tax-calculator-error.log;

    # Root directory
    root /var/www/html;

    # Frontend (Proxy to Docker)
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss image/svg+xml;
}
```

#### 3. فعال‌سازی سایت

```bash
# ایجاد symlink
sudo ln -s /etc/nginx/sites-available/tax-calculator /etc/nginx/sites-enabled/

# حذف default site
sudo rm /etc/nginx/sites-enabled/default

# بررسی تنظیمات
sudo nginx -t

# راه‌اندازی مجدد
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### 4. تنظیم Docker Compose برای استفاده با Nginx خارجی

ویرایش `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "127.0.0.1:8080:80"  # فقط localhost
  
  backend:
    ports:
      - "127.0.0.1:8000:8000"  # فقط localhost
```

### روش 2: استفاده از Traefik

برای پروژه‌های بزرگ‌تر می‌توانید از Traefik استفاده کنید که SSL خودکار دارد.

---

## 📊 Monitoring و Logging

### 1. نصب و پیکربندی Logrotate

```bash
# ایجاد فایل config
sudo vim /etc/logrotate.d/tax-calculator
```

**محتوا:**

```
/home/user/projects/my_cal/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 user user
    sharedscripts
    postrotate
        docker-compose -f /home/user/projects/my_cal/docker-compose.yml restart > /dev/null
    endscript
}
```

### 2. مشاهده لاگ‌های سیستمی

```bash
# لاگ‌های Nginx
sudo tail -f /var/log/nginx/tax-calculator-access.log
sudo tail -f /var/log/nginx/tax-calculator-error.log

# لاگ‌های Docker
docker-compose logs -f --tail=100

# لاگ‌های سیستم
sudo journalctl -u docker -f
```

### 3. نصب htop برای مانیتورینگ

```bash
# نصب
sudo apt install -y htop

# اجرا
htop
```

### 4. استفاده از Docker Stats

```bash
# مشاهده آمار منابع
docker stats

# یا با docker-compose
docker-compose stats
```

---

## 💾 Backup اتوماتیک

### 1. اسکریپت Backup

```bash
# ایجاد اسکریپت
vim ~/backup-tax-calculator.sh
```

**محتوای اسکریپت:**

```bash
#!/bin/bash

# مشخصات
PROJECT_DIR="/home/user/projects/my_cal"
BACKUP_DIR="/home/user/backups/tax-calculator"
DATE=$(date +%Y%m%d_%H%M%S)

# ایجاد دایرکتری backup
mkdir -p $BACKUP_DIR

# Backup دیتابیس
echo "📦 Backing up database..."
docker exec tax_calculator_backend python -c "
from backend.database import DatabaseManager
db = DatabaseManager()
db.create_backup('/app/data/backups')
"

# کپی database
docker cp tax_calculator_backend:/app/data/tax_calculator.db \
    $BACKUP_DIR/tax_calculator_$DATE.db

# فشرده‌سازی
cd $BACKUP_DIR
tar -czf tax_calculator_db_$DATE.tar.gz tax_calculator_$DATE.db
rm tax_calculator_$DATE.db

# حذف backupهای قدیمی‌تر از 30 روز
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_DIR/tax_calculator_db_$DATE.tar.gz"
```

**اجازه اجرا:**

```bash
chmod +x ~/backup-tax-calculator.sh
```

### 2. تنظیم Cron برای Backup خودکار

```bash
# ویرایش crontab
crontab -e
```

**افزودن خطوط زیر:**

```cron
# Backup روزانه در ساعت 2 صبح
0 2 * * * /home/user/backup-tax-calculator.sh >> /home/user/backups/backup.log 2>&1

# Backup هفتگی یکشنبه‌ها ساعت 3 صبح
0 3 * * 0 /home/user/backup-tax-calculator.sh >> /home/user/backups/backup-weekly.log 2>&1
```

### 3. Backup روی سرویس‌های ابری

#### با rclone (Google Drive, Dropbox, etc.)

```bash
# نصب rclone
curl https://rclone.org/install.sh | sudo bash

# پیکربندی
rclone config

# افزودن به اسکریپت backup
rclone copy $BACKUP_DIR remote:tax-calculator-backups/
```

---

## 🔄 بروزرسانی و نگهداری

### 1. بروزرسانی کد

```bash
cd ~/projects/my_cal

# Pull آخرین تغییرات
git pull origin main

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# بررسی
docker-compose ps
docker-compose logs -f
```

### 2. اسکریپت بروزرسانی اتوماتیک

```bash
vim ~/update-tax-calculator.sh
```

**محتوا:**

```bash
#!/bin/bash

PROJECT_DIR="/home/user/projects/my_cal"

cd $PROJECT_DIR

echo "🔄 Pulling latest changes..."
git pull origin main

echo "🛑 Stopping containers..."
docker-compose down

echo "🔨 Building images..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

echo "✅ Update completed!"

# مشاهده وضعیت
sleep 5
docker-compose ps
```

```bash
chmod +x ~/update-tax-calculator.sh
```

### 3. بروزرسانی Docker Images

```bash
# بروزرسانی base images
docker-compose pull

# Rebuild با images جدید
docker-compose up -d --build
```

---

## 🐛 عیب‌یابی

### مشکلات رایج

#### 1. Container راه‌اندازی نمی‌شود

```bash
# مشاهده لاگ‌ها
docker-compose logs backend
docker-compose logs frontend

# بررسی وضعیت
docker-compose ps

# راه‌اندازی مجدد
docker-compose restart
```

#### 2. نمی‌توانم به سایت دسترسی داشته باشم

```bash
# بررسی firewall
sudo ufw status

# بررسی nginx
sudo systemctl status nginx
sudo nginx -t

# بررسی Docker
docker-compose ps
netstat -tulpn | grep -E '80|443|8000'
```

#### 3. خطای SSL

```bash
# بررسی گواهی
sudo certbot certificates

# تمدید دستی
sudo certbot renew

# بررسی تاریخ انقضا
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -noout -dates
```

#### 4. Database خراب شده

```bash
# بازیابی از backup
cd ~/backups/tax-calculator
tar -xzf tax_calculator_db_YYYYMMDD_HHMMSS.tar.gz

# کپی به container
docker cp tax_calculator_YYYYMMDD_HHMMSS.db tax_calculator_backend:/app/data/tax_calculator.db

# راه‌اندازی مجدد
docker-compose restart backend
```

#### 5. فضای دیسک تمام شده

```bash
# بررسی فضا
df -h

# پاک‌سازی Docker
docker system prune -a --volumes

# حذف لاگ‌های قدیمی
sudo find /var/log -name "*.log" -mtime +30 -delete
```

### دستورات تشخیصی

```bash
# وضعیت کلی سیستم
htop

# استفاده از دیسک
du -sh ~/projects/my_cal/*

# استفاده از Docker
docker system df

# بررسی پورت‌ها
sudo netstat -tulpn | grep LISTEN

# بررسی processes
ps aux | grep -E 'docker|nginx'

# مشاهده اتصالات شبکه
sudo iptables -L -n
```

---

## 📝 Checklist نهایی

قبل از production:

- [ ] Environment variables تنظیم شده
- [ ] SSL/HTTPS نصب و فعال است
- [ ] Firewall پیکربندی شده
- [ ] Backup خودکار تنظیم شده
- [ ] DNS تنظیم و propagate شده
- [ ] Nginx یا reverse proxy پیکربندی شده
- [ ] Health checks کار می‌کنند
- [ ] Logging فعال است
- [ ] Monitoring راه‌اندازی شده
- [ ] تست کامل عملکرد انجام شده
- [ ] مستندات بروز است
- [ ] دسترسی‌های امنیتی بررسی شده

---

## 🆘 منابع و کمک

### لینک‌های مفید

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot](https://certbot.eff.org/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)

### پشتیبانی

در صورت بروز مشکل:
1. لاگ‌ها را بررسی کنید
2. مستندات را مطالعه کنید
3. Issue در GitHub ایجاد کنید

---

**تاریخ آخرین بروزرسانی**: 2026-02-17  
**نسخه**: 1.0.0
