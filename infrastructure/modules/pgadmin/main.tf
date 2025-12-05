# pgAdmin ECS Service Module
# Provides secure, browser-based database management for developers
# Protected by ALB Cognito authentication

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for AWS region
data "aws_region" "current" {}

# Data source for VPC
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Data source for ALB security group
data "aws_security_group" "alb" {
  id = var.alb_security_group_ids[0]
}

# ECR Repository for pgAdmin
resource "aws_ecr_repository" "pgadmin" {
  name                 = "${var.project_name}-pgadmin"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name        = "${var.project_name}-pgadmin-ecr"
    Environment = var.environment
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "pgadmin" {
  repository = aws_ecr_repository.pgadmin.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "latest"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Delete untagged images older than 3 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 3
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# Security Group for pgAdmin ECS tasks
resource "aws_security_group" "pgadmin" {
  name_prefix = "${var.project_name}-pgadmin-"
  description = "Security group for pgAdmin ECS tasks"
  vpc_id      = var.vpc_id

  # Allow inbound from ALB only on port 80
  ingress {
    description     = "HTTP from ALB to pgAdmin"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = var.alb_security_group_ids
  }

  # Allow outbound to RDS
  egress {
    description = "PostgreSQL to RDS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  # Allow outbound HTTPS for AWS API calls
  egress {
    description = "HTTPS for AWS API calls"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-pgadmin-sg"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Update RDS security group to allow pgAdmin
resource "aws_security_group_rule" "rds_from_pgadmin" {
  description              = "PostgreSQL from pgAdmin"
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = var.database_security_group_id
  source_security_group_id = aws_security_group.pgadmin.id
}

# Secrets Manager - pgAdmin Credentials
resource "aws_secretsmanager_secret" "pgadmin_email" {
  name        = "titan-pgadmin/${var.environment}/email"
  description = "pgAdmin default email for ${var.environment} environment"

  tags = {
    Name        = "titan-pgadmin-email"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "pgadmin_email" {
  secret_id     = aws_secretsmanager_secret.pgadmin_email.id
  secret_string = "admin@titanforecast.com"
}

resource "aws_secretsmanager_secret" "pgadmin_password" {
  name        = "titan-pgadmin/${var.environment}/password"
  description = "pgAdmin default password for ${var.environment} environment"

  tags = {
    Name        = "titan-pgadmin-password"
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "pgadmin_password" {
  secret_id = aws_secretsmanager_secret.pgadmin_password.id
  # Generate a random password - users should change this after first login
  secret_string = "TitanPgAdmin2024!ChangeMeNow"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "pgadmin" {
  name              = "/ecs/${var.project_name}-pgadmin-${var.environment}"
  retention_in_days = 7  # Short retention for developer tool logs

  tags = {
    Name        = "${var.project_name}-pgadmin-logs"
    Environment = var.environment
  }
}

# IAM Role for ECS Task
resource "aws_iam_role" "task_role" {
  name = "${var.project_name}-pgadmin-${var.environment}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-pgadmin-task-role"
    Environment = var.environment
  }
}

# IAM Policy for RDS IAM authentication
resource "aws_iam_role_policy" "rds_connect" {
  name = "rds-connect"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = [
          "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:*/*"
        ]
      }
    ]
  })
}

# IAM Policy for Secrets Manager access
resource "aws_iam_role_policy" "secrets" {
  name = "secrets-access"
  role = aws_iam_role.task_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.database_secrets[*].valueFrom
      }
    ]
  })
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "execution_role" {
  name = "${var.project_name}-pgadmin-${var.environment}-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-pgadmin-execution-role"
    Environment = var.environment
  }
}

# Attach AWS managed policy for ECS task execution
resource "aws_iam_role_policy_attachment" "execution_role_policy" {
  role       = aws_iam_role.execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# IAM Policy for ECS Task Execution Role - Secrets Manager permissions
resource "aws_iam_role_policy" "execution_secrets_policy" {
  name = "secrets-policy"
  role = aws_iam_role.execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = concat(
          var.database_secrets[*].valueFrom,
          [
            aws_secretsmanager_secret.pgadmin_email.arn,
            aws_secretsmanager_secret.pgadmin_password.arn
          ]
        )
      }
    ]
  })
}

# Target Group
resource "aws_lb_target_group" "pgadmin" {
  name        = "pgadmin-${var.environment}-tg"  # Max 32 chars
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200,302"  # pgAdmin redirects to login
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${var.project_name}-pgadmin-tg"
    Environment = var.environment
  }
}

# ALB Listener Rule (HTTPS with Cognito Auth)
resource "aws_lb_listener_rule" "pgadmin" {
  listener_arn = var.alb_https_listener_arn
  priority     = var.alb_listener_priority

  # FIRST: Authenticate with Cognito
  action {
    type  = "authenticate-cognito"
    order = 1

    authenticate_cognito {
      user_pool_arn              = var.cognito_user_pool_arn
      user_pool_client_id        = var.cognito_client_id
      user_pool_domain           = var.cognito_user_pool_domain
      on_unauthenticated_request = "authenticate"  # Redirect to Cognito login
      scope                      = "openid email profile"
      session_timeout            = 28800  # 8 hours for long operations
    }
  }

  # THEN: Forward to pgAdmin
  action {
    type             = "forward"
    order            = 2
    target_group_arn = aws_lb_target_group.pgadmin.arn
  }

  condition {
    host_header {
      values = [var.domain_name]
    }
  }

  tags = {
    Name        = "${var.project_name}-pgadmin-listener-rule"
    Environment = var.environment
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "pgadmin" {
  family                   = "${var.project_name}-pgadmin-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.execution_role.arn
  task_role_arn            = aws_iam_role.task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-pgadmin-${var.environment}"
      image = "${aws_ecr_repository.pgadmin.repository_url}:${var.image_tag}"

      portMappings = [{
        containerPort = 80
        protocol      = "tcp"
      }]

      environment = [
        {
          name  = "PGADMIN_LISTEN_PORT"
          value = "80"
        },
        {
          name  = "PGADMIN_SERVER_JSON_FILE"
          value = "/pgadmin4/servers.json"  # Pre-configured server connections
        },
        {
          name  = "PGADMIN_CONFIG_SESSION_EXPIRATION_TIME"
          value = "8"  # 8 hours
        },
        {
          name  = "PGADMIN_CONFIG_MAX_SESSION_IDLE_TIME"
          value = "120"  # 2 hours
        },
        {
          name  = "PGADMIN_CONFIG_WTF_CSRF_TIME_LIMIT"
          value = "3600"  # 1 hour for large operations
        },
        {
          name  = "PGADMIN_CONFIG_ENHANCED_COOKIE_PROTECTION"
          value = "False"  # Required for ALB auth
        }
      ]

      secrets = concat(
        [
          {
            name      = "PGADMIN_DEFAULT_EMAIL"
            valueFrom = aws_secretsmanager_secret.pgadmin_email.arn
          },
          {
            name      = "PGADMIN_DEFAULT_PASSWORD"
            valueFrom = aws_secretsmanager_secret.pgadmin_password.arn
          }
        ],
        var.database_secrets
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.pgadmin.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }

      healthCheck = {
        command = [
          "CMD-SHELL",
          "wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1"
        ]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      linuxParameters = {
        initProcessEnabled = true
      }
    }
  ])

  tags = {
    Name        = "${var.project_name}-pgadmin-task"
    Environment = var.environment
  }
}

# ECS Service
resource "aws_ecs_service" "pgadmin" {
  name                   = "${var.project_name}-pgadmin-${var.environment}"
  cluster                = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.ecs_cluster_name}"
  task_definition        = aws_ecs_task_definition.pgadmin.arn
  desired_count          = var.desired_count
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.pgadmin.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.pgadmin.arn
    container_name   = "${var.project_name}-pgadmin-${var.environment}"
    container_port   = 80
  }

  # Deployment configuration
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 0  # Allow complete replacement for single instance

  # Health check grace period
  health_check_grace_period_seconds = 120

  depends_on = [
    aws_lb_listener_rule.pgadmin,
    aws_iam_role_policy_attachment.execution_role_policy
  ]

  tags = {
    Name        = "${var.project_name}-pgadmin-service"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [desired_count]  # Allow manual scaling without Terraform drift
  }
}
