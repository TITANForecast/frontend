# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Data source for VPC
data "aws_vpc" "main" {
  id = var.vpc_id
}

# Data source for ALB security group
data "aws_security_group" "alb" {
  id = var.alb_security_group_ids[0]
}

# Data source for secrets manager secret
data "aws_secretsmanager_secret" "frontend_config" {
  name = aws_secretsmanager_secret.frontend_config.name
}

# ECR Repository for frontend container images
resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project_name}-${var.environment}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecr"
  }
}

# Target Group for the frontend service
resource "aws_lb_target_group" "frontend" {
  name        = "${var.project_name}-${var.environment}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-tg"
  }
}

# ALB Listener Rule for frontend (HTTP)
resource "aws_lb_listener_rule" "frontend" {
  listener_arn = var.alb_listener_arn
  priority     = var.alb_listener_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    host_header {
      values = [var.domain_name]
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-listener-rule"
  }
}

# ALB Listener Rule for frontend (HTTPS)
resource "aws_lb_listener_rule" "frontend_https" {
  listener_arn = var.alb_https_listener_arn
  priority     = var.alb_listener_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }

  condition {
    host_header {
      values = [var.domain_name]
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-listener-rule-https"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "frontend" {
  family                   = "${var.project_name}-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "${var.project_name}-${var.environment}"
      image = "${aws_ecr_repository.frontend.repository_url}:${var.image_tag}"

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "HOSTNAME"
          value = "0.0.0.0"
        }
      ]

      secrets = concat(
        [
          {
            name      = "NEXT_PUBLIC_AWS_REGION"
            valueFrom = "${aws_secretsmanager_secret.frontend_config.arn}:NEXT_PUBLIC_AWS_REGION::"
          },
          {
            name      = "NEXT_PUBLIC_COGNITO_USER_POOL_ID"
            valueFrom = "${aws_secretsmanager_secret.frontend_config.arn}:NEXT_PUBLIC_COGNITO_USER_POOL_ID::"
          },
          {
            name      = "NEXT_PUBLIC_COGNITO_CLIENT_ID"
            valueFrom = "${aws_secretsmanager_secret.frontend_config.arn}:NEXT_PUBLIC_COGNITO_CLIENT_ID::"
          },
          {
            name      = "NEXT_PUBLIC_APP_URL"
            valueFrom = "${aws_secretsmanager_secret.frontend_config.arn}:NEXT_PUBLIC_APP_URL::"
          }
        ],
        var.database_secrets
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command = [
          "CMD-SHELL",
          "curl -f http://localhost:${var.container_port}${var.health_check_path} || exit 1"
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
    Name = "${var.project_name}-${var.environment}-task"
  }
}

# ECS Service
resource "aws_ecs_service" "frontend" {
  name                   = "${var.project_name}-${var.environment}"
  cluster                = "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster/${var.ecs_cluster_name}"
  task_definition        = aws_ecs_task_definition.frontend.arn
  desired_count          = var.desired_count
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.frontend.arn
    container_name   = "${var.project_name}-${var.environment}"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener_rule.frontend,
    aws_iam_role_policy_attachment.ecs_execution_role_policy
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-service"
  }
}

# Auto Scaling Target
resource "aws_appautoscaling_target" "frontend" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${var.ecs_cluster_name}/${aws_ecs_service.frontend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = {
    Name = "${var.project_name}-${var.environment}-autoscaling-target"
  }
}

# Auto Scaling Policy - Scale Up
resource "aws_appautoscaling_policy" "frontend_scale_up" {
  name               = "${var.project_name}-${var.environment}-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# Auto Scaling Policy - Scale Down
resource "aws_appautoscaling_policy" "frontend_scale_down" {
  name               = "${var.project_name}-${var.environment}-scale-down"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.frontend.resource_id
  scalable_dimension = aws_appautoscaling_target.frontend.scalable_dimension
  service_namespace  = aws_appautoscaling_target.frontend.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value = 80.0
  }
}
