# Production outputs
output "production_ecr_repository_url" {
  description = "URL of the production ECR repository"
  value       = module.frontend_production.ecr_repository_url
}

output "production_application_url" {
  description = "URL of the production application"
  value       = module.frontend_production.application_url
}

output "production_ecs_service_name" {
  description = "Name of the production ECS service"
  value       = module.frontend_production.ecs_service_name
}

output "production_target_group_arn" {
  description = "ARN of the production target group"
  value       = module.frontend_production.target_group_arn
}

# Staging outputs
output "staging_ecr_repository_url" {
  description = "URL of the staging ECR repository"
  value       = module.frontend_staging.ecr_repository_url
}

output "staging_application_url" {
  description = "URL of the staging application"
  value       = module.frontend_staging.application_url
}

output "staging_ecs_service_name" {
  description = "Name of the staging ECS service"
  value       = module.frontend_staging.ecs_service_name
}

output "staging_target_group_arn" {
  description = "ARN of the staging target group"
  value       = module.frontend_staging.target_group_arn
}

# Shared infrastructure outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = data.aws_vpc.main.id
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = data.aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the ALB"
  value       = data.aws_lb.main.zone_id
}