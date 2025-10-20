#!/bin/bash

# Cleanup ECS Task Definitions
# Keeps the last N revisions and deregisters older INACTIVE ones
# Usage: ./cleanup-task-definitions.sh [--dry-run] [--keep N]

set -e

# Configuration
KEEP_REVISIONS=20
DRY_RUN=false
AWS_PROFILE="${AWS_PROFILE:-TitanOps}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --keep)
      KEEP_REVISIONS="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--dry-run] [--keep N]"
      echo ""
      echo "Options:"
      echo "  --dry-run    Show what would be deleted without actually deleting"
      echo "  --keep N     Keep the last N revisions (default: 20)"
      echo ""
      echo "Environment:"
      echo "  AWS_PROFILE  AWS profile to use (default: TitanOps)"
      echo "  AWS_REGION   AWS region (default: us-east-1)"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Task families to clean up
TASK_FAMILIES=(
  "titan-frontend-staging"
  "titan-frontend-production"
)

echo "============================================"
echo "ECS Task Definition Cleanup"
echo "============================================"
echo "AWS Profile: $AWS_PROFILE"
echo "AWS Region: $AWS_REGION"
echo "Keep Revisions: $KEEP_REVISIONS"
echo "Dry Run: $DRY_RUN"
echo ""

for FAMILY in "${TASK_FAMILIES[@]}"; do
  echo "Processing family: $FAMILY"
  echo "-------------------------------------------"
  
  # Get all task definitions for this family, sorted by revision (newest first)
  TASK_ARNS=$(aws ecs list-task-definitions \
    --family-prefix "$FAMILY" \
    --sort DESC \
    --status ACTIVE \
    --region "$AWS_REGION" \
    --query 'taskDefinitionArns' \
    --output text)
  
  if [ -z "$TASK_ARNS" ]; then
    echo "  No task definitions found"
    echo ""
    continue
  fi
  
  # Convert to array
  TASK_ARNS_ARRAY=($TASK_ARNS)
  TOTAL_COUNT=${#TASK_ARNS_ARRAY[@]}
  
  echo "  Total active revisions: $TOTAL_COUNT"
  
  if [ $TOTAL_COUNT -le $KEEP_REVISIONS ]; then
    echo "  ✅ No cleanup needed (within limit)"
    echo ""
    continue
  fi
  
  # Calculate how many to delete
  TO_DELETE_COUNT=$((TOTAL_COUNT - KEEP_REVISIONS))
  echo "  🗑️  Will deregister: $TO_DELETE_COUNT revisions"
  
  # Get the task definitions to delete (skip the first KEEP_REVISIONS)
  TO_DELETE=("${TASK_ARNS_ARRAY[@]:$KEEP_REVISIONS}")
  
  for ARN in "${TO_DELETE[@]}"; do
    # Extract revision number
    REVISION=$(echo $ARN | grep -oE '[0-9]+$')
    
    if [ "$DRY_RUN" = true ]; then
      echo "  [DRY RUN] Would deregister: $FAMILY:$REVISION"
    else
      echo "  Deregistering: $FAMILY:$REVISION"
      aws ecs deregister-task-definition \
        --task-definition "$ARN" \
        --region "$AWS_REGION" \
        --output text > /dev/null
    fi
  done
  
  echo ""
done

echo "============================================"
if [ "$DRY_RUN" = true ]; then
  echo "✅ Dry run complete - no changes made"
  echo "Run without --dry-run to actually delete"
else
  echo "✅ Cleanup complete"
fi
echo "============================================"

# Show current counts
echo ""
echo "Current revision counts:"
for FAMILY in "${TASK_FAMILIES[@]}"; do
  ACTIVE_COUNT=$(aws ecs list-task-definitions \
    --family-prefix "$FAMILY" \
    --status ACTIVE \
    --region "$AWS_REGION" \
    --query 'length(taskDefinitionArns)' \
    --output text)
  
  INACTIVE_COUNT=$(aws ecs list-task-definitions \
    --family-prefix "$FAMILY" \
    --status INACTIVE \
    --region "$AWS_REGION" \
    --query 'length(taskDefinitionArns)' \
    --output text)
  
  echo "  $FAMILY:"
  echo "    Active: $ACTIVE_COUNT"
  echo "    Inactive: $INACTIVE_COUNT"
done

