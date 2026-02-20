# MyCalc - Tax Calculator Application

A production-ready tax calculation application built with FastAPI backend, React frontend, and PostgreSQL database.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   React         │    │   FastAPI       │    │   PostgreSQL    │
│   Frontend      │────│   Backend       │────│   Database      │
│   (Port 80)     │    │   (Port 8000)   │    │   (Port 5432)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Production Deployment

```bash
# Clone the repository
git clone https://github.com/maedehshoeib/my_cal.git
cd my_cal

# Start production environment
make prod

# Or manually:
docker-compose up -d
```

### Development Setup

```bash
# Start development environment
make dev

# Or manually:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 📋 Prerequisites

- Docker 20.10+ 
- Docker Compose 1.27+
- Make (optional, for easier commands)

## 🔧 Configuration

### Environment Variables

Production environment variables are in `.env.production`:

```bash
DATABASE_URL=postgresql://mycal_user:mycal_password@db:5432/mycal_db
ENV=production
ALLOWED_ORIGINS=http://localhost,http://localhost:3000
```

### Database Configuration

- **Database**: PostgreSQL 15
- **User**: `mycal_user`
- **Password**: `mycal_password` (change in production!)
- **Database**: `mycal_db`
- **Port**: `5432`

## 📊 Services

### Frontend (Port 80)
- React application
- Nginx web server
- Production-optimized build

### Backend API (Port 8000)
- FastAPI application
- Health check endpoint: `/health`
- API documentation: `/docs`

### Database (Port 5432)
- PostgreSQL 15
- Persistent data storage
- Automatic health checks

## 🛠️ Management Commands

```bash
# Production
make prod          # Start production environment
make build         # Build production images
make restart       # Restart services

# Development  
make dev           # Start development environment
make dev-build     # Build development images

# Management
make down          # Stop all services
make clean         # Clean up containers and volumes
make logs          # Show logs
make rebuild       # Rebuild everything
make status        # Show service status
make health        # Check service health

# Database
make db-shell      # Access database shell
make db-backup     # Backup database
make db-restore    # Restore database
```

## 🔍 Health Checks

The application includes comprehensive health checks:

- **Backend**: `GET /health`
- **Database**: PostgreSQL connection test
- **Frontend**: HTTP response check

### Check Health Status

```bash
# Using make command
make health

# Manual check
curl http://localhost:8000/health
```

## 📁 Project Structure

```
my_cal/
├── backend/                 # FastAPI backend
│   ├── api.py              # Main API routes
│   ├── calculator.py       # Tax calculation logic
│   ├── database.py         # Database configuration
│   ├── db_models.py        # Database models
│   └── models.py           # Pydantic models
├── frontend/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── ...
│   └── package.json
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development override
├── Dockerfile.backend      # Backend container
├── Dockerfile.frontend     # Frontend container
├── init.sql               # Database initialization
├── requirements.txt       # Python dependencies
├── nginx.conf             # Nginx configuration
└── Makefile              # Management commands
```

## 🔒 Security Features

- Non-root user in containers
- Environment-based configuration
- CORS protection
- Health check endpoints
- Secure database connections

## 📈 Production Considerations

### Performance
- Multi-stage Docker builds
- Connection pooling
- Optimized Nginx configuration
- Health checks for reliability

### Monitoring
- Application logs via `docker-compose logs`
- Health check endpoints
- Database connection monitoring

### Scaling
- Stateless backend design
- Database connection pooling
- Ready for load balancer integration

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check what's using the ports
   sudo netstat -tlnp | grep :80
   sudo netstat -tlnp | grep :8000
   sudo netstat -tlnp | grep :5432
   ```

2. **Database connection issues**
   ```bash
   # Check database health
   make db-shell
   
   # View database logs
   docker-compose logs db
   ```

3. **Container not starting**
   ```bash
   # Check container logs
   make logs
   
   # Check container status
   make status
   ```

### Reset Everything

```bash
# Complete reset
make clean
make rebuild
```

## 📝 API Documentation

Once the application is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Main Endpoints

- `GET /` - Application status
- `GET /health` - Health check
- `POST /api/v1/calculate` - Tax calculation

## 🔄 Development Workflow

1. **Start development environment**
   ```bash
   make dev
   ```

2. **Make changes to code** - Changes are automatically reflected

3. **Test changes**
   ```bash
   # Frontend: http://localhost:3001
   # Backend: http://localhost:8001
   # Database: localhost:5433
   ```

4. **Build for production**
   ```bash
   make build
   make prod
   ```

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- `tax_calculations` - Store calculation history
- `system_settings` - Application configuration
- `audit_logs` - Request audit trail

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `make dev`
5. Build production with `make prod`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.