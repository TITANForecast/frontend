variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "titan-frontend"
}

variable "ecs_cluster_name" {
  description = "Name of the existing ECS cluster"
  type        = string
  default     = "titan-cluster"
}

variable "alb_name" {
  description = "Name of the existing Application Load Balancer"
  type        = string
  default     = "titan-alb"
}

# Production Environment Configuration
variable "production_domain_name" {
  description = "Domain name for the production frontend application"
  type        = string
  default     = "app.titanforecast.com"
}

variable "production_cpu" {
  description = "CPU units for the production ECS task"
  type        = number
  default     = 512
}

variable "production_memory" {
  description = "Memory for the production ECS task"
  type        = number
  default     = 1024
}

variable "production_desired_count" {
  description = "Desired number of production ECS tasks"
  type        = number
  default     = 2
}

variable "production_min_capacity" {
  description = "Minimum number of production ECS tasks for auto scaling"
  type        = number
  default     = 1
}

variable "production_max_capacity" {
  description = "Maximum number of production ECS tasks for auto scaling"
  type        = number
  default     = 10
}

# Staging Environment Configuration
variable "staging_domain_name" {
  description = "Domain name for the staging frontend application"
  type        = string
  default     = "app-staging.titanforecast.com"
}

variable "staging_cpu" {
  description = "CPU units for the staging ECS task"
  type        = number
  default     = 256
}

variable "staging_memory" {
  description = "Memory for the staging ECS task"
  type        = number
  default     = 512
}

variable "staging_desired_count" {
  description = "Desired number of staging ECS tasks"
  type        = number
  default     = 1
}

variable "staging_min_capacity" {
  description = "Minimum number of staging ECS tasks for auto scaling"
  type        = number
  default     = 1
}

variable "staging_max_capacity" {
  description = "Maximum number of staging ECS tasks for auto scaling"
  type        = number
  default     = 3
}

# Common Configuration
variable "container_port" {
  description = "Port that the container listens on"
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "Health check path for the application"
  type        = string
  default     = "/"
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
  default     = "TITANForecast/frontend"
}

variable "github_branch" {
  description = "GitHub branch for production deployment"
  type        = string
  default     = "main"
}

variable "staging_github_branch" {
  description = "GitHub branch for staging deployment"
  type        = string
  default     = "staging"
}