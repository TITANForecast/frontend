terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "titan-terraform-state-183300739967"
    key            = "frontend/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "titan-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  # Only use profile for local development
  # In CI/CD, AWS credentials come from OIDC role
  profile = var.aws_profile != "" ? var.aws_profile : null

  default_tags {
    tags = {
      Project   = var.project_name
      ManagedBy = "terraform"
    }
  }
}