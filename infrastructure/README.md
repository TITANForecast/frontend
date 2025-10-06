# TITAN Frontend Infrastructure

This directory contains the Terraform configuration for deploying the TITAN frontend application as a full-stack Next.js application on AWS ECS.

## Architecture

The infrastructure deploys:
- **ECR Repository**: Stores Docker container images for the frontend
- **ECS Task Definition**: Defines how the Next.js application runs
- **ECS Service**: Manages the running tasks in the existing ECS cluster
- **Target Group**: Routes traffic from the existing ALB to the frontend service
- **Auto Scaling**: Automatically scales based on CPU and memory usage
- **CloudWatch Logs**: Centralized logging for the application

**Reuses existing infrastructure:**
- **ECS Cluster**: Uses the existing `titan-cluster`
- **Application Load Balancer**: Uses the existing `titan-alb`
- **VPC and Subnets**: Uses the existing VPC and subnet configuration
- **Security Groups**: Reuses existing ALB security group

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Terraform** installed (>= 1.0)
3. **Existing VPC infrastructure** from the main TITAN infrastructure
4. **Cognito User Pool** from the main TITAN infrastructure

## Setup

1. **Copy the example variables file:**
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **Update `terraform.tfvars`** with your specific values:
   - VPC ID and subnet IDs from your existing infrastructure
   - Cognito User Pool ID and Client ID
   - Domain name (if using custom domain)

3. **Initialize Terraform:**
   ```bash
   terraform init
   ```

4. **Plan the deployment:**
   ```bash
   terraform plan
   ```

5. **Apply the configuration:**
   ```bash
   terraform apply
   ```

## Configuration

### Required Variables

- `ecs_cluster_name`: Name of the existing ECS cluster (default: "titan-cluster")
- `alb_name`: Name of the existing ALB (default: "titan-alb")
- `listener_arn`: ARN of the existing ALB listener
- `cognito_user_pool_id`: Cognito User Pool ID for authentication
- `cognito_client_id`: Cognito Client ID for authentication

### Optional Variables

- `domain_name`: Custom domain name (defaults to ALB DNS name)
- `environment`: Environment name (default: "production")
- `cpu`: CPU units for ECS tasks (default: 512)
- `memory`: Memory for ECS tasks (default: 1024)
- `desired_count`: Initial number of tasks (default: 2)

## Deployment

### Manual Deployment

1. **Build and push Docker image:**
   ```bash
   # Get ECR login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ECR_REPOSITORY_URL>
   
   # Build image
   docker build -t <ECR_REPOSITORY_URL>:latest .
   
   # Push image
   docker push <ECR_REPOSITORY_URL>:latest
   ```

2. **Update ECS service:**
   ```bash
   aws ecs update-service --cluster <CLUSTER_NAME> --service <SERVICE_NAME> --force-new-deployment
   ```

### CI/CD Deployment

The infrastructure is designed to work with GitHub Actions for automated deployments. The ECR repository and ECS service will be created, and you can configure GitHub Actions to:

1. Build Docker images
2. Push to ECR
3. Update ECS service

## Environment Variables

The application expects these environment variables (configured via AWS Secrets Manager):

- `NEXT_PUBLIC_AWS_REGION`: AWS region
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`: Cognito Client ID
- `NEXT_PUBLIC_APP_URL`: Application URL (e.g., https://app.titanforecast.com)

### Secrets Management

All environment variables are stored in AWS Secrets Manager under the secret:
`titan-frontend/production/config`

The ECS execution role has permissions to retrieve these secrets, and they are automatically injected into the container at runtime.

## Monitoring

- **CloudWatch Logs**: Application logs are sent to `/ecs/titan-frontend-production`
- **ECS Service Metrics**: CPU, memory, and task count metrics
- **ALB Metrics**: Request count, response times, and error rates

## Scaling

The infrastructure includes auto-scaling based on:
- **CPU utilization** (target: 70%)
- **Memory utilization** (target: 80%)

Scaling limits:
- **Minimum**: 1 task
- **Maximum**: 10 tasks (configurable)

## Security

- **Security Groups**: Restrictive rules for ALB and ECS tasks
- **IAM Roles**: Least privilege access for ECS execution and task roles
- **SSL/TLS**: HTTPS termination with ACM certificates
- **Private Subnets**: ECS tasks run in private subnets

## Cost Optimization

- **Fargate Spot**: Consider using Fargate Spot for non-production environments
- **Auto Scaling**: Automatically scales down during low usage
- **Log Retention**: CloudWatch logs retained for 30 days

## Troubleshooting

### Common Issues

1. **ECS tasks failing to start:**
   - Check CloudWatch logs
   - Verify security group rules
   - Ensure ECR image exists and is accessible

2. **Load balancer health checks failing:**
   - Verify application is listening on correct port
   - Check health check path is accessible
   - Review security group rules

3. **SSL certificate issues:**
   - Ensure domain is properly configured in Route53
   - Verify certificate validation records

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster <CLUSTER_NAME> --services <SERVICE_NAME>

# View CloudWatch logs
aws logs tail /ecs/titan-frontend-production --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <TARGET_GROUP_ARN>
```

## Next Steps

1. **Configure GitHub Actions** for automated deployments
2. **Set up monitoring alerts** for critical metrics
3. **Implement blue/green deployments** for zero-downtime updates
4. **Add WAF** for additional security
5. **Configure backup strategies** for persistent data
