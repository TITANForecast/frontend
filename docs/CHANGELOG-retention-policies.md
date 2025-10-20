# Changelog: Image Tagging and Retention Policies

**Date:** 2025-10-20  
**PR:** TBD  
**Branch:** TBD

## Overview

Implemented image tagging strategy using commit hashes and automated retention policies for ECR images to prevent resource accumulation.

## Changes Made

### 1. ECR Lifecycle Policies

**File:** `infrastructure/modules/frontend/main.tf`

Added automated lifecycle policy for ECR repositories with three rules:

1. **Keep Last 10 Commit-Tagged Images**
   - Targets: `sha-*`, `v*`, `release-*` tags
   - Action: Remove images beyond the last 10
   - Prevents: Unlimited image accumulation

2. **Preserve Latest Tag**
   - Targets: `latest` tag
   - Action: Keep only the most recent
   - Ensures: Current deployment reference available

3. **Clean Untagged Images**
   - Targets: Untagged/intermediate images
   - Action: Remove after 7 days
   - Prevents: Storage waste from failed builds

**Impact:**
- Staging: ~35+ images → will reduce to 10-11 over time
- Production: ~11 images → already manageable
- Cost savings: Reduced ECR storage costs

### 2. Image Tagging Strategy

**Files:**
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-release.yml`

**Changes:**
- Use short commit hash (7 chars) with `sha-` prefix
- Example: `sha-a1b2c3d` instead of full 40-char SHA
- Build once, tag twice (`sha-XXXXXXX` and `latest`)

**Before:**
```yaml
IMAGE_TAG: ${{ github.sha }}
# Result: a1b2c3d4e5f6789...  (40 chars)
```

**After:**
```bash
SHORT_SHA=$(echo ${{ github.sha }} | cut -c1-7)
IMAGE_TAG="sha-${SHORT_SHA}"
# Result: sha-a1b2c3d (11 chars)
```

**Benefits:**
- ✅ Matches lifecycle policy tag prefix (`sha-*`)
- ✅ Easier to read in logs and UI
- ✅ Traceability to source code
- ✅ Quick rollback capability

### 3. Documentation

**Files Created:**

1. **`docs/image-and-task-definition-retention.md`**
   - Comprehensive retention policy guide
   - Task definition cleanup strategies
   - Monitoring commands
   - Rollback considerations

2. **`scripts/cleanup-task-definitions.sh`**
   - Automated cleanup script
   - Keeps last 20 revisions by default
   - Dry-run mode for safety
   - Works for both staging and production

## Migration Path

### Phase 1: Apply Terraform Changes ✅
```bash
cd frontend/infrastructure
terraform init
terraform plan  # Review lifecycle policy changes
terraform apply # Apply to both staging and production
```

### Phase 2: Deploy with New Tagging 🔄
Next deployment will use new tagging strategy automatically.

**First deployment after merge:**
- Image tag: `sha-XXXXXXX` (where X is from merge commit)
- Old images remain until lifecycle policy expires them

### Phase 3: Cleanup Old Resources ⏳
```bash
# Dry run first
cd frontend
./scripts/cleanup-task-definitions.sh --dry-run --keep 20

# Actual cleanup
./scripts/cleanup-task-definitions.sh --keep 20
```

## Verification

### Check ECR Lifecycle Policy

```bash
export AWS_PROFILE=TitanOps

# Staging
aws ecr get-lifecycle-policy \
  --repository-name titan-frontend-staging \
  --region us-east-1

# Production
aws ecr get-lifecycle-policy \
  --repository-name titan-frontend-production \
  --region us-east-1
```

### Check Image Tags After Deployment

```bash
# Staging
aws ecr list-images \
  --repository-name titan-frontend-staging \
  --region us-east-1 \
  --query 'imageIds[*].imageTag' \
  --output table

# Should see tags like: sha-a1b2c3d, latest
```

### Monitor Task Definition Count

```bash
# Before cleanup
aws ecs list-task-definitions \
  --family-prefix titan-frontend-staging \
  --status ACTIVE \
  --query 'length(taskDefinitionArns)'

# After cleanup
# Should be <= 20
```

## Rollout Timeline

- **Week 1:** Terraform apply (ECR policies active)
- **Week 1:** Next deployment uses new tag format
- **Week 2:** Old images expire per lifecycle rules
- **Week 2:** Run task definition cleanup script
- **Ongoing:** Monitor monthly, adjust if needed

## Rollback Plan

If issues arise:

1. **Revert ECR Lifecycle Policy:**
   ```bash
   aws ecr delete-lifecycle-policy \
     --repository-name titan-frontend-staging
   ```

2. **Revert Workflow Changes:**
   ```bash
   git revert <commit-sha>
   ```

3. **Restore Task Definitions:**
   Task definitions are only deregistered (soft delete), can be re-registered from backup JSON.

## Testing

### Test Lifecycle Policy (Staging First)

1. Deploy multiple times to staging
2. Verify new images have `sha-` prefix
3. Wait 24 hours
4. Check that only 10 most recent `sha-*` images remain

### Test Task Definition Cleanup

1. Run script with `--dry-run` flag
2. Review proposed deletions
3. Run without dry-run
4. Verify ECS services still work
5. Check task definition counts reduced

## Maintenance

### Monthly Check

```bash
# Add to cron or calendar reminder
cd frontend/scripts
./cleanup-task-definitions.sh --dry-run --keep 20
```

### Adjust Retention if Needed

**If rollbacks are frequent:**
```terraform
# In modules/frontend/main.tf
countNumber   = 15  # Increase from 10
```

**If storage cost is concern:**
```terraform
countNumber   = 5   # Decrease from 10
```

## Questions & Answers

**Q: What happens to currently running tasks?**  
A: No impact. Running tasks use their current task definition revision.

**Q: Can we roll back to a deleted image?**  
A: No, once lifecycle policy expires an image, it's gone. Plan accordingly.

**Q: How long until old images are deleted?**  
A: Lifecycle policies evaluate daily. Expect cleanup within 24-48 hours.

**Q: What if we need more than 10 images?**  
A: Adjust `countNumber` in Terraform and re-apply.

**Q: Do we need to change anything in the application code?**  
A: No, this is purely infrastructure and CI/CD changes.

## Related Documentation

- [Image and Task Definition Retention](./image-and-task-definition-retention.md)
- [Frontend Production Deployment Plan](../../infrastructure/docs/frontend-production-deployment-plan.md)
- [AWS ECR Lifecycle Policies](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)

## Success Criteria

✅ ECR lifecycle policies applied to both environments  
✅ New deployments use `sha-` tag format  
✅ Image count stabilizes at ~10-11 per repository  
✅ Task definition count reduced to <20 per family  
✅ No impact to running services  
✅ Rollback capability maintained  

---

**Reviewed by:** TBD  
**Approved by:** TBD  
**Deployed:** TBD

