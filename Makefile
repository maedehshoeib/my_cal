# =====================================
# Makefile - Tax Calculator Docker Commands
# =====================================

.PHONY: help build up down restart logs clean rebuild dev prod backup

# ==================== Help ====================
help: ## نمایش راهنما
	@echo "📋 دستورات موجود:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==================== Build ====================
build: ## ساخت تمام image ها
	@echo "🔨 در حال ساخت Docker images..."
	docker-compose build

build-no-cache: ## ساخت بدون استفاده از cache
	@echo "🔨 در حال ساخت Docker images (بدون cache)..."
	docker-compose build --no-cache

# ==================== Run ====================
up: ## اجرای تمام سرویس‌ها
	@echo "🚀 در حال اجرای سرویس‌ها..."
	docker-compose up -d
	@echo "✅ سرویس‌ها در حال اجرا هستند:"
	@echo "   Frontend: http://localhost"
	@echo "   Backend:  http://localhost:8000"

dev: ## اجرای سرویس‌ها در حالت development
	@echo "🔧 اجرای در حالت development..."
	docker-compose up

down: ## توقف تمام سرویس‌ها
	@echo "⏹️  در حال توقف سرویس‌ها..."
	docker-compose down

restart: ## راه‌اندازی مجدد سرویس‌ها
	@echo "🔄 راه‌اندازی مجدد..."
	docker-compose restart

# ==================== Logs ====================
logs: ## نمایش لاگ‌های تمام سرویس‌ها
	docker-compose logs -f

logs-backend: ## نمایش لاگ‌های backend
	docker-compose logs -f backend

logs-frontend: ## نمایش لاگ‌های frontend
	docker-compose logs -f frontend

# ==================== Status ====================
ps: ## نمایش وضعیت سرویس‌ها
	docker-compose ps

health: ## بررسی سلامت سرویس‌ها
	@echo "🏥 بررسی وضعیت سرویس‌ها..."
	@docker ps --filter "name=tax_calculator" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ==================== Database ====================
db-backup: ## پشتیبان‌گیری از دیتابیس
	@echo "💾 پشتیبان‌گیری از دیتابیس..."
	@mkdir -p ./backups
	@docker exec tax_calculator_backend python -c "from backend.database import DatabaseManager; db = DatabaseManager(); db.create_backup('./data/backups')"
	@echo "✅ پشتیبان‌گیری انجام شد"

db-shell: ## دسترسی به SQLite shell
	docker exec -it tax_calculator_backend sqlite3 /app/data/tax_calculator.db

# ==================== Clean ====================
clean: ## پاک کردن containers و networks
	@echo "🧹 در حال پاک‌سازی..."
	docker-compose down -v
	@echo "✅ پاک‌سازی انجام شد"

clean-all: ## پاک کردن همه چیز (containers, images, volumes)
	@echo "🗑️  در حال حذف همه چیز..."
	docker-compose down -v --rmi all
	docker system prune -f
	@echo "✅ همه چیز پاک شد"

# ==================== Rebuild ====================
rebuild: ## rebuild کامل (clean + build + up)
	@echo "🔄 Rebuild کامل..."
	make down
	make build-no-cache
	make up

# ==================== Shell Access ====================
shell-backend: ## دسترسی به shell backend
	docker exec -it tax_calculator_backend /bin/sh

shell-frontend: ## دسترسی به shell frontend
	docker exec -it tax_calculator_frontend /bin/sh

# ==================== Development ====================
install-deps: ## نصب dependencies در local
	@echo "📦 نصب Python dependencies..."
	pip install -r requirements.txt
	@echo "📦 نصب Node dependencies..."
	cd frontend && npm install

test-backend: ## اجرای تست‌های backend
	docker exec tax_calculator_backend python -m pytest

# ==================== Production ====================
prod: build up ## اجرای production (build + up)

deploy: ## آماده‌سازی برای deploy
	@echo "🚢 آماده‌سازی برای deploy..."
	make clean
	make build-no-cache
	@echo "✅ آماده برای deploy"

# ==================== Monitoring ====================
stats: ## نمایش آمار مصرف منابع
	docker stats tax_calculator_backend tax_calculator_frontend

inspect-backend: ## بررسی جزئیات backend container
	docker inspect tax_calculator_backend

inspect-frontend: ## بررسی جزئیات frontend container
	docker inspect tax_calculator_frontend

# ==================== Network ====================
network-inspect: ## بررسی شبکه
	docker network inspect tax_calculator_network

# ==================== Default ====================
.DEFAULT_GOAL := help
