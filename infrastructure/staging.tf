# Staging environment configuration
module "frontend_staging" {
  source = "./modules/frontend"

  # Environment configuration
  environment = "staging"
  domain_name = "app-staging.titanforecast.com"

  # Infrastructure references (shared with production)
  vpc_id                    = data.aws_vpc.main.id
  private_subnet_ids        = data.aws_subnets.private.ids
  public_subnet_ids         = data.aws_subnets.public.ids
  alb_security_group_id     = data.aws_security_group.alb.id
  listener_arn              = data.aws_lb_listener.main.arn

  # ECS configuration (smaller for staging)
  cpu                = 256
  memory             = 512
  desired_count      = 1
  min_capacity       = 1
  max_capacity       = 3
  container_port     = 3000
  health_check_path  = "/"

  # Target group configuration
         target_group_name = "titan-frontend-staging-tg"
         listener_rule_priority = 160

  # Cognito configuration (shared with production)
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id    = var.cognito_client_id

  # GitHub configuration
  github_repository = "TITANForecast/frontend"
  github_branch     = "staging"

  tags = {
    Environment = "staging"
    Project     = "titan-frontend"
  }
}
