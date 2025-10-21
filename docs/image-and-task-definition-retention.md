# Image and Task Definition Retention Policy

This document describes the retention policies for Docker images and ECS task definitions.

## ECR Image Retention

### Automated Lifecycle Policies

The ECR repositories have automated lifecycle policies configured via Terraform:

**Policy Rules:**

1. **Keep Last 10 Commit-Tagged Images**
   - Applies to tags starting with: `sha-`, `v`, `release-`
   - Automatically removes images beyond the last 10
   - Ensures we don't accumulate too many old images

2. **Keep Latest Tag**
   - Always keeps the most recent `latest` tag
   - Ensures current deployment reference is available

3. **Remove Untagged Images**
   - Removes untagged images after 7 days
   - Cleans up intermediate/failed builds

### Image Tagging Strategy

Images are tagged with short commit hashes:
- Format: `sha-<7-char-hash>`
- Example: `sha-a1b2c3d`
- Also tagged as `latest` for convenience

**Benefits:**
- ✅ Easy to identify which commit built the image
- ✅ Traceability from deployment to source code
- ✅ Allows quick rollback to specific commits
- ✅ No tag collisions between builds

## ECS Task Definition Retention

### Current Limitation

AWS ECS **does not provide automated retention policies** for task definitions. They accumulate indefinitely unless manually cleaned up.

### Manual Cleanup Process

#### Option 1: AWS CLI Cleanup Script

Create a script to deregister old, inactive task definitions:

```bash
#!/bin/bash
# cleanup-task-definitions.sh

TASK_FAMILY="titan-frontend-staging"
KEEP_LAST=10

# Get all task definition revisions (oldest first)
TASK_DEFINITIONS=$(aws ecs list-task-definitions \
  --family-prefix $TASK_FAMILY \
  --status INACTIVE \
  --sort DESC \
  --query 'taskDefinitionArns[10:]' \
  --output text)

# Deregister old inactive task definitions
for ARN in $TASK_DEFINITIONS; do
  echo "Deregistering: $ARN"
  aws ecs deregister-task-definition --task-definition $ARN
done
```

#### Option 2: EventBridge + Lambda

For automated cleanup, create:
1. Lambda function to deregister old task definitions
2. EventBridge rule to run monthly
3. Keep last N revisions (e.g., 20)

**Example Lambda (Python):**

```python
import boto3
import os

ecs = boto3.client('ecs')
KEEP_REVISIONS = int(os.environ.get('KEEP_REVISIONS', 20))

def lambda_handler(event, context):
    families = ['titan-frontend-staging', 'titan-frontend-production']
    
    for family in families:
        # Get all task definitions
        response = ecs.list_task_definitions(
            familyPrefix=family,
            status='INACTIVE',
            sort='DESC'
        )
        
        # Skip the most recent N
        to_delete = response['taskDefinitionArns'][KEEP_REVISIONS:]
        
        for arn in to_delete:
            print(f"Deregistering: {arn}")
            ecs.deregister_task_definition(taskDefinition=arn)
    
    return {'statusCode': 200, 'body': 'Cleanup complete'}
```

### Best Practices

1. **Keep Recent Revisions**
   - Maintain at least 10-20 recent revisions
   - Allows quick rollback if needed

2. **Match ECR Retention**
   - Align task definition retention with ECR image retention
   - Prevents orphaned task definitions referencing deleted images

3. **Regular Audits**
   - Review task definition count quarterly
   - Clean up if count exceeds 50 per family

4. **Backup Before Cleanup**
   - Export task definitions before deregistering:
     ```bash
     aws ecs describe-task-definition \
       --task-definition titan-frontend-production:11 \
       > backup/task-def-11.json
     ```

## Current Status

### Staging Environment
- **ECR Repository:** `titan-frontend-staging`
- **Lifecycle Policy:** ✅ Configured (keeps 10 images)
- **Task Definition Family:** `titan-frontend-staging`
- **Current Revisions:** ~35+ (needs cleanup)

### Production Environment
- **ECR Repository:** `titan-frontend-production`
- **Lifecycle Policy:** ✅ Configured (keeps 10 images)
- **Task Definition Family:** `titan-frontend-production`
- **Current Revisions:** ~11 (manageable)

## Monitoring

### Check Image Count

```bash
# Staging
aws ecr list-images \
  --repository-name titan-frontend-staging \
  --query 'imageIds | length(@)'

# Production
aws ecr list-images \
  --repository-name titan-frontend-production \
  --query 'imageIds | length(@)'
```

### Check Task Definition Count

```bash
# Staging
aws ecs list-task-definitions \
  --family-prefix titan-frontend-staging \
  --query 'taskDefinitionArns | length(@)'

# Production
aws ecs list-task-definitions \
  --family-prefix titan-frontend-production \
  --query 'taskDefinitionArns | length(@)'
```

## Recommended Actions

1. **Immediate:**
   - ✅ Apply Terraform changes to enable ECR lifecycle policies
   - ⏳ Run manual task definition cleanup script

2. **Short-term (1-2 weeks):**
   - Create Lambda function for automated task definition cleanup
   - Set up EventBridge rule to run monthly

3. **Ongoing:**
   - Monitor image/task definition counts monthly
   - Adjust retention policies based on rollback frequency
   - Review and optimize as needed

## Rollback Considerations

### Image Rollback

With 10 images retained, you can roll back approximately:
- **Staging:** Last ~10 deployments
- **Production:** Last ~10 releases

If deeper history is needed, increase `countNumber` in lifecycle policy.

### Task Definition Rollback

Task definitions only change when:
- Environment variables change
- Resource allocation changes (CPU/memory)
- Secret references change

Most deployments only change the image tag, not the task definition itself.

## Questions?

If you need to:
- Adjust retention policies → Update `modules/frontend/main.tf`
- Recover deleted images → Check ECR image history (24hr grace period)
- Restore task definition → Use backup JSON with `register-task-definition`

