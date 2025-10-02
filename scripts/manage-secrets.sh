#!/bin/bash

# Secrets management script for TITAN Frontend
# Usage: ./scripts/manage-secrets.sh [get|set|update] [environment]

set -e

# Default values
ACTION=${1:-get}
ENVIRONMENT=${2:-production}
SECRET_NAME="titan-frontend/${ENVIRONMENT}/config"
AWS_REGION="us-east-1"

# Validate environment
if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    echo -e "${RED}❌ Invalid environment. Must be 'production' or 'staging'${NC}"
    echo "Usage: $0 [get|set|update] [environment]"
    echo "Example: $0 get staging"
    echo "Example: $0 set production"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 TITAN Frontend Secrets Manager${NC}"
echo "Action: $ACTION"
echo "Environment: $ENVIRONMENT"
echo "Secret Name: $SECRET_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed (required for JSON parsing)${NC}"
    exit 1
fi

case $ACTION in
    "get")
        echo -e "${YELLOW}📖 Retrieving secrets...${NC}"
        if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
            SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'SecretString' --output text)
            echo -e "${GREEN}✅ Secrets retrieved successfully:${NC}"
            echo "$SECRET_VALUE" | jq .
        else
            echo -e "${RED}❌ Secret not found: $SECRET_NAME${NC}"
            exit 1
        fi
        ;;
    
    "set")
        echo -e "${YELLOW}📝 Setting secrets...${NC}"
        echo "Please provide the following values:"
        echo ""
        
        read -p "AWS Region (default: us-east-1): " AWS_REGION_INPUT
        AWS_REGION_INPUT=${AWS_REGION_INPUT:-us-east-1}
        
        read -p "Cognito User Pool ID: " COGNITO_USER_POOL_ID
        read -p "Cognito Client ID: " COGNITO_CLIENT_ID
        read -p "Application URL (e.g., https://app.titanforecast.com): " APP_URL
        
        SECRET_JSON=$(jq -n \
            --arg region "$AWS_REGION_INPUT" \
            --arg user_pool_id "$COGNITO_USER_POOL_ID" \
            --arg client_id "$COGNITO_CLIENT_ID" \
            --arg app_url "$APP_URL" \
            '{
                NEXT_PUBLIC_AWS_REGION: $region,
                NEXT_PUBLIC_COGNITO_USER_POOL_ID: $user_pool_id,
                NEXT_PUBLIC_COGNITO_CLIENT_ID: $client_id,
                NEXT_PUBLIC_APP_URL: $app_url
            }')
        
        if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
            echo -e "${YELLOW}⚠️  Secret already exists. Updating...${NC}"
            aws secretsmanager update-secret --secret-id "$SECRET_NAME" --secret-string "$SECRET_JSON" --region "$AWS_REGION"
        else
            echo -e "${YELLOW}📝 Creating new secret...${NC}"
            aws secretsmanager create-secret --name "$SECRET_NAME" --description "Frontend application configuration secrets" --secret-string "$SECRET_JSON" --region "$AWS_REGION"
        fi
        
        echo -e "${GREEN}✅ Secrets set successfully!${NC}"
        ;;
    
    "update")
        echo -e "${YELLOW}🔄 Updating secrets...${NC}"
        if ! aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region "$AWS_REGION" &> /dev/null; then
            echo -e "${RED}❌ Secret not found: $SECRET_NAME${NC}"
            echo "Use 'set' action to create the secret first."
            exit 1
        fi
        
        CURRENT_SECRET=$(aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" --query 'SecretString' --output text)
        echo -e "${BLUE}Current secrets:${NC}"
        echo "$CURRENT_SECRET" | jq .
        echo ""
        
        echo "Enter new values (press Enter to keep current value):"
        
        CURRENT_REGION=$(echo "$CURRENT_SECRET" | jq -r '.NEXT_PUBLIC_AWS_REGION')
        CURRENT_USER_POOL_ID=$(echo "$CURRENT_SECRET" | jq -r '.NEXT_PUBLIC_COGNITO_USER_POOL_ID')
        CURRENT_CLIENT_ID=$(echo "$CURRENT_SECRET" | jq -r '.NEXT_PUBLIC_COGNITO_CLIENT_ID')
        CURRENT_APP_URL=$(echo "$CURRENT_SECRET" | jq -r '.NEXT_PUBLIC_APP_URL')
        
        read -p "AWS Region (current: $CURRENT_REGION): " AWS_REGION_INPUT
        AWS_REGION_INPUT=${AWS_REGION_INPUT:-$CURRENT_REGION}
        
        read -p "Cognito User Pool ID (current: $CURRENT_USER_POOL_ID): " COGNITO_USER_POOL_ID
        COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID:-$CURRENT_USER_POOL_ID}
        
        read -p "Cognito Client ID (current: $CURRENT_CLIENT_ID): " COGNITO_CLIENT_ID
        COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID:-$CURRENT_CLIENT_ID}
        
        read -p "Application URL (current: $CURRENT_APP_URL): " APP_URL
        APP_URL=${APP_URL:-$CURRENT_APP_URL}
        
        SECRET_JSON=$(jq -n \
            --arg region "$AWS_REGION_INPUT" \
            --arg user_pool_id "$COGNITO_USER_POOL_ID" \
            --arg client_id "$COGNITO_CLIENT_ID" \
            --arg app_url "$APP_URL" \
            '{
                NEXT_PUBLIC_AWS_REGION: $region,
                NEXT_PUBLIC_COGNITO_USER_POOL_ID: $user_pool_id,
                NEXT_PUBLIC_COGNITO_CLIENT_ID: $client_id,
                NEXT_PUBLIC_APP_URL: $app_url
            }')
        
        aws secretsmanager update-secret --secret-id "$SECRET_NAME" --secret-string "$SECRET_JSON" --region "$AWS_REGION"
        echo -e "${GREEN}✅ Secrets updated successfully!${NC}"
        ;;
    
    *)
        echo -e "${RED}❌ Invalid action: $ACTION${NC}"
        echo "Usage: $0 [get|set|update] [environment]"
        echo ""
        echo "Actions:"
        echo "  get    - Retrieve and display current secrets"
        echo "  set    - Create new secrets (interactive)"
        echo "  update - Update existing secrets (interactive)"
        echo ""
        echo "Examples:"
        echo "  $0 get production"
        echo "  $0 set staging"
        echo "  $0 update production"
        exit 1
        ;;
esac
