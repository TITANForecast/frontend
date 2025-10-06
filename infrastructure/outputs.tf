# Production Environment Outputs
output "production_application_url" {
  description = "URL of the production application"
  value       = module.frontend_production.application_url
}

output "production_ecr_repository_url" {
  description = "URL of the production ECR repository"
  value       = module.frontend_production.ecr_repository_url
}

output "production_ecs_service_name" {
  description = "Name of the production ECS service"
  value       = module.frontend_production.ecs_service_name
}

output "production_target_group_arn" {
  description = "ARN of the production target group"
  value       = module.frontend_production.target_group_arn
}

# Staging Environment Outputs
output "staging_application_url" {
  description = "URL of the staging application"
  value       = module.frontend_staging.application_url
}

output "staging_ecr_repository_url" {
  description = "URL of the staging ECR repository"
  value       = module.frontend_staging.ecr_repository_url
}

output "staging_ecs_service_name" {
  description = "Name of the staging ECS service"
  value       = module.frontend_staging.ecs_service_name
}

output "staging_target_group_arn" {
  description = "ARN of the staging target group"
  value       = module.frontend_staging.target_group_arn
}

# Common Infrastructure Outputs
output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = data.aws_lb.main.arn
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = data.aws_ecs_cluster.main.arn
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = data.aws_ecs_cluster.main.cluster_name
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = data.aws_subnets.private.ids
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = data.aws_subnets.public.ids
}

output "domain_name" {
  description = "Production domain name"
  value       = var.production_domain_name
}

output "application_url" {
  description = "Production application URL"
  value       = "https://${var.production_domain_name}"
}