# Production Release: Staging → Main
**Release Date**: December 5, 2024  
**Version**: v1.3.0  
**Branch**: `release/staging-to-production-20251205`  
**Commits**: 82 commits since last production deployment

---

## 🎯 Release Overview

This release includes major features for warranty AI processing, enhanced Cognito user management, zero-downtime deployments, and PgAdmin database tooling.

### Key Features

1. **🤖 AI-Powered Warranty Evaluation System**
   - Batch warranty operation evaluation
   - AI-driven RO (Repair Order) selection and optimization
   - Warranty rule filtering and compliance checking
   - Confidence scoring and evaluation tracking

2. **👥 Enhanced Cognito User Management**
   - Password reset with branded email templates
   - Email verification system
   - Cognito status tracking (`cognitoStatus` field)
   - Admin user invitation workflows

3. **🚀 Zero-Downtime Deployments**
   - Blue/green deployment configuration (100/200)
   - Increased task count: 1 → 2 for staging and production
   - Prevents 503 errors during deployments

4. **🗄️ PgAdmin Database Management**
   - PgAdmin service deployed on staging
   - Web-based database administration
   - Pre-configured server connections
   - Accessible at `https://db-staging.titanforecast.com`

5. **🔐 Authentication & Security Improvements**
   - Branded Cognito email templates
   - Password reset flow with custom UI
   - User session management improvements

---

## 📋 Database Changes

### Required Migrations

**Migration**: `20251111005114_add_cognito_status_only`

```sql
-- Add cognitoStatus column to users table
ALTER TABLE "users" ADD COLUMN "cognitoStatus" TEXT;
```

**Impact**: Non-breaking, adds optional tracking field

### Migration Execution

**For Production**:
```bash
# SSH to bastion
ssh -i ~/.ssh/titan-key.pem ubuntu@<bastion-ip>

# Port forward to RDS
aws ssm start-session \
  --target i-0d95341f59b881db2 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["titan-production.ccpseya6qetq.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5432"]}'

# In another terminal, run migration
cd /Users/jaylong/Web/Titan/frontend
export DATABASE_URL="postgresql://titan_admin:<password>@localhost:5432/titan_production"
npx prisma migrate deploy
```

**Verification**:
```sql
-- Verify column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'cognitoStatus';
```

---

## 🏗️ Infrastructure Changes

### 1. Zero-Downtime Deployment Configuration

**Changes**:
- `terraform.tfvars`: Increased `production_desired_count` and `production_min_capacity`
- `infrastructure/modules/frontend/main.tf`: Added deployment settings

```hcl
deployment_minimum_healthy_percent = 100
deployment_maximum_percent         = 200
```

**Impact**: 
- No more 503 errors during deployments
- Always maintains at least 1 healthy task
- Can run up to 4 tasks during deployment (2 old + 2 new)

### 2. PgAdmin Module (Staging Only - DO NOT DEPLOY TO PRODUCTION YET)

**New Files**:
- `infrastructure/modules/pgadmin/` - Complete PgAdmin module
- `Dockerfile.pgadmin` - Custom PgAdmin Docker image
- `pgadmin-servers.json` - Pre-configured database connections
- `scripts/build-pgadmin.sh` - Build script

**⚠️ Action Required**:
- PgAdmin is currently configured for **STAGING ONLY**
- To enable in production, update `infrastructure/main.tf`:

```hcl
# Uncomment this section in infrastructure/main.tf if production PgAdmin is desired
# module "pgadmin_production" {
#   source = "./modules/pgadmin"
#   # ... production config
# }
```

**Recommendation**: Keep PgAdmin staging-only for security. Use bastion + SSH for production database access.

### 3. Terraform State Changes

**Files Modified**:
- `infrastructure/terraform.tfvars` - Task count increases
- `infrastructure/outputs.tf` - Added PgAdmin outputs
- `infrastructure/variables.tf` - Added PgAdmin variables

**Terraform Plan**: Expect ~5-8 resources to change (task definitions, services, autoscaling targets)

---

## 🔧 Configuration Changes

### Required Environment Variables

**Production** (verify these exist in GitHub Secrets):
```bash
# Existing (verify values)
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_nHfr0cgfP
NEXT_PUBLIC_COGNITO_CLIENT_ID=1orj1nfmmeg2cev8o0bk95s7d9
NEXT_PUBLIC_APP_URL=https://app.titanforecast.com
NEXT_PUBLIC_USE_COGNITO=true
NEXT_PUBLIC_USE_MOCK_AUTH=false

# Database (from Secrets Manager)
DATABASE_URL=postgresql://...

# New/Updated (check if needed)
# Cognito templates are managed in AWS Cognito Console
```

### Cognito Email Template Updates

**⚠️ Manual Step Required**:

1. Go to AWS Cognito Console → User Pools → `titan-users-production`
2. Navigate to **Messaging** → **Email templates**
3. Update templates for:
   - **Password Reset** - Use branded HTML template
   - **Email Verification** - Use branded HTML template
   - **Invite User** - Use branded HTML template

**Template Location**: See `infrastructure/cognito.tf` for template HTML (currently in staging)

**Action**: Either:
- A) Copy templates from staging Cognito to production manually via console
- B) Update `infrastructure/cognito.tf` to manage production Cognito (requires Terraform access)

---

## 🚢 Deployment Checklist

### Pre-Deployment (30 minutes before)

- [ ] **Notify stakeholders** of deployment window
- [ ] **Verify staging health**:
  ```bash
  curl -I https://app-staging.titanforecast.com/api/health
  # Expected: HTTP 200
  ```
- [ ] **Check ECS task health** (staging):
  ```bash
  aws ecs describe-services \
    --cluster titan-cluster \
    --services titan-frontend-staging \
    --query 'services[0].{Desired:desiredCount,Running:runningCount}'
  # Expected: Desired: 2, Running: 2
  ```
- [ ] **Verify database connectivity** (production):
  ```bash
  # Via bastion, test connection
  psql $DATABASE_URL -c "SELECT version();"
  ```
- [ ] **Backup production database** (AWS RDS automated backup):
  ```bash
  aws rds create-db-snapshot \
    --db-instance-identifier titan-production \
    --db-snapshot-identifier manual-pre-v1-3-0-$(date +%Y%m%d-%H%M)
  ```

### Deployment Steps

1. **Merge PR to `main`** (this will NOT auto-deploy)
   
2. **Run Database Migration** (production):
   ```bash
   # Port forward to production RDS (via bastion)
   export DATABASE_URL="postgresql://titan_admin:<password>@localhost:5432/titan_production"
   npx prisma migrate deploy
   
   # Verify
   npx prisma db execute --stdin <<< \
     "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='cognitoStatus';"
   ```

3. **Trigger Production Deployment**:
   - Go to GitHub Actions → **Deploy Frontend to Production**
   - Click "Run workflow"
   - Select `main` branch
   - Confirm deployment

4. **Monitor Deployment** (watch for 5-10 minutes):
   ```bash
   # Watch ECS service
   watch -n 5 'aws ecs describe-services \
     --cluster titan-cluster \
     --services titan-frontend-production \
     --query "services[0].{Desired:desiredCount,Running:runningCount,Events:events[0].message}"'
   
   # Watch ALB target health
   aws elbv2 describe-target-health \
     --target-group-arn <production-tg-arn> \
     --query 'TargetHealthDescriptions[*].{Target:Target.Id,Health:TargetHealth.State}'
   ```

5. **Update Cognito Templates** (if not done via Terraform):
   - AWS Console → Cognito → User Pools → `titan-users-production`
   - Update email templates (Password Reset, Verification, Invite)
   - Copy HTML from staging Cognito templates

6. **Smoke Tests** (run immediately after deployment):
   ```bash
   # Health check
   curl -I https://app.titanforecast.com/api/health
   # Expected: HTTP 200
   
   # Login page
   curl -I https://app.titanforecast.com/login
   # Expected: HTTP 200
   
   # API endpoint (requires auth)
   curl -I https://app.titanforecast.com/api/warranty/rules
   # Expected: HTTP 401 or 200 (if you have valid session)
   ```

7. **Functional Tests**:
   - [ ] Login with test user account
   - [ ] Navigate to Warranty AI page
   - [ ] Test password reset flow (use test account)
   - [ ] Verify admin user management works
   - [ ] Check RO selection and optimization
   - [ ] Test batch warranty evaluation
   - [ ] Verify PDF export functionality

### Post-Deployment (within 2 hours)

- [ ] **Monitor CloudWatch Logs**:
  ```bash
  aws logs tail /ecs/titan --follow --filter-pattern "ERROR"
  ```
- [ ] **Check error rates** in CloudWatch dashboard
- [ ] **Verify zero 503 errors** during next deployment
- [ ] **Monitor user-reported issues** (support tickets, Slack)
- [ ] **Update release notes** in project management tool

---

## 🔄 Rollback Plan

If critical issues arise, use one of these rollback strategies:

### Option 1: Quick Rollback (ECS Service Update)

**Fast** (~5 minutes), rolls back code only:

```bash
# Get previous task definition revision
PREV_REVISION=$(aws ecs describe-task-definition \
  --task-definition titan-frontend-production \
  --query 'taskDefinition.revision-1' \
  --output text)

# Update service to previous revision
aws ecs update-service \
  --cluster titan-cluster \
  --service titan-frontend-production \
  --task-definition titan-frontend-production:$PREV_REVISION \
  --force-new-deployment
```

### Option 2: Git Rollback + Redeploy

**Thorough** (~15 minutes), full rollback:

```bash
# Revert the merge commit
git revert -m 1 <merge-commit-sha>
git push origin main

# Trigger production deployment workflow
gh workflow run "Deploy Frontend to Production" --ref main
```

### Option 3: Database Rollback (if migration caused issues)

**⚠️ Use with caution** - Data loss possible:

```bash
# The migration is additive (only adds column), so safe to leave
# If rollback needed:
export DATABASE_URL="postgresql://..."
npx prisma migrate resolve --rolled-back 20251111005114_add_cognito_status_only
```

**Note**: The `cognitoStatus` column is optional, so leaving it is harmless.

---

## 🧪 Testing Requirements

### Before Merging PR

- [ ] **Code review** by at least 1 other developer
- [ ] **Staging tests passed**:
  - All GitHub Actions workflows passing
  - Manual QA of warranty AI features
  - Cognito authentication flows tested
  - Password reset tested
  - Email verification tested
- [ ] **Database migration tested on staging**
- [ ] **Infrastructure changes reviewed**

### After Deployment

- [ ] **Smoke tests** (see deployment checklist)
- [ ] **User acceptance testing** (UAT) by product owner
- [ ] **Performance monitoring** (response times, error rates)
- [ ] **24-hour monitoring period** before considering stable

---

## 📊 Metrics to Monitor

### Application Metrics
- **Response Time**: < 500ms p95
- **Error Rate**: < 0.1%
- **Request Rate**: Monitor for anomalies
- **Task Count**: Should remain at 2 (or scale up with load)

### Database Metrics
- **Connection Count**: Monitor for connection pool issues
- **Query Duration**: Watch for slow queries
- **Disk Space**: Verify adequate headroom

### Warranty AI Specific
- **API Response Time**: Warranty evaluation endpoints
- **Batch Processing**: Monitor queue depths
- **Confidence Scores**: Track distribution of AI confidence

---

## 🔐 Security Considerations

1. **PgAdmin Access**: Staging only, behind authentication
2. **Cognito Templates**: Verify no sensitive data in email templates
3. **Database Credentials**: Rotated within last 90 days?
4. **API Keys**: Verify all secrets are in Secrets Manager, not env vars

---

## 📝 Known Issues & Workarounds

### Non-Blocking Issues
1. **PgAdmin only on staging** - By design, production uses bastion for security
2. **Deployment may take longer** - Due to zero-downtime config (expected)

### Blocking Issues
❌ None identified

---

## 👥 Support & Escalation

### Deployment Support
- **Primary**: @jaylong
- **Secondary**: Development team
- **Escalation**: CTO

### Post-Deployment Issues
- Monitor Slack #engineering channel
- CloudWatch alarms will trigger for critical issues
- On-call rotation: [TODO: Add schedule]

---

## 📎 Additional Resources

- **Infrastructure Docs**: `/infrastructure/README.md`
- **PgAdmin Setup**: `/infrastructure/modules/pgadmin/README.md`
- **Prisma Migrations**: `/prisma/migrations/README.md`
- **Cognito Config**: `/infrastructure/cognito.tf`
- **CloudWatch Dashboard**: [AWS Console Link]

---

## ✅ Sign-Off

- [ ] **Tech Lead Approval**: ___________________ Date: _______
- [ ] **Database Migration Tested**: ____________ Date: _______
- [ ] **Infrastructure Changes Reviewed**: _______ Date: _______
- [ ] **Security Review Complete**: _____________ Date: _______
- [ ] **Stakeholders Notified**: ________________ Date: _______
- [ ] **Deployment Window Scheduled**: __________ Date/Time: _______

---

**Deployment Window**: Thursday/Friday preferred (avoid Monday deployments)  
**Estimated Duration**: 45-60 minutes (including migration + testing)  
**Risk Level**: Medium (database migration + infrastructure changes)


