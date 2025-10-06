# AWS Secrets Manager secrets for frontend application
resource "aws_secretsmanager_secret" "frontend_config" {
  name        = "${var.project_name}/${var.environment}/config"
  description = "Frontend application configuration secrets"

  tags = {
    Name = "${var.project_name}-${var.environment}-secrets"
  }
}

# Secret values (these should be provided via terraform.tfvars or environment variables)
resource "aws_secretsmanager_secret_version" "frontend_config" {
  secret_id = aws_secretsmanager_secret.frontend_config.id
  secret_string = jsonencode({
    NEXT_PUBLIC_AWS_REGION           = var.aws_region
    NEXT_PUBLIC_COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    NEXT_PUBLIC_COGNITO_CLIENT_ID    = var.cognito_client_id
    NEXT_PUBLIC_APP_URL              = "https://${var.domain_name}"
  })
}

