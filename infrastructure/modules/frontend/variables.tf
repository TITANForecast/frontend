variable "aws_region" {
  description = "AWS region for resources"
  type        = string
}

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the frontend application"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the resources"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for load balancer"
  type        = list(string)
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "alb_arn" {
  description = "ARN of the Application Load Balancer"
  type        = string
}

variable "alb_listener_arn" {
  description = "ARN of the ALB listener"
  type        = string
}

variable "alb_https_listener_arn" {
  description = "ARN of the ALB HTTPS listener"
  type        = string
}

variable "alb_security_group_ids" {
  description = "Security group IDs for ALB"
  type        = list(string)
}

variable "ecs_security_group_ids" {
  description = "Security group IDs for ECS"
  type        = list(string)
}

variable "cpu" {
  description = "CPU units for the ECS task"
  type        = number
}

variable "memory" {
  description = "Memory for the ECS task"
  type        = number
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks for auto scaling"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks for auto scaling"
  type        = number
}

variable "container_port" {
  description = "Port that the container listens on"
  type        = number
}

variable "health_check_path" {
  description = "Health check path for the application"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID for authentication"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito Client ID for authentication"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository for CI/CD"
  type        = string
}

variable "github_branch" {
  description = "GitHub branch for deployment"
  type        = string
}

variable "database_security_group_id" {
  description = "Security group ID of the RDS database to allow access from ECS tasks"
  type        = string
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "database_secrets" {
  description = "List of database secrets to inject into the container"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "alb_listener_priority" {
  description = "Priority for the ALB listener rule"
  type        = number
}
