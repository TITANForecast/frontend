# Production Deployment Checklist - v1.3.0

**Date**: December 5, 2024  
**PR**: #65  
**Deployer**: ____________

---

## ⏰ Pre-Deployment (30 min before)

### 1. Stakeholder Communication
- [ ] Notify team in Slack of deployment window
- [ ] Expected duration: 45-60 minutes
- [ ] Deployment time: __________

### 2. Verify Staging Health
```bash
# Check staging is healthy
curl -I https://app-staging.titanforecast.com/api/health
# Expected: HTTP 200

# Check ECS tasks
export AWS_PROFILE=TitanOps
aws ecs describe-services \
  --cluster titan-cluster \
  --services titan-frontend-staging \
  --query 'services[0].{Desired:desiredCount,Running:runningCount}'
# Expected: Desired: 2, Running: 2
```
- [ ] Staging health check: ✅
- [ ] ECS tasks running: ✅

### 3. Database Backup
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier titan-production \
  --db-snapshot-identifier manual-pre-v1-3-0-$(date +%Y%m%d-%H%M) \
  --profile TitanOps
```
- [ ] Snapshot created: ID = ____________________
- [ ] Snapshot status: available

---

## 🚀 Deployment Steps

### Step 1: Database Migration (CRITICAL)

#### 1.1 Port Forward to Production RDS
```bash
# SSH port forward via bastion
export AWS_PROFILE=TitanOps
aws ssm start-session \
  --target i-0d95341f59b881db2 \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["titan-production.ccpseya6qetq.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5432"]}'
```
- [ ] Port forwarding active on localhost:5432
- [ ] Keep this terminal open!

#### 1.2 Run Migration
```bash
# In NEW terminal window
cd /Users/jaylong/Web/Titan/frontend
export DATABASE_URL="postgresql://titan_admin:<GET_FROM_SECRETS>@localhost:5432/titan_production"

# Test connection first
psql $DATABASE_URL -c "SELECT version();"
# Should see PostgreSQL version

# Run migration
npx prisma migrate deploy

# Expected output:
# 1 migration found in prisma/migrations
# Applying migration `20251111005114_add_cognito_status_only`
# Migration applied successfully
```
- [ ] Connection test successful
- [ ] Migration applied: `20251111005114_add_cognito_status_only`
- [ ] No errors in output

#### 1.3 Verify Migration
```bash
# Check column exists
psql $DATABASE_URL -c "\d users"
# Look for: cognitoStatus | text |

# Alternative verification
psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'cognitoStatus';
"
# Expected: cognitoStatus | text | YES
```
- [ ] Column `cognitoStatus` exists
- [ ] Data type: `text`
- [ ] Nullable: YES
- [ ] Screenshot saved: ________________

#### 1.4 Close Port Forward
```bash
# Press Ctrl+C in SSM terminal
# Or close the terminal window
```
- [ ] Port forward closed

**MIGRATION COMPLETE** ✅

---

### Step 2: Infrastructure Update (Terraform)

#### 2.1 Verify Current State
```bash
cd /Users/jaylong/Web/Titan/infrastructure
export AWS_PROFILE=TitanOps
aws sts get-caller-identity
# Expected: Account 183300739967

git status
# Should be on main branch, clean working tree
```
- [ ] On `main` branch
- [ ] Working tree clean
- [ ] AWS profile: TitanOps ✅

#### 2.2 Terraform Plan
```bash
terraform init
terraform plan -out=tfplan

# Review changes - Expected:
# - aws_ecs_task_definition.frontend_production: update (desired_count)
# - aws_appautoscaling_target.frontend_production: update
# - aws_ecs_service.frontend_production: update (deployment config)
# Total: ~5-8 resources
```
- [ ] Terraform init successful
- [ ] Plan shows expected changes only
- [ ] No unexpected destroys
- [ ] Plan saved to tfplan

#### 2.3 Terraform Apply
```bash
terraform apply tfplan

# Expected duration: 2-3 minutes
# Watch for errors
```
- [ ] Apply successful
- [ ] No errors
- [ ] Task definition updated
- [ ] ECS service updated
- [ ] Started at: __________
- [ ] Completed at: __________

---

### Step 3: Merge PR and Deploy

#### 3.1 Merge PR #65
```bash
# Review PR one final time
gh pr view 65

# Merge (or use GitHub UI)
gh pr merge 65 --squash --delete-branch
```
- [ ] PR reviewed
- [ ] All checks passing
- [ ] PR merged to main
- [ ] Branch deleted

#### 3.2 Trigger Production Deployment
**Option A: Auto-deploy** (if push to main triggers it)
- [ ] Wait for GitHub Actions to start
- [ ] Monitor: https://github.com/TITANForecast/frontend/actions

**Option B: Manual trigger**
```bash
gh workflow run "Deploy Frontend to ECS Production" --ref main
```
- [ ] Workflow triggered manually
- [ ] Run URL: ____________________

#### 3.3 Monitor Deployment (10-15 minutes)
```bash
# Watch ECS service deployment
watch -n 5 'aws ecs describe-services \
  --cluster titan-cluster \
  --services titan-frontend-production \
  --query "services[0].{Desired:desiredCount,Running:runningCount,Deployment:deployments[0].status}" \
  --profile TitanOps'

# Expected progression:
# 1. Running: 1, Desired: 2 (new tasks starting)
# 2. Running: 2, Desired: 2 (draining old task)
# 3. Running: 2, Desired: 2 (deployment complete)
```
- [ ] Deployment started: __________
- [ ] New tasks healthy
- [ ] Old tasks drained
- [ ] Deployment complete: __________
- [ ] Duration: __________ minutes

#### 3.4 Check Deployment Logs
```bash
# Check for errors in last 15 minutes
aws logs filter-log-events \
  --log-group-name /ecs/titan-frontend-production \
  --start-time $(date -u -v-15M +%s)000 \
  --filter-pattern "ERROR" \
  --profile TitanOps | jq '.events[] | .message'
```
- [ ] No ERROR logs (or only expected ones)
- [ ] Application started successfully

---

## ✅ Post-Deployment Verification (Immediately)

### 1. Smoke Tests

#### Health Check
```bash
curl -I https://app.titanforecast.com/api/health
# Expected: HTTP 200
```
- [ ] Status: 200 ✅
- [ ] Response time: __________ ms

#### Login Page
```bash
curl -I https://app.titanforecast.com/login
# Expected: HTTP 200
```
- [ ] Status: 200 ✅

#### API Endpoint (requires auth)
```bash
# Use browser or Postman to test authenticated endpoint
# https://app.titanforecast.com/api/warranty/rules
```
- [ ] Login successful
- [ ] Can access authenticated pages

### 2. Functional Tests (15 minutes)

**Test Account**: Use real user account or create test account

- [ ] **Login/Logout**
  - [ ] Login with credentials
  - [ ] Navigate to dashboard
  - [ ] Logout successful
  
- [ ] **Password Reset Flow**
  - [ ] Click "Forgot Password"
  - [ ] Enter email
  - [ ] Receive branded email
  - [ ] Reset code works
  - [ ] Password reset successful
  
- [ ] **Warranty AI Features**
  - [ ] Navigate to Warranty AI page
  - [ ] View RO selection interface
  - [ ] Test RO optimizer (select filters)
  - [ ] View evaluation results
  - [ ] Check confidence scores display
  
- [ ] **Admin User Management** (admin only)
  - [ ] View user list
  - [ ] Check user statuses
  - [ ] Cognito sync working
  
- [ ] **Dealer Settings**
  - [ ] View operations management
  - [ ] View make settings
  - [ ] View opcode management
  
- [ ] **PDF Export**
  - [ ] Export warranty evaluation to PDF
  - [ ] PDF downloads correctly

### 3. Performance Check
```bash
# Check response times
time curl -I https://app.titanforecast.com/api/health
# Expected: < 500ms

# Check ECS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=titan-frontend-production Name=ClusterName,Value=titan-cluster \
  --start-time $(date -u -v-10M +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --profile TitanOps
```
- [ ] Response times < 500ms
- [ ] CPU utilization < 70%
- [ ] Memory within limits

---

## 📊 Monitoring (Next 4 Hours)

### CloudWatch Logs
```bash
# Monitor for errors
aws logs tail /ecs/titan-frontend-production --follow --filter-pattern "ERROR" --profile TitanOps
```
- [ ] Set up terminal to monitor logs
- [ ] Check every 30 minutes for first 2 hours

### Key Metrics to Watch
- [ ] **Error Rate**: Should remain < 0.1%
- [ ] **Response Time**: P95 < 500ms
- [ ] **503 Errors**: Should be ZERO (zero-downtime working!)
- [ ] **Task Count**: Should stay at 2 (or scale appropriately)

### Check Times
- [ ] **30 min**: Quick smoke test + log check
- [ ] **1 hour**: Full functional test
- [ ] **2 hours**: Metrics review
- [ ] **4 hours**: Final verification

---

## 🔄 Rollback Plan (If Needed)

### Quick Rollback (5 minutes)
```bash
# Get previous task definition
PREV_REVISION=$(aws ecs describe-task-definition \
  --task-definition titan-frontend-production \
  --query 'taskDefinition.revision-1' \
  --output text \
  --profile TitanOps)

# Update service to previous revision
aws ecs update-service \
  --cluster titan-cluster \
  --service titan-frontend-production \
  --task-definition titan-frontend-production:$PREV_REVISION \
  --force-new-deployment \
  --profile TitanOps
```

### Database Rollback (If migration caused issues)
```bash
# The migration only ADDS a column, so it's safe to leave
# If you must rollback:
psql $DATABASE_URL -c "ALTER TABLE users DROP COLUMN IF EXISTS \"cognitoStatus\";"
```
**⚠️ Note**: Column is optional, so leaving it is harmless even if you rollback code

---

## 📝 Post-Deployment Tasks

### Immediate (Within 24 hours)
- [ ] **Sync main back to staging**
  ```bash
  cd /Users/jaylong/Web/Titan/frontend
  git checkout staging
  git pull origin staging
  git merge origin/main
  git push origin staging
  ```
- [ ] Update team in Slack: Deployment successful
- [ ] Document any issues encountered
- [ ] Schedule follow-up review meeting

### Short-term (Within 1 week)
- [ ] Monitor user feedback
- [ ] Review CloudWatch metrics trends
- [ ] Verify zero-downtime deployments working
- [ ] Check email template delivery rates

---

## ✅ Sign-Off

**Deployment Completed By**: ____________________  
**Date/Time**: ____________________  
**Status**: ⬜ Success ⬜ Partial ⬜ Rolled Back  

**Notes**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Issues Encountered**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Next Steps**:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

