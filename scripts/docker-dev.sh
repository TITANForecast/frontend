#!/bin/bash

# TITAN Forecast Platform - Docker Development Environment Manager
# This script provides easy commands to manage the local development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.dev.yml"
PROJECT_NAME="titan-dev"

# Help function
show_help() {
    echo -e "${BLUE}TITAN Forecast Platform - Docker Development Environment${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  logs        Show logs for all services"
    echo "  status      Show status of all services"
    echo "  clean       Stop services and remove volumes"
    echo "  fresh       Clean and start fresh"
    echo "  shell       Open shell in specific service"
    echo "  db          Connect to PostgreSQL database"
    echo "  redis       Connect to Redis"
    echo "  health      Check health of all services"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 logs frontend           # Show frontend logs"
    echo "  $0 shell frontend          # Open shell in frontend container"
    echo "  $0 db                      # Connect to database"
    echo "  $0 clean                   # Clean everything and start fresh"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
        exit 1
    fi
}

# Start services
start_services() {
    echo -e "${BLUE}🚀 Starting TITAN development environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    echo -e "${GREEN}✅ All services started successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Service URLs:${NC}"
    echo "  Frontend:    http://localhost:3000"
    echo "  pgAdmin:     http://localhost:5050"
    echo "  RedisInsight: http://localhost:8001"
    echo ""
    echo -e "${YELLOW}🔑 Database Access:${NC}"
    echo "  Host: localhost:5432"
    echo "  Database: titan_dev"
    echo "  Username: titan_admin"
    echo "  Password: dev_password_123"
}

# Stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping TITAN development environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    echo -e "${GREEN}✅ All services stopped successfully!${NC}"
}

# Restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting TITAN development environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME restart
    echo -e "${GREEN}✅ All services restarted successfully!${NC}"
}

# Show logs
show_logs() {
    if [ -n "$2" ]; then
        echo -e "${BLUE}📋 Showing logs for $2...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f "$2"
    else
        echo -e "${BLUE}📋 Showing logs for all services...${NC}"
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
    fi
}

# Show status
show_status() {
    echo -e "${BLUE}📊 Service Status:${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
    echo ""
    echo -e "${BLUE}💾 Volume Status:${NC}"
    docker volume ls | grep $PROJECT_NAME || echo "No volumes found"
}

# Clean environment
clean_environment() {
    echo -e "${YELLOW}🧹 Cleaning TITAN development environment...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v
    echo -e "${GREEN}✅ Environment cleaned successfully!${NC}"
}

# Fresh start
fresh_start() {
    echo -e "${YELLOW}🔄 Starting fresh TITAN development environment...${NC}"
    clean_environment
    start_services
}

# Open shell in service
open_shell() {
    if [ -z "$2" ]; then
        echo -e "${RED}❌ Please specify a service name${NC}"
        echo "Available services: frontend, postgres, redis, pgadmin, redis-insight"
        exit 1
    fi
    
    echo -e "${BLUE}🐚 Opening shell in $2...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec "$2" /bin/sh
}

# Connect to database
connect_db() {
    echo -e "${BLUE}🗄️  Connecting to PostgreSQL database...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec postgres psql -U titan_admin -d titan_dev
}

# Connect to Redis
connect_redis() {
    echo -e "${BLUE}🔴 Connecting to Redis...${NC}"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec redis redis-cli
}

# Check health
check_health() {
    echo -e "${BLUE}🏥 Checking service health...${NC}"
    
    # Check if services are running
    if ! docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps | grep -q "Up"; then
        echo -e "${RED}❌ No services are running${NC}"
        return 1
    fi
    
    # Check database
    if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec postgres pg_isready -U titan_admin > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database: Healthy${NC}"
    else
        echo -e "${RED}❌ Database: Unhealthy${NC}"
    fi
    
    # Check Redis
    if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis: Healthy${NC}"
    else
        echo -e "${RED}❌ Redis: Unhealthy${NC}"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: Healthy${NC}"
    else
        echo -e "${RED}❌ Frontend: Unhealthy${NC}"
    fi
    
}

# Main script logic
main() {
    check_docker
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs "$@"
            ;;
        status)
            show_status
            ;;
        clean)
            clean_environment
            ;;
        fresh)
            fresh_start
            ;;
        shell)
            open_shell "$@"
            ;;
        db)
            connect_db
            ;;
        redis)
            connect_redis
            ;;
        health)
            check_health
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
