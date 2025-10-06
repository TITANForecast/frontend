output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
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

output "application_url" {
  description = "URL of the application"
  value       = "https://${var.domain_name}"
}

output "secrets_manager_secret_arn" {
  description = "ARN of the secrets manager secret"
  value       = aws_secretsmanager_secret.frontend_config.arn
}

output "secrets_manager_secret_name" {
  description = "Name of the secrets manager secret"
  value       = aws_secretsmanager_secret.frontend_config.name
}

output "execution_role_arn" {
  description = "ARN of the ECS execution role"
  value       = aws_iam_role.ecs_execution_role.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task_role.arn
}

output "security_group_ecs_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs_tasks.id
}
