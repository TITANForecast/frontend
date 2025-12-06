# pgAdmin Module Variables

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (staging or production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for ECS tasks"
  type        = list(string)
}

variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "alb_https_listener_arn" {
  description = "ARN of the ALB HTTPS listener"
  type        = string
}

variable "alb_security_group_ids" {
  description = "List of ALB security group IDs"
  type        = list(string)
}

variable "database_security_group_id" {
  description = "ID of the RDS security group"
  type        = string
}

variable "domain_name" {
  description = "Domain name for pgAdmin (e.g., db-staging.titanforecast.com)"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito user pool for authentication"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito client ID for authentication"
  type        = string
}

variable "cognito_user_pool_domain" {
  description = "Cognito user pool domain for authentication"
  type        = string
}

variable "database_secrets" {
  description = "List of database secrets to pass to the container"
  type = list(object({
    name      = string
    valueFrom = string
  }))
}

variable "cpu" {
  description = "CPU units for the task (512 = 0.5 vCPU recommended for pgAdmin)"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Memory in MB for the task (1024 recommended for pgAdmin)"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of tasks (set to 0 to disable)"
  type        = number
  default     = 1
}

variable "image_tag" {
  description = "Docker image tag for pgAdmin"
  type        = string
  default     = "latest"
}

variable "alb_listener_priority" {
  description = "Priority for the ALB listener rule"
  type        = number
}
