#!/bin/bash
# Build and Push pgAdmin Docker Image to ECR
# This script builds the pgAdmin container and pushes it to ECR for ECS deployment

set -e

# Configuration
PROJECT_NAME="titan-frontend"
AWS_REGION="us-east-1"
ECR_REPOSITORY="${PROJECT_NAME}-pgadmin"
IMAGE_TAG=${1:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Building and pushing pgAdmin to ECR${NC}"
echo -e "${YELLOW}Repository: ${ECR_REPOSITORY}${NC}"
echo -e "${YELLOW}Tag: ${IMAGE_TAG}${NC}"
echo -e "${YELLOW}Region: ${AWS_REGION}${NC}"
echo ""

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: ${AWS_ACCOUNT_ID}${NC}"

# Get ECR repository URL
ECR_URI=$(aws ecr describe-repositories \
  --repository-names ${ECR_REPOSITORY} \
  --region ${AWS_REGION} \
  --query 'repositories[0].repositoryUri' \
  --output text 2>/dev/null)

if [ -z "$ECR_URI" ] || [ "$ECR_URI" = "None" ]; then
    echo -e "${RED}❌ ECR repository '${ECR_REPOSITORY}' not found${NC}"
    echo -e "${YELLOW}💡 Run 'terraform apply' in infrastructure/ first to create the ECR repository${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found ECR repository: ${ECR_URI}${NC}"

# Login to ECR
echo -e "${BLUE}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build the Docker image for x86_64 (ECS Fargate architecture)
echo -e "${BLUE}🔨 Building pgAdmin Docker image for linux/amd64...${NC}"
docker build \
  --platform linux/amd64 \
  -f Dockerfile.pgadmin \
  -t ${ECR_REPOSITORY}:${IMAGE_TAG} \
  .

# Tag the image for ECR
echo -e "${BLUE}🏷️  Tagging image for ECR...${NC}"
docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URI}:${IMAGE_TAG}

# Push the image to ECR
echo -e "${BLUE}📤 Pushing image to ECR...${NC}"
docker push ${ECR_URI}:${IMAGE_TAG}

echo ""
echo -e "${GREEN}✅ Successfully pushed pgAdmin image!${NC}"
echo -e "${YELLOW}📋 Image details:${NC}"
echo -e "   Repository: ${ECR_URI}"
echo -e "   Tag: ${IMAGE_TAG}"
echo -e "   Region: ${AWS_REGION}"
echo ""
echo -e "${BLUE}🚀 Next steps:${NC}"
echo -e "   1. The image is now available in ECR"
echo -e "   2. ECS will automatically pull this image when the service is deployed"
echo -e "   3. Access pgAdmin at: https://db-staging.titanforecast.com"
echo -e "   4. You'll need to authenticate with Cognito credentials"
echo -e "   5. Then log into pgAdmin with the credentials from Secrets Manager"
echo ""
echo -e "${GREEN}🎉 pgAdmin is ready for deployment!${NC}"

