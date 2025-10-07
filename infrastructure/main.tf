# Data sources to reference existing infrastructure
data "aws_vpc" "main" {
  tags = {
    Name = "titan-vpc"
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["*private*"]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["*public*"]
  }
}

# Data source for existing ECS cluster
data "aws_ecs_cluster" "main" {
  cluster_name = var.ecs_cluster_name
}

# Data source for existing ALB
data "aws_lb" "main" {
  name = var.alb_name
}

# Data source for existing ALB listener
data "aws_lb_listener" "main" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 80
}

# Data source for existing ALB HTTPS listener
data "aws_lb_listener" "https" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 443
}

# Data source for existing security groups
data "aws_security_groups" "alb" {
  filter {
    name   = "group-name"
    values = ["*alb*"]
  }
  
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

data "aws_security_groups" "ecs" {
  filter {
    name   = "group-name"
    values = ["*ecs*"]
  }
  
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Production Environment Module
module "frontend_production" {
  source = "./modules/frontend"
  
  # Environment Configuration
  environment = "production"
  project_name = var.project_name
  
  # AWS Configuration
  aws_region = var.aws_region
  
  # Domain Configuration
  domain_name = var.production_domain_name
  
  # Infrastructure References
  vpc_id = data.aws_vpc.main.id
  private_subnet_ids = data.aws_subnets.private.ids
  public_subnet_ids = data.aws_subnets.public.ids
  ecs_cluster_name = data.aws_ecs_cluster.main.cluster_name
  alb_arn = data.aws_lb.main.arn
  alb_listener_arn = data.aws_lb_listener.main.arn
  alb_https_listener_arn = data.aws_lb_listener.https.arn
  alb_security_group_ids = data.aws_security_groups.alb.ids
  ecs_security_group_ids = data.aws_security_groups.ecs.ids
  
  # ECS Configuration
  cpu = var.production_cpu
  memory = var.production_memory
  desired_count = var.production_desired_count
  min_capacity = var.production_min_capacity
  max_capacity = var.production_max_capacity
  container_port = var.container_port
  health_check_path = var.health_check_path
  
  # Cognito Configuration
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id = var.cognito_client_id
  
  # GitHub Configuration
  github_repository = var.github_repository
  github_branch = var.github_branch
}

# Staging Environment Module
module "frontend_staging" {
  source = "./modules/frontend"
  
  # Environment Configuration
  environment = "staging"
  project_name = var.project_name
  
  # AWS Configuration
  aws_region = var.aws_region
  
  # Domain Configuration
  domain_name = var.staging_domain_name
  
  # Infrastructure References
  vpc_id = data.aws_vpc.main.id
  private_subnet_ids = data.aws_subnets.private.ids
  public_subnet_ids = data.aws_subnets.public.ids
  ecs_cluster_name = data.aws_ecs_cluster.main.cluster_name
  alb_arn = data.aws_lb.main.arn
  alb_listener_arn = data.aws_lb_listener.main.arn
  alb_https_listener_arn = data.aws_lb_listener.https.arn
  alb_security_group_ids = data.aws_security_groups.alb.ids
  ecs_security_group_ids = data.aws_security_groups.ecs.ids
  
  # ECS Configuration
  cpu = var.staging_cpu
  memory = var.staging_memory
  desired_count = var.staging_desired_count
  min_capacity = var.staging_min_capacity
  max_capacity = var.staging_max_capacity
  container_port = var.container_port
  health_check_path = var.health_check_path
  
  # Cognito Configuration
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id = var.cognito_client_id
  
  # GitHub Configuration
  github_repository = var.github_repository
  github_branch = var.staging_github_branch
}