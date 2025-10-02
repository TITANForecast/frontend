# Production environment configuration
module "frontend_production" {
  source = "./modules/frontend"

  # Environment configuration
  environment = "production"
  domain_name = "app.titanforecast.com"

  # Infrastructure references
  vpc_id                    = data.aws_vpc.main.id
  private_subnet_ids        = data.aws_subnets.private.ids
  public_subnet_ids         = data.aws_subnets.public.ids
  alb_security_group_id     = data.aws_security_group.alb.id
  listener_arn              = data.aws_lb_listener.main.arn

  # ECS configuration
  cpu                = 512
  memory             = 1024
  desired_count      = 2
  min_capacity       = 1
  max_capacity       = 10
  container_port     = 3000
  health_check_path  = "/"

  # Target group configuration
  target_group_name = "titan-frontend-production-tg"

  # Cognito configuration
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id    = var.cognito_client_id

  # GitHub configuration
  github_repository = "TITANForecast/frontend"
  github_branch     = "main"

  tags = {
    Environment = "production"
    Project     = "titan-frontend"
  }
}
