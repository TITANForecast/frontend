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

# Data source for RDS security group
data "aws_security_groups" "rds" {
  filter {
    name   = "group-name"
    values = ["*rds*"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data sources for database secrets
data "aws_secretsmanager_secret" "staging_db_connection_string" {
  name = "titan-database/staging/connection-string"
}

data "aws_secretsmanager_secret" "staging_db_host" {
  name = "titan-database/staging/host"
}

data "aws_secretsmanager_secret" "staging_db_port" {
  name = "titan-database/staging/port"
}

data "aws_secretsmanager_secret" "staging_db_name" {
  name = "titan-database/staging/name"
}

data "aws_secretsmanager_secret" "staging_db_username" {
  name = "titan-database/staging/username"
}

data "aws_secretsmanager_secret" "staging_db_password" {
  name = "titan-database/staging/password"
}

data "aws_secretsmanager_secret" "production_db_connection_string" {
  name = "titan-database/production/connection-string"
}

data "aws_secretsmanager_secret" "production_db_host" {
  name = "titan-database/production/host"
}

data "aws_secretsmanager_secret" "production_db_port" {
  name = "titan-database/production/port"
}

data "aws_secretsmanager_secret" "production_db_name" {
  name = "titan-database/production/name"
}

data "aws_secretsmanager_secret" "production_db_username" {
  name = "titan-database/production/username"
}

data "aws_secretsmanager_secret" "production_db_password" {
  name = "titan-database/production/password"
}

# Production Environment Module
module "frontend_production" {
  source = "./modules/frontend"

  # Environment Configuration
  environment  = "production"
  project_name = var.project_name

  # AWS Configuration
  aws_region = var.aws_region

  # Domain Configuration
  domain_name = var.production_domain_name

  # Infrastructure References
  vpc_id                 = data.aws_vpc.main.id
  private_subnet_ids     = data.aws_subnets.private.ids
  public_subnet_ids      = data.aws_subnets.public.ids
  ecs_cluster_name       = data.aws_ecs_cluster.main.cluster_name
  alb_arn                = data.aws_lb.main.arn
  alb_listener_arn       = data.aws_lb_listener.main.arn
  alb_https_listener_arn = data.aws_lb_listener.https.arn
  alb_security_group_ids = data.aws_security_groups.alb.ids
  ecs_security_group_ids = data.aws_security_groups.ecs.ids

  # ECS Configuration
  cpu               = var.production_cpu
  memory            = var.production_memory
  desired_count     = var.production_desired_count
  min_capacity      = var.production_min_capacity
  max_capacity      = var.production_max_capacity
  container_port    = var.container_port
  health_check_path = var.health_check_path

  # Cognito Configuration
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id    = var.cognito_client_id

  # GitHub Configuration
  github_repository = var.github_repository
  github_branch     = var.github_branch

  # Database Configuration
  database_security_group_id = data.aws_security_groups.rds.ids[0]
  database_secrets = [
    {
      name      = "DATABASE_URL"
      valueFrom = data.aws_secretsmanager_secret.production_db_connection_string.arn
    },
    {
      name      = "DATABASE_HOST"
      valueFrom = data.aws_secretsmanager_secret.production_db_host.arn
    },
    {
      name      = "DATABASE_PORT"
      valueFrom = data.aws_secretsmanager_secret.production_db_port.arn
    },
    {
      name      = "DATABASE_NAME"
      valueFrom = data.aws_secretsmanager_secret.production_db_name.arn
    },
    {
      name      = "DATABASE_USERNAME"
      valueFrom = data.aws_secretsmanager_secret.production_db_username.arn
    },
    {
      name      = "DATABASE_PASSWORD"
      valueFrom = data.aws_secretsmanager_secret.production_db_password.arn
    }
  ]

  # Image Configuration
  image_tag = var.production_image_tag

  # ALB Configuration
  alb_listener_priority = 150
}

# Staging Environment Module
module "frontend_staging" {
  source = "./modules/frontend"

  # Environment Configuration
  environment  = "staging"
  project_name = var.project_name

  # AWS Configuration
  aws_region = var.aws_region

  # Domain Configuration
  domain_name = var.staging_domain_name

  # Infrastructure References
  vpc_id                 = data.aws_vpc.main.id
  private_subnet_ids     = data.aws_subnets.private.ids
  public_subnet_ids      = data.aws_subnets.public.ids
  ecs_cluster_name       = data.aws_ecs_cluster.main.cluster_name
  alb_arn                = data.aws_lb.main.arn
  alb_listener_arn       = data.aws_lb_listener.main.arn
  alb_https_listener_arn = data.aws_lb_listener.https.arn
  alb_security_group_ids = data.aws_security_groups.alb.ids
  ecs_security_group_ids = data.aws_security_groups.ecs.ids

  # ECS Configuration
  cpu               = var.staging_cpu
  memory            = var.staging_memory
  desired_count     = var.staging_desired_count
  min_capacity      = var.staging_min_capacity
  max_capacity      = var.staging_max_capacity
  container_port    = var.container_port
  health_check_path = var.health_check_path

  # Cognito Configuration
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_client_id    = var.cognito_client_id

  # GitHub Configuration
  github_repository = var.github_repository
  github_branch     = var.staging_github_branch

  # Database Configuration
  database_security_group_id = data.aws_security_groups.rds.ids[0]
  database_secrets = [
    {
      name      = "DATABASE_URL"
      valueFrom = data.aws_secretsmanager_secret.staging_db_connection_string.arn
    },
    {
      name      = "DATABASE_HOST"
      valueFrom = data.aws_secretsmanager_secret.staging_db_host.arn
    },
    {
      name      = "DATABASE_PORT"
      valueFrom = data.aws_secretsmanager_secret.staging_db_port.arn
    },
    {
      name      = "DATABASE_NAME"
      valueFrom = data.aws_secretsmanager_secret.staging_db_name.arn
    },
    {
      name      = "DATABASE_USERNAME"
      valueFrom = data.aws_secretsmanager_secret.staging_db_username.arn
    },
    {
      name      = "DATABASE_PASSWORD"
      valueFrom = data.aws_secretsmanager_secret.staging_db_password.arn
    }
  ]

  # Image Configuration
  image_tag = var.staging_image_tag

  # ALB Configuration
  alb_listener_priority = 160
}