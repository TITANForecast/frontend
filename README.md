# TITAN Frontend

This is the frontend application for the TITAN Forecast platform, built with [Next.js](https://nextjs.org/) and integrated with AWS Cognito for authentication.

## 🔐 Authentication Service

This application uses **AWS Cognito** for user authentication and management. The authentication service is deployed and managed through our infrastructure repository.

### **Cognito Service Details:**
- **User Pool**: `titan-users` (us-east-1_elJqujwjE)
- **User Pool Client**: `titan-web-client` (56n4j0cr37ngirgq5a5918c48h)
- **Region**: us-east-1
- **Environment**: sandbox
- **Features**: Email verification, password reset, JWT tokens, OAuth code flow

### **Infrastructure Documentation:**
For complete details about the Cognito service configuration, deployment, and management, see:
- **[Infrastructure Repository](https://github.com/TITANForecast/infrastructure)**
- **[Cognito Implementation](https://github.com/TITANForecast/infrastructure/issues/21)**
- **[SES Email Setup](https://github.com/TITANForecast/infrastructure/issues/25)**
- **[Email Templates](https://github.com/TITANForecast/infrastructure/issues/26)**

## 🚀 Getting Started

### **Prerequisites:**
- Node.js 18.18.0+ (recommended: 20.x)
- npm, yarn, or pnpm
- Git

### **1. Clone the Repository:**
```bash
git clone https://github.com/TITANForecast/frontend.git
cd frontend
```

### **2. Install Dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Configure Environment Variables:**
Create a `.env.local` file in the root directory:

```bash
# AWS Cognito Configuration
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_elJqujwjE
NEXT_PUBLIC_COGNITO_CLIENT_ID=56n4j0cr37ngirgq5a5918c48h
```

**Note**: These values are safe to expose publicly as they are designed to be client-side configuration for AWS Cognito. The real security comes from user authentication (passwords, MFA) and JWT token validation, not these configuration values.

### **4. Start the Development Server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run build:static` - Build static site for deployment

## 📱 Authentication Features

### **Available Routes:**
- **`/`** - Main login form
- **`/signin`** - Sign in page
- **`/signup`** - User registration
- **`/reset-password`** - Password reset
- **`/dashboard`** - Protected dashboard (requires authentication)

### **Authentication Flow:**
1. **Sign Up**: Users create accounts with email verification
2. **Sign In**: Email/password authentication with JWT tokens
3. **Password Reset**: Email-based password recovery
4. **Session Management**: Automatic token refresh and persistence

### **Security Features:**
- JWT token-based authentication
- Automatic session management
- Password strength requirements
- Email verification
- Secure token storage

## 🏗️ Architecture

### **Frontend Stack:**
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **AWS Amplify** - Cognito integration
- **Lucide React** - Icons

### **Authentication Stack:**
- **AWS Cognito** - User management and authentication
- **AWS Amplify SDK** - Client-side integration
- **JWT Tokens** - Session management
- **Custom UI** - Branded authentication forms

## 📚 Documentation

- **[Cognito Integration Plan](docs/COGNITO_INTEGRATION_PLAN.md)** - Complete implementation details
- **[GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md)** - CI/CD configuration
- **[Workflow Optimization](docs/WORKFLOW_OPTIMIZATION.md)** - GitHub Actions improvements

## 🐳 Docker Compose Development Environment

For a complete local development environment that simulates the production infrastructure, use our Docker Compose setup.

### **Quick Start:**
```bash
# Start all services
./scripts/docker-dev.sh start

# View logs
./scripts/docker-dev.sh logs

# Stop services
./scripts/docker-dev.sh stop
```

### **Services Included:**
- **Frontend**: Next.js application (http://localhost:3000)
- **PostgreSQL**: Database with complete schema (localhost:5432)
- **Redis**: Cache and session storage (localhost:6379)
- **pgAdmin**: Database administration (http://localhost:5050)
- **RedisInsight**: Redis administration (http://localhost:8001)

### **Database Access:**
```bash
# Direct PostgreSQL connection
docker exec -it titan-postgres-dev psql -U titan_admin -d titan_dev

# Or use pgAdmin at http://localhost:5050
# Email: admin@titan.com, Password: admin123
```

### **Development Workflow:**
```bash
# Check service status
./scripts/docker-dev.sh status

# View specific service logs
./scripts/docker-dev.sh logs frontend

# Restart services
./scripts/docker-dev.sh restart

# Clean environment (removes all data)
./scripts/docker-dev.sh clean
```

### **Database Schema:**
The development environment includes a complete multi-tenant database schema with:
- **Auth Schema**: Users, dealers, user-dealer relationships
- **Core Schema**: Subscriptions and business logic
- **Data Schema**: Repair orders, operations, parts, labor
- **Sample Data**: Ready-to-use test data for development

See [Docker Compose Documentation](DOCKER_COMPOSE_README.md) for detailed setup and usage instructions.

## 🚀 Deployment

This application supports multiple deployment strategies for different environments.

### **Deployment Methods:**

#### **1. Automatic Deployment (Recommended)**

**Staging Deployment:**
- **Trigger**: Merge to `staging` branch
- **Environment**: Staging ECS cluster
- **URL**: https://app-staging.titanforecast.com

**Production Deployment:**
- **Trigger**: Merge to `main` branch  
- **Environment**: Production ECS cluster
- **URL**: https://app.titanforecast.com

#### **2. Manual Deployment (Workflow Dispatch)**

**Deploy to Staging:**
1. Go to [Actions](https://github.com/TITANForecast/frontend/actions)
2. Select "Deploy to Staging" workflow
3. Click "Run workflow"
4. Select branch (usually `staging`)
5. Click "Run workflow"

**Deploy to Production:**
1. Go to [Actions](https://github.com/TITANForecast/frontend/actions)
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

### **Deployment Architecture:**

**Infrastructure:**
- **AWS ECS**: Container orchestration
- **AWS ECR**: Container registry
- **AWS Secrets Manager**: Environment variables
- **AWS CloudWatch**: Logging and monitoring

**CI/CD Pipeline:**
1. **Build**: Docker image creation with environment variables
2. **Push**: Image pushed to ECR registry
3. **Deploy**: ECS service update with new task definition
4. **Health Check**: Service health verification

### **Environment Variables for CI/CD:**
The following secrets are automatically retrieved from AWS Secrets Manager:
- `NEXT_PUBLIC_AWS_REGION`
- `NEXT_PUBLIC_COGNITO_USER_POOL_ID`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`

### **Deployment Monitoring:**
- **GitHub Actions**: Build and deployment status
- **AWS ECS Console**: Service health and logs
- **CloudWatch Logs**: Application logs
- **Health Checks**: Automatic service monitoring

## 🔗 Related Repositories

- **[Infrastructure](https://github.com/TITANForecast/infrastructure)** - AWS infrastructure and Cognito service
- **[Core API](https://github.com/TITANForecast/core-api)** - Backend API services
- **[Data API](https://github.com/TITANForecast/data-api)** - Data processing services
- **[Website](https://github.com/TITANForecast/website)** - Main marketing website

## 🔄 GitFlow Process

To avoid merge conflicts and maintain a clean development workflow, follow this GitFlow process:

### **Branch Strategy:**

#### **Main Branches:**
- **`main`**: Production-ready code, always deployable
- **`staging`**: Pre-production testing, auto-deploys to staging environment

#### **Development Branches:**
- **`feature/*`**: New features (e.g., `feature/user-dashboard`)
- **`fix/*`**: Bug fixes (e.g., `fix/auth-issue`)
- **`hotfix/*`**: Critical production fixes (e.g., `hotfix/security-patch`)

### **GitFlow Workflow:**

#### **1. Starting New Work:**
```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

#### **2. Regular Development:**
```bash
# Make your changes
git add .
git commit -m "feat: add user dashboard component"

# Push to remote
git push origin feature/your-feature-name
```

#### **3. Keeping Up to Date:**
```bash
# Fetch latest changes
git fetch origin

# Merge main into your branch regularly
git merge origin/main

# Resolve any conflicts
# Test your changes
# Push updates
git push origin feature/your-feature-name
```

#### **4. Before Creating PR:**
```bash
# Ensure you're up to date with main
git checkout main
git pull origin main

# Merge main into your branch
git checkout feature/your-feature-name
git merge origin/main

# Resolve conflicts if any
# Test thoroughly
# Push final changes
git push origin feature/your-feature-name
```

#### **5. PR Process:**
1. **Create PR** from your branch to `main`
2. **Review** and address feedback
3. **Merge** to `main` when approved
4. **Delete** feature branch after merge

### **Conflict Resolution Best Practices:**

#### **When Conflicts Occur:**
```bash
# 1. Identify conflicted files
git status

# 2. Open each conflicted file
# 3. Look for conflict markers:
#    <<<<<<< HEAD
#    Your changes
#    =======
#    Incoming changes
#    >>>>>>> branch-name

# 4. Resolve conflicts manually
# 5. Remove conflict markers
# 6. Test your changes
# 7. Add resolved files
git add resolved-file.json

# 8. Complete the merge
git commit -m "resolve: merge conflicts in task definitions"
```

### **Branch Protection Rules:**

#### **Main Branch:**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes to main

#### **Staging Branch:**
- ✅ Auto-deploy on merge
- ✅ Require main branch to be up to date
- ✅ Allow force pushes for hotfixes

### **Emergency Procedures:**

#### **Hotfix Process:**
```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Make minimal fix
# 3. Test thoroughly
# 4. Merge to main immediately
# 5. Merge to staging
# 6. Deploy to production
```

#### **Rollback Process:**
```bash
# 1. Identify last good commit
git log --oneline

# 2. Create rollback branch
git checkout -b rollback/to-stable-version

# 3. Revert problematic commit
git revert <commit-hash>

# 4. Test rollback
# 5. Merge to main
# 6. Deploy immediately
```

### **Best Practices:**

#### **Commit Messages:**
```bash
# Use conventional commits
feat: add new feature
fix: resolve bug
docs: update documentation
style: formatting changes
refactor: code restructuring
test: add tests
chore: maintenance tasks
```

#### **Branch Naming:**
```bash
# Good examples
feature/user-authentication
fix/cognito-login-issue
hotfix/security-vulnerability
docs/api-documentation

# Avoid
fix
new-feature
update
```

#### **Regular Maintenance:**
```bash
# Weekly: Clean up merged branches
git branch --merged main | grep -v main | xargs -n 1 git branch -d

# Before starting work: Always pull latest
git checkout main
git pull origin main

# After merging: Update local branches
git checkout staging
git pull origin staging
```

### **Troubleshooting Common Issues:**

#### **"Your branch is behind" Error:**
```bash
git fetch origin
git merge origin/main
# Resolve conflicts if any
git push origin your-branch
```

#### **"Cannot push to protected branch" Error:**
```bash
# Create PR instead of direct push
# Or use force push for hotfixes (with caution)
git push origin your-branch --force-with-lease
```

#### **Complex Merge Conflicts:**
```bash
# Use merge tool
git mergetool

# Or abort and try different approach
git merge --abort
git rebase origin/main
```

This GitFlow process helps prevent the merge conflicts we experienced and ensures smooth collaboration across the team.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is part of the TITAN Forecast platform.
