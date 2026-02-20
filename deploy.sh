#!/bin/bash

# MyCalc Production Deployment Script
# This script sets up the production environment for MyCalc application

set -e  # Exit on any error

echo "🚀 MyCalc Production Deployment"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_status "Docker and Docker Compose are available."
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check available ports
    if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 80 is already in use. Please stop the service or change the port."
    fi
    
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 8000 is already in use. Please stop the service or change the port."
    fi
    
    if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Port 5432 is already in use. This might conflict with the PostgreSQL database."
    fi
}

# Setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file from production template..."
        cp .env.production .env
        print_warning "Please review and update the .env file with your production settings!"
    fi
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    docker-compose build --no-cache
    print_status "Docker images built successfully."
}

# Start services
start_services() {
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    
    # Wait for database
    until docker-compose exec -T db pg_isready -U mycal_user -d mycal_db; do
        echo "Waiting for database..."
        sleep 2
    done
    
    # Wait for backend
    until curl -f http://localhost:8000/health; do
        echo "Waiting for backend..."
        sleep 2
    done
    
    print_status "All services are healthy!"
}

# Show status
show_status() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:8000"
    echo "  API Docs:  http://localhost:8000/docs"
    echo "  Health:    http://localhost:8000/health"
    echo ""
    echo "🗄️  Database:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  User: mycal_user"
    echo "  Database: mycal_db"
    echo ""
    echo "📋 Useful commands:"
    echo "  make logs      - View logs"
    echo "  make status    - Check status"
    echo "  make health    - Health check"
    echo "  make down      - Stop services"
    echo "  make db-shell  - Database shell"
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed!"
        print_status "Cleaning up..."
        docker-compose down
    fi
}

trap cleanup EXIT

# Main execution
main() {
    echo "Starting deployment process..."
    
    check_docker
    check_requirements
    setup_environment
    
    # Ask for confirmation
    read -p "Do you want to continue with the deployment? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    build_images
    start_services
    show_status
}

# Run main function
main "$@"