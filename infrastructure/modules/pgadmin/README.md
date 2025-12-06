# pgAdmin ECS Module

This module deploys pgAdmin as an ECS Fargate service with ALB Cognito authentication, providing secure, browser-based database management for developers and data teams.

## Features

✅ **ALB Cognito Authentication** - Protected by Cognito user pool authentication  
✅ **ECS Fargate Deployment** - Serverless container deployment  
✅ **Full Database Management** - View, edit, query all PostgreSQL tables  
✅ **Import/Export Tools** - CSV, SQL dumps, Excel, JSON support  
✅ **Visual Query Builder** - Build queries without writing SQL  
✅ **ERD Diagrams** - Visualize database schema  
✅ **Long Session Support** - 8-hour sessions for large operations  
✅ **Works with ALL Tables** - Prisma AND SQLAlchemy schemas  

## Architecture

```
Developer Browser
  ↓
  → https://db-staging.titanforecast.com
      ↓
      → ALB (port 443) + SSL
          ↓
          → Cognito Authentication (8 hour session)
              ↓
              → ECS Fargate Service (pgAdmin)
                  ↓
                  → RDS Database
```

## Usage

### Initial Setup

1. **Create pgAdmin credentials in Secrets Manager**:
   ```bash
   aws secretsmanager create-secret \
     --name titan-pgadmin/staging/email \
     --secret-string "admin@titanforecast.com" \
     --region us-east-1

   aws secretsmanager create-secret \
     --name titan-pgadmin/staging/password \
     --secret-string "$(openssl rand -base64 32)" \
     --region us-east-1
   ```

2. **Build and push the Docker image**:
   ```bash
   cd /path/to/frontend
   chmod +x scripts/build-pgadmin.sh
   ./scripts/build-pgadmin.sh
   ```

3. **Deploy infrastructure**:
   ```bash
   cd infrastructure
   terraform init
   terraform plan
   terraform apply
   ```

### Accessing pgAdmin

1. Navigate to: **https://db-staging.titanforecast.com**
2. **Authenticate with Cognito** (your TitanForecast credentials)
3. **Log into pgAdmin** with credentials from Secrets Manager:
   ```bash
   # Get pgAdmin credentials
   aws secretsmanager get-secret-value \
     --secret-id titan-pgadmin/staging/email \
     --query SecretString --output text
   
   aws secretsmanager get-secret-value \
     --secret-id titan-pgadmin/staging/password \
     --query SecretString --output text
   ```

4. **Add server connection** in pgAdmin:
   - Right-click "Servers" → "Register" → "Server"
   - General tab: Name = "Titan Staging"
   - Connection tab:
     - Host: Get from `titan-database/staging/host` secret
     - Port: 5432
     - Database: Get from `titan-database/staging/name` secret
     - Username: Get from `titan-database/staging/username` secret
     - Password: Get from `titan-database/staging/password` secret
     - Save password: Yes

### Common Operations

#### **Import CSV Data**
1. Right-click table → "Import/Export Data"
2. Choose CSV file (up to 50MB recommended)
3. Configure columns and options
4. Execute

#### **Export Table to CSV**
1. Right-click table → "Import/Export Data"
2. Select "Export"
3. Choose format (CSV, Excel, JSON)
4. Download

#### **Run SQL Queries**
1. Select database
2. Tools → "Query Tool"
3. Write SQL
4. Execute (F5)
5. Export results if needed

#### **Create Database Dump**
1. Right-click database → "Backup"
2. Choose format (Plain SQL or Custom)
3. Select objects to include
4. Download dump file

#### **Large Import (> 50MB)**

For files larger than 50MB, use ECS Exec:

```bash
# Get task ID
TASK_ID=$(aws ecs list-tasks \
  --cluster titan-cluster \
  --service-name titan-pgadmin-staging \
  --query 'taskArns[0]' \
  --output text | cut -d'/' -f3)

# Connect to container
aws ecs execute-command \
  --cluster titan-cluster \
  --task $TASK_ID \
  --container titan-pgadmin-staging \
  --interactive \
  --command "/bin/bash"

# Inside container, use psql
psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -f /path/to/large.sql
```

### Disabling/Enabling pgAdmin

**To disable (saves costs)**:
```bash
aws ecs update-service \
  --cluster titan-cluster \
  --service titan-pgadmin-staging \
  --desired-count 0
```

**To enable**:
```bash
aws ecs update-service \
  --cluster titan-cluster \
  --service titan-pgadmin-staging \
  --desired-count 1
```

## Timeout Considerations

### ALB Timeout: 60 seconds
- **Affects**: Large file uploads via web UI
- **Solution**: Use chunked imports or ECS Exec for files > 50MB

### Session Timeout: 8 hours
- **Configured for**: Long-running operations
- **Good for**: Large exports, complex queries, bulk operations

### Browser Timeout: None
- pgAdmin runs operations server-side
- Browser just shows progress/results
- Safe to leave running in background

## Module Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| project_name | Name of the project | string | - | yes |
| environment | Environment (staging/production) | string | - | yes |
| vpc_id | ID of the VPC | string | - | yes |
| domain_name | Domain name for pgAdmin | string | - | yes |
| cognito_user_pool_arn | ARN of Cognito user pool | string | - | yes |
| cognito_client_id | Cognito client ID | string | - | yes |
| cognito_user_pool_domain | Cognito domain | string | - | yes |
| pgadmin_email_secret_arn | ARN of pgAdmin email secret | string | - | yes |
| pgadmin_password_secret_arn | ARN of pgAdmin password secret | string | - | yes |
| database_secrets | Database connection secrets | list(object) | - | yes |
| cpu | CPU units | number | 512 | no |
| memory | Memory in MB | number | 1024 | no |
| desired_count | Number of tasks | number | 1 | no |
| image_tag | Docker image tag | string | "latest" | no |

## Module Outputs

| Name | Description |
|------|-------------|
| ecr_repository_url | URL of the pgAdmin ECR repository |
| service_name | Name of the pgAdmin ECS service |
| url | URL to access pgAdmin |

## Security

### Authentication Layers
1. **HTTPS/TLS** - All traffic encrypted via ALB
2. **Cognito Authentication** - AWS-managed user authentication
3. **pgAdmin Login** - Additional application-level authentication
4. **VPC Security Groups** - Network isolation
5. **CloudWatch Logs** - Full audit trail

### Network Security
- pgAdmin runs in private subnets (no public IP)
- Only accepts traffic from ALB
- Can only connect to RDS (minimal outbound access)
- All credentials stored in AWS Secrets Manager

### Access Control
- Cognito authenticates users before ALB forwards traffic
- pgAdmin requires separate login (defense in depth)
- All database credentials injected via Secrets Manager
- No hardcoded passwords

## Performance Recommendations

### Resource Allocation
- **Staging**: 0.5 vCPU, 1 GB RAM (sufficient for < 10 concurrent users)
- **Production**: 1 vCPU, 2 GB RAM (recommended for heavier usage)

### Operation Guidelines
- **CSV Import**: < 50MB via UI, > 50MB via ECS Exec
- **SQL Queries**: No limit, runs server-side
- **Exports**: Any size, processed server-side
- **Concurrent Users**: 5-10 with default resources

## Cost Estimate

**Staging Environment** (~$20-25/month):
- ECS Fargate: 1 task × 0.5 vCPU × 1 GB × 730 hrs = ~$18-22
- CloudWatch Logs: ~$2-3
- Data Transfer: Minimal (internal VPC)

**When Disabled** (desired_count = 0): $0

## Troubleshooting

### Can't Access URL
```bash
# Check DNS
nslookup db-staging.titanforecast.com

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Check ECS service
aws ecs describe-services \
  --cluster titan-cluster \
  --services titan-pgadmin-staging
```

### Container Won't Start
```bash
# Check CloudWatch logs
aws logs tail /ecs/titan-pgadmin-staging --follow

# Common issues:
# - Missing Secrets Manager credentials
# - Invalid PGADMIN_DEFAULT_EMAIL/PASSWORD
# - Security group blocking RDS access
```

### Can't Connect to Database
1. Verify RDS security group allows pgAdmin security group
2. Check database credentials in Secrets Manager
3. Verify database host/port are correct
4. Test connection via ECS Exec:
   ```bash
   psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME
   ```

### Import Timeout
- ALB has 60-second timeout
- For files > 50MB, use ECS Exec method
- Break large files into smaller chunks

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Build pgAdmin Image
  run: ./scripts/build-pgadmin.sh

- name: Update ECS Service
  run: |
    aws ecs update-service \
      --cluster titan-cluster \
      --service titan-pgadmin-staging \
      --force-new-deployment
```

## Related Documentation

- [Main Infrastructure README](../../../../infrastructure/README.md)
- [Cognito Setup](../../../../infrastructure/docs/cognito-authentication-strategy.md)
- [Database Connection Guide](../../../../documentation/database-connection-guide.md)
- [pgAdmin Official Docs](https://www.pgadmin.org/docs/)
