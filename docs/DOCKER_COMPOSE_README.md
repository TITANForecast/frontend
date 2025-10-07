# TITAN Forecast Platform - Docker Compose Development Environment

## Overview

This Docker Compose setup simulates the core TITAN Forecast Platform infrastructure for local development, including:

- **PostgreSQL Database** (simulating RDS)
- **Redis Cache** (simulating ElastiCache)
- **Frontend** (Next.js application)
- **Database Admin** (pgAdmin)
- **Redis Admin** (RedisInsight)

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Docker Compose v3.8+
- At least 4GB RAM available for Docker

### 1. Start All Services

```bash
# From the frontend directory
cd /Users/jaylong/Web/Titan/frontend

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f
```

### 2. Access the Applications

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js application |
| **pgAdmin** | http://localhost:5050 | Database administration |
| **RedisInsight** | http://localhost:8001 | Redis administration |

### 3. Database Access

**Direct PostgreSQL Connection:**
```bash
# Connect to database
docker exec -it titan-postgres-dev psql -U titan_admin -d titan_dev

# Or from host machine
psql -h localhost -p 5432 -U titan_admin -d titan_dev
```

**pgAdmin Access:**
- URL: http://localhost:5050
- Email: admin@titan.com
- Password: admin123

**Add Server in pgAdmin:**
- Host: postgres (or localhost from host)
- Port: 5432
- Database: titan_dev
- Username: titan_admin
- Password: dev_password_123

### 4. Redis Access

**Direct Redis Connection:**
```bash
# Connect to Redis
docker exec -it titan-redis-dev redis-cli

# Or from host machine
redis-cli -h localhost -p 6379
```

**RedisInsight Access:**
- URL: http://localhost:8001
- Add connection: localhost:6379

## Service Details

### Database (PostgreSQL)

**Configuration:**
- **Image**: postgres:15.12 (matching RDS version)
- **Database**: titan_dev
- **Username**: titan_admin
- **Password**: dev_password_123
- **Port**: 5432

**Features:**
- ✅ Initialized with complete schema
- ✅ Sample data for development
- ✅ Multi-tenant structure (auth, core, data schemas)
- ✅ Proper indexes and constraints
- ✅ Auto-updating timestamps

**Schema Structure:**
```
auth/
├── users (Cognito integration)
├── dealers (multi-tenant organizations)
├── user_dealers (user-tenant relationships)
└── user_sessions (session management)

core/
└── subscriptions (billing and plans)

data/
├── repair_orders (RO data)
├── operations (operation lines)
├── parts (parts data)
└── labor (labor entries)
```

### Cache (Redis)

**Configuration:**
- **Image**: redis:7.0-alpine (matching ElastiCache version)
- **Port**: 6379
- **Persistence**: AOF enabled

**Features:**
- ✅ Session storage
- ✅ Caching layer
- ✅ Message queuing
- ✅ Real-time features


### Frontend (Next.js)

**Configuration:**
- **Port**: 3000
- **Environment**: development
- **Hot Reload**: enabled

**Features:**
- ✅ Multi-tenant UI
- ✅ Authentication
- ✅ Real-time updates
- ✅ API integration

## Environment Variables

### Database Connection

All services have access to these environment variables:

```bash
DATABASE_URL=postgresql://titan_admin:dev_password_123@postgres:5432/titan_dev
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=titan_dev
DATABASE_USERNAME=titan_admin
DATABASE_PASSWORD=dev_password_123
```

### Redis Connection

```bash
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
```


## Development Workflow

### 1. Making Changes

**Frontend Changes:**
```bash
# Edit files in /Users/jaylong/Web/Titan/frontend
# Changes are automatically reflected (hot reload)
```


### 2. Database Changes

**Schema Updates:**
```bash
# Edit infrastructure/init-db.sql
# Recreate database
docker-compose -f docker-compose.dev.yml down
docker volume rm frontend_postgres_data
docker-compose -f docker-compose.dev.yml up -d
```

**Data Seeding:**
```bash
# Connect to database and run SQL
docker exec -it titan-postgres-dev psql -U titan_admin -d titan_dev
```

### 3. Service Management

**Restart Specific Service:**
```bash
docker-compose -f docker-compose.dev.yml restart frontend
docker-compose -f docker-compose.dev.yml restart postgres
docker-compose -f docker-compose.dev.yml restart redis
```

**View Service Logs:**
```bash
docker-compose -f docker-compose.dev.yml logs frontend
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs redis
```

**Stop All Services:**
```bash
docker-compose -f docker-compose.dev.yml down
```

**Stop and Remove Volumes:**
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Troubleshooting

### Common Issues

**1. Port Conflicts:**
```bash
# Check if ports are in use
lsof -i :3000
lsof -i :5432
lsof -i :6379
lsof -i :5050
lsof -i :8001

# Stop conflicting services or change ports in docker-compose.dev.yml
```

**2. Database Connection Issues:**
```bash
# Check database health
docker-compose -f docker-compose.dev.yml ps postgres

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Test connection
docker exec -it titan-postgres-dev pg_isready -U titan_admin
```

**3. Service Startup Issues:**
```bash
# Check all service status
docker-compose -f docker-compose.dev.yml ps

# View all logs
docker-compose -f docker-compose.dev.yml logs

# Restart specific service
docker-compose -f docker-compose.dev.yml restart <service-name>
```

**4. Volume Issues:**
```bash
# Remove all volumes and start fresh
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Performance Optimization

**1. Resource Limits:**
```yaml
# Add to services in docker-compose.dev.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

**2. Database Optimization:**
```bash
# Increase shared_buffers in PostgreSQL
# Edit postgres configuration or use environment variables
```

## Production Differences

This development environment differs from production in several ways:

| Aspect | Development | Production |
|--------|-------------|------------|
| **Database** | Local PostgreSQL | AWS RDS |
| **Cache** | Local Redis | AWS ElastiCache |
| **Authentication** | Mock data | AWS Cognito |
| **Secrets** | Environment variables | AWS Secrets Manager |
| **SSL** | HTTP | HTTPS |
| **Scaling** | Single instance | Auto-scaling |
| **Monitoring** | Basic logs | CloudWatch |

## Next Steps

1. **Test Multi-Tenant Features**: Use the sample data to test dealer switching
2. **Frontend Development**: Build out the Next.js application features
3. **Database Schema**: Extend the schema as needed for your use case
4. **Integration Testing**: Test the complete flow from frontend to database
5. **Performance Testing**: Load test the local environment

## Support

For issues or questions:
1. Check the logs: `docker-compose -f docker-compose.dev.yml logs`
2. Verify service health: `docker-compose -f docker-compose.dev.yml ps`
3. Test database connectivity: `docker exec -it titan-postgres-dev psql -U titan_admin -d titan_dev`
4. Review this documentation for common solutions
