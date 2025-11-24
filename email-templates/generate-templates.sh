#!/bin/bash

# Generate Cognito email templates for different environments
# Usage: ./generate-templates.sh <environment>
# Example: ./generate-templates.sh staging

ENVIRONMENT=${1:-staging}

case $ENVIRONMENT in
  local)
    APP_DOMAIN="localhost:3000"
    ;;
  staging)
    APP_DOMAIN="app-staging.titanforecast.com"
    ;;
  production)
    APP_DOMAIN="app.titanforecast.com"
    ;;
  *)
    echo "❌ Unknown environment: $ENVIRONMENT"
    echo "Usage: $0 <local|staging|production>"
    exit 1
    ;;
esac

echo "🔧 Generating email templates for $ENVIRONMENT environment"
echo "📍 Domain: $APP_DOMAIN"
echo ""

# Create output directory
OUTPUT_DIR="generated/$ENVIRONMENT"
mkdir -p "$OUTPUT_DIR"

# Process each template
for template in verification-email.html password-reset-email.html; do
  echo "   Processing $template..."
  sed "s/\${app_domain}/$APP_DOMAIN/g" "$template" > "$OUTPUT_DIR/$template"
done

echo ""
echo "✅ Templates generated in $OUTPUT_DIR/"
echo ""
echo "📋 Next steps:"
echo "   1. Review generated templates in $OUTPUT_DIR/"
echo "   2. Upload to Cognito User Pool via AWS Console or Terraform"
echo "   3. Test by triggering email flow"
echo ""

