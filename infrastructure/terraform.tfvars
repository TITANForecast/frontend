# AWS Configuration
aws_region = "us-east-1"
project_name = "titan-frontend"
environment = "production"

# Domain Configuration
domain_name = "app.titanforecast.com"

# Existing Infrastructure References (from main infrastructure outputs)
ecs_cluster_name = "titan-cluster"
alb_name = "titan-alb"
target_group_name = "titan-frontend-production-tg"
listener_arn = "arn:aws:elasticloadbalancing:us-east-1:183300739967:listener/app/titan-alb/a69d1ef1319db7ce/9440835fdf5da688"

# ECS Configuration
cpu = 512
memory = 1024
desired_count = 2
min_capacity = 1
max_capacity = 10

# Application Configuration
container_port = 3000
health_check_path = "/"

# Cognito Configuration (from main infrastructure outputs)
cognito_user_pool_id = "us-east-1_nHfr0cgfP"
cognito_client_id = "1orj1nfmmeg2cev8o0bk95s7d9"

# GitHub Configuration
github_repository = "TITANForecast/frontend"
github_branch = "main"
