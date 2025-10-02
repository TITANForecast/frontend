# Data sources to reference existing infrastructure
data "aws_vpc" "main" {
  tags = {
    Name = "titan-vpc"
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["*private*"]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  
  filter {
    name   = "tag:Name"
    values = ["*public*"]
  }
}

# Data source for existing ECS cluster
data "aws_ecs_cluster" "main" {
  cluster_name = "titan-cluster"
}

# Data source for existing ALB
data "aws_lb" "main" {
  name = "titan-alb"
}

# Data source for existing ALB listener
data "aws_lb_listener" "main" {
  load_balancer_arn = data.aws_lb.main.arn
  port              = 80
}

# Data source for existing ALB security group
data "aws_security_group" "alb" {
  id = "sg-01d04307b3527d0b8"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}