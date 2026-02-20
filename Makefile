# Makefile for MyCalc Application
.PHONY: help build up down clean logs restart rebuild dev prod

# Default target
help:
	@echo "MyCalc Application Management"
	@echo "============================="
	@echo "Production Commands:"
	@echo "  make prod        - Start production environment"
	@echo "  make build       - Build production images"
	@echo "  make restart     - Restart production services"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev         - Start development environment"
	@echo "  make dev-build   - Build development images"
	@echo ""
	@echo "Management Commands:"
	@echo "  make down        - Stop all services"
	@echo "  make clean       - Clean up containers and volumes"
	@echo "  make logs        - Show logs"
	@echo "  make rebuild     - Rebuild and restart everything"
	@echo ""
	@echo "Database Commands:"
	@echo "  make db-shell    - Access database shell"
	@echo "  make db-backup   - Backup database"
	@echo "  make db-restore  - Restore database"

# Production Environment
prod: build
	@echo "🚀 Starting production environment..."
	docker-compose up -d
	@echo "✅ Production environment started!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:8000"
	@echo "Database: localhost:5432"

build:
	@echo "🏗️ Building production images..."
	docker-compose build

# Development Environment
dev:
	@echo "🔧 Starting development environment..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "Frontend: http://localhost:3001"
	@echo "Backend API: http://localhost:8001"
	@echo "Database: localhost:5433"

dev-build:
	@echo "🏗️ Building development images..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml build

# Management Commands
up:
	docker-compose up -d

down:
	@echo "🛑 Stopping all services..."
	docker-compose down
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

clean: down
	@echo "🧹 Cleaning up containers, networks, and volumes..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

logs:
	docker-compose logs -f

restart:
	@echo "🔄 Restarting services..."
	docker-compose restart

rebuild: clean build prod
	@echo "🔄 Rebuild complete!"

# Database Commands
db-shell:
	@echo "🗄️ Opening database shell..."
	docker-compose exec db psql -U mycal_user -d mycal_db

db-backup:
	@echo "💾 Creating database backup..."
	docker-compose exec db pg_dump -U mycal_user mycal_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created: backup_$(shell date +%Y%m%d_%H%M%S).sql"

db-restore:
	@echo "📥 Restoring database..."
	@echo "Usage: make db-restore FILE=backup_file.sql"
	@if [ -z "$(FILE)" ]; then echo "❌ Please specify FILE=backup_file.sql"; exit 1; fi
	docker-compose exec -T db psql -U mycal_user -d mycal_db < $(FILE)

# Health checks
health:
	@echo "🏥 Checking service health..."
	@echo "Backend Health:"
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "❌ Backend not responding"
	@echo "\nFrontend Health:"
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost || echo "❌ Frontend not responding"

# Show running containers
status:
	@echo "📊 Service Status:"
	docker-compose ps