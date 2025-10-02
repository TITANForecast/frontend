output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = data.aws_ecs_cluster.main.cluster_name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = data.aws_ecs_cluster.main.arn
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.frontend.name
}

output "ecs_service_arn" {
  description = "ARN of the ECS service"
  value       = aws_ecs_service.frontend.id
}

output "target_group_arn" {
  description = "ARN of the target group"
  value       = aws_lb_target_group.frontend.arn
}

output "target_group_name" {
  description = "Name of the target group"
  value       = aws_lb_target_group.frontend.name
}

output "alb_dns_name" {
  description = "DNS name of the existing load balancer"
  value       = data.aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the existing load balancer"
  value       = data.aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the existing load balancer"
  value       = data.aws_lb.main.arn
}

output "domain_name" {
  description = "Domain name of the application"
  value       = var.domain_name
}

output "application_url" {
  description = "URL of the application"
  value       = "https://${var.domain_name}"
}

output "security_group_ecs_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_tasks.id
}

output "execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = var.vpc_id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = var.private_subnet_ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = var.public_subnet_ids
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.frontend_config.arn
}

output "secrets_manager_secret_name" {
  description = "Name of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.frontend_config.name
}
