# Database Credentials Setup for ECS Task Definitions

## Overview

This document explains how database credentials are securely injected into ECS task definitions using AWS Secrets Manager.

## Secret Structure

### Staging Environment
```
titan-database/staging/connection-string
titan-database/staging/host
titan-database/staging/port
titan-database/staging/name
titan-database/staging/username
titan-database/staging/password
```

### Production Environment
```
titan-database/production/connection-string
titan-database/production/host
titan-database/production/port
titan-database/production/name
titan-database/production/username
titan-database/production/password
```

## Environment Variables

The following environment variables will be available in the container:

- `DATABASE_URL` - Complete connection string
- `DATABASE_HOST` - Database hostname
- `DATABASE_PORT` - Database port
- `DATABASE_NAME` - Database name
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password

## Setup Instructions

### 1. Create Secrets in AWS Secrets Manager

#### For Staging:
```bash
aws secretsmanager create-secret \
  --name "titan-database/staging/connection-string" \
  --description "Staging database connection string" \
  --secret-string "postgresql://username:password@host:port/database"

aws secretsmanager create-secret \
  --name "titan-database/staging/host" \
  --description "Staging database host" \
  --secret-string "your-staging-db-host.amazonaws.com"

aws secretsmanager create-secret \
  --name "titan-database/staging/port" \
  --description "Staging database port" \
  --secret-string "5432"

aws secretsmanager create-secret \
  --name "titan-database/staging/name" \
  --description "Staging database name" \
  --secret-string "titan_staging"

aws secretsmanager create-secret \
  --name "titan-database/staging/username" \
  --description "Staging database username" \
  --secret-string "titan_user"

aws secretsmanager create-secret \
  --name "titan-database/staging/password" \
  --description "Staging database password" \
  --secret-string "your-secure-password"
```

#### For Production:
```bash
aws secretsmanager create-secret \
  --name "titan-database/production/connection-string" \
  --description "Production database connection string" \
  --secret-string "postgresql://username:password@host:port/database"

aws secretsmanager create-secret \
  --name "titan-database/production/host" \
  --description "Production database host" \
  --secret-string "your-production-db-host.amazonaws.com"

aws secretsmanager create-secret \
  --name "titan-database/production/port" \
  --description "Production database port" \
  --secret-string "5432"

aws secretsmanager create-secret \
  --name "titan-database/production/name" \
  --description "Production database name" \
  --secret-string "titan_production"

aws secretsmanager create-secret \
  --name "titan-database/production/username" \
  --description "Production database username" \
  --secret-string "titan_user"

aws secretsmanager create-secret \
  --name "titan-database/production/password" \
  --description "Production database password" \
  --secret-string "your-secure-password"
```

### 2. Update IAM Permissions

Ensure the ECS execution role has permissions to read these secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:183300739967:secret:titan-database/staging/*",
        "arn:aws:secretsmanager:us-east-1:183300739967:secret:titan-database/production/*"
      ]
    }
  ]
}
```

### 3. Deploy Updated Task Definitions

The task definitions have been updated to include the secrets. Deploy them using:

```bash
# For staging
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/ecs-task-definition-staging.json

# For production
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/ecs-task-definition.json
```

## Usage in Application

### Node.js/Next.js Example

```typescript
// Access database credentials
const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  url: process.env.DATABASE_URL
};

// Or use the connection string directly
const connectionString = process.env.DATABASE_URL;
```

### Prisma Example

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Security Benefits

1. **No hardcoded credentials** in task definitions
2. **Encrypted at rest** using AWS KMS
3. **Encrypted in transit** during secret retrieval
4. **Access controlled** via IAM policies
5. **Audit trail** of secret access
6. **Automatic rotation** support (if configured)

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check IAM role has `secretsmanager:GetSecretValue` permission
2. **Secret Not Found**: Verify secret names match exactly
3. **Invalid ARN**: Ensure account ID and region are correct
4. **Task Fails to Start**: Check CloudWatch logs for secret retrieval errors

### Verification

To verify secrets are being injected correctly:

```bash
# Check task definition
aws ecs describe-task-definition --task-definition titan-frontend-staging

# Check running task environment
aws ecs describe-tasks --cluster titan-cluster --tasks <task-arn>
```

## Notes

- Secrets are injected at container startup
- Environment variables are only available inside the container
- Secrets are not visible in ECS console or logs
- Use separate secrets for staging and production
- Consider using secret rotation for enhanced security
