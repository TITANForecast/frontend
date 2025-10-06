#!/bin/bash

# Docker build script for TITAN Frontend
# Usage: ./scripts/docker-build.sh [tag]

set -e

# Default values
ECR_REGISTRY=""
ECR_REPOSITORY="titan-frontend-production"
IMAGE_TAG=${1:-latest}
AWS_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Building TITAN Frontend Docker Image${NC}"
echo "Repository: $ECR_REPOSITORY"
echo "Tag: $IMAGE_TAG"
echo "Region: $AWS_REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Get ECR registry URL
echo -e "${YELLOW}📡 Getting ECR registry URL...${NC}"
ECR_REGISTRY=$(aws ecr describe-registry --region $AWS_REGION --query 'registryId' --output text).dkr.ecr.$AWS_REGION.amazonaws.com

if [ -z "$ECR_REGISTRY" ]; then
    echo -e "${RED}❌ Failed to get ECR registry URL${NC}"
    exit 1
fi

echo "ECR Registry: $ECR_REGISTRY"

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build the image
echo -e "${YELLOW}🔨 Building Docker image for linux/amd64 platform...${NC}"
docker build --platform linux/amd64 -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .

# Tag as latest if not already
if [ "$IMAGE_TAG" != "latest" ]; then
    docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
fi

# Push the image
echo -e "${YELLOW}📤 Pushing image to ECR...${NC}"
docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

if [ "$IMAGE_TAG" != "latest" ]; then
    docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
fi

echo ""
echo -e "${GREEN}✅ Successfully built and pushed image!${NC}"
echo "Image: $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
echo ""
echo -e "${YELLOW}💡 To deploy to ECS, run:${NC}"
echo "aws ecs update-service --cluster titan-frontend-cluster --service titan-frontend-production --force-new-deployment"
