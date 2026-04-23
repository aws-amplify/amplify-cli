#!/bin/bash -e

# Trigger Gen2 Migration E2E tests using the existing AmplifyCLI-E2E-Testing project
# with a buildspec override to run only the migration tests.
#
# Usage:
#   source ./scripts/cloud-gen2-migration.sh && cloudGen2Migration

source ./scripts/cloud-cli-utils.sh
export CURR_BRANCH=$(git branch --show-current)
export E2E_ROLE_NAME=CodeBuildE2E
export E2E_PROFILE_NAME=AmplifyCLIE2E
export E2E_PROJECT_NAME=AmplifyCLI-E2E-Testing

function cloudGen2Migration {
    echo "Running Gen2 Migration E2E Tests on branch: $CURR_BRANCH"
    
    account_number=$E2E_ACCOUNT_PROD
    role_name=$E2E_ROLE_NAME
    profile_name="${E2E_PROFILE_NAME}Prod"
    
    authenticate $account_number $role_name $profile_name
    
    echo "AWS Account: $account_number"
    echo "Project: $E2E_PROJECT_NAME"
    echo "Buildspec: codebuild_specs/gen2_migration_e2e_pr_workflow.yml"
    
    RESULT=$(aws codebuild start-build-batch \
      --profile="${profile_name}" \
      --project-name $E2E_PROJECT_NAME \
      --source-version=$CURR_BRANCH \
      --buildspec-override "codebuild_specs/gen2_migration_e2e_pr_workflow.yml" \
      --environment-variables-override name=BRANCH_NAME,value=$CURR_BRANCH,type=PLAINTEXT \
      --query 'buildBatch.id' --output text)
    
    echo ""
    echo "Build started! View at:"
    echo "https://us-east-1.console.aws.amazon.com/codesuite/codebuild/$account_number/projects/$E2E_PROJECT_NAME/batch/$RESULT?region=us-east-1"
}
