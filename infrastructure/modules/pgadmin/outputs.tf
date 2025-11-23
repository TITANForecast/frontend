# pgAdmin Module Outputs

output "ecr_repository_url" {
  description = "URL of the pgAdmin ECR repository"
  value       = aws_ecr_repository.pgadmin.repository_url
}

output "ecr_repository_arn" {
  description = "ARN of the pgAdmin ECR repository"
  value       = aws_ecr_repository.pgadmin.arn
}

output "service_name" {
  description = "Name of the pgAdmin ECS service"
  value       = aws_ecs_service.pgadmin.name
}

output "task_definition_arn" {
  description = "ARN of the pgAdmin ECS task definition"
  value       = aws_ecs_task_definition.pgadmin.arn
}

output "security_group_id" {
  description = "ID of the pgAdmin security group"
  value       = aws_security_group.pgadmin.id
}

output "target_group_arn" {
  description = "ARN of the pgAdmin target group"
  value       = aws_lb_target_group.pgadmin.arn
}

output "url" {
  description = "URL to access pgAdmin (requires Cognito authentication)"
  value       = "https://${var.domain_name}"
}
