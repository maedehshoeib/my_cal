# Production Deployment Guide

## 🚀 Quick Production Setup

### Option 1: Automated Deployment (Recommended)

```bash
./deploy.sh
```

The deployment script will:
1. Check system requirements
2. Verify Docker installation
3. Set up environment variables
4. Build Docker images
5. Start all services
6. Perform health checks

### Option 2: Manual Deployment

```bash
# 1. Build images
make build

# 2. Start production environment
make prod

# 3. Check health
make health
```

## 🔧 Environment Configuration

### Production Environment Variables

Copy and customize the production environment file:

```bash
cp .env.production .env
```

**Important:** Update these values for production:

```bash
# Database (Change password!)
DATABASE_URL=postgresql://mycal_user:CHANGE_PASSWORD@db:5432/mycal_db

# Security (Generate strong secret!)
SECRET_KEY=your-super-secret-key-change-this

# CORS (Add your domains)
ALLOWED_ORIGINS=http://yourdomain.com,https://yourdomain.com
```

## 🗄️ Database Setup

### Automatic Setup
The database is automatically initialized when starting the application.

### Manual Database Operations

```bash
# Access database shell
make db-shell

# Create backup
make db-backup

# Restore from backup
make db-restore FILE=backup_20240220_120000.sql
```

### Database Configuration

- **Engine**: PostgreSQL 15
- **Default DB**: `mycal_db`
- **Default User**: `mycal_user`
- **Port**: 5432
- **Volume**: Persistent storage in `postgres_data`

## 🔒 Security Checklist

### Pre-Production Security

- [ ] Change default database password
- [ ] Set strong SECRET_KEY
- [ ] Configure proper CORS origins
- [ ] Review firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (if needed)

### Environment Security

```bash
# Generate secure password
openssl rand -base64 32

# Generate secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 🌐 Reverse Proxy Setup (Optional)

### Nginx Reverse Proxy

Create `/etc/nginx/sites-available/mycal`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring and Maintenance

### Health Monitoring

```bash
# Check service status
make status

# View real-time logs
make logs

# Health check
make health
```

### Log Management

```bash
# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db

# Follow logs
docker-compose logs -f backend
```

### Resource Monitoring

```bash
# Check container resource usage
docker stats

# Check system resources
htop
df -h
free -h
```

## 🔄 Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
make rebuild
```

### Database Maintenance

```bash
# Regular backup (daily recommended)
make db-backup

# Vacuum database (monthly recommended)
make db-shell
# Then in PostgreSQL shell:
VACUUM ANALYZE;
```

## 🚨 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :80
   sudo lsof -i :8000
   sudo lsof -i :5432
   
   # Kill process or change port in docker-compose.yml
   ```

2. **Database Connection Failed**
   ```bash
   # Check database logs
   docker-compose logs db
   
   # Verify database is running
   docker-compose ps
   
   # Test database connection
   make db-shell
   ```

3. **Frontend Not Loading**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Verify nginx configuration
   docker-compose exec frontend nginx -t
   ```

4. **Backend API Errors**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Test health endpoint
   curl http://localhost:8000/health
   ```

### Emergency Procedures

**Complete Reset:**
```bash
make clean
make rebuild
```

**Service Recovery:**
```bash
# Restart all services
make restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart db
```

## 📈 Performance Optimization

### Production Optimizations

1. **Database Connection Pooling** - Already configured
2. **Multi-stage Docker Builds** - Already implemented
3. **Nginx Caching** - Can be added to nginx.conf
4. **Container Resource Limits** - Can be added to docker-compose.yml

### Scaling Considerations

```yaml
# Add to docker-compose.yml for scaling
backend:
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '0.50'
        memory: 512M
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] Database credentials changed
- [ ] SSL certificates ready (if needed)
- [ ] Backup strategy planned

### Post-Deployment
- [ ] Health checks passing
- [ ] Frontend accessible
- [ ] API endpoints working
- [ ] Database connected
- [ ] Logs monitoring set up
- [ ] Backup system tested

### Regular Maintenance
- [ ] Weekly log review
- [ ] Monthly database backup
- [ ] Quarterly security review
- [ ] Application updates as needed

## 🆘 Support

For issues and support:
1. Check logs: `make logs`
2. Review this documentation
3. Check GitHub issues
4. Contact the development team

## 📊 Metrics and Analytics

### Application Metrics
- Response times via health check
- Error rates in logs
- Resource usage via docker stats

### Database Metrics
- Connection count
- Query performance
- Storage usage

Monitor these regularly for optimal performance.