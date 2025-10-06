# AWS Configuration
aws_region = "us-east-1"
project_name = "titan-frontend"

# Existing Infrastructure References
ecs_cluster_name = "titan-cluster"
alb_name = "titan-alb"

# Production Environment Configuration
production_domain_name = "app.titanforecast.com"
production_cpu = 512
production_memory = 1024
production_desired_count = 2
production_min_capacity = 1
production_max_capacity = 10

# Staging Environment Configuration
staging_domain_name = "app-staging.titanforecast.com"
staging_cpu = 256
staging_memory = 512
staging_desired_count = 1
staging_min_capacity = 1
staging_max_capacity = 3

# Common Configuration
container_port = 3000
health_check_path = "/"

# Cognito Configuration (from main infrastructure outputs)
cognito_user_pool_id = "us-east-1_nHfr0cgfP"
cognito_client_id = "1orj1nfmmeg2cev8o0bk95s7d9"

# GitHub Configuration
github_repository = "TITANForecast/frontend"
github_branch = "main"
staging_github_branch = "staging"