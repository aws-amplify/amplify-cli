This contains deep context about validations.
This file file and the hld for migration are needed for context in next steps.

Validations are extremeley necessary at every step.
High impact for stable results.

Follow HLD and understan why validations are important.
Think like a senior dock writer at AWS and answer the prompt requests at very high standards.

Validations:

"
Validations gen2-migration 

Overview

The AmplifyGen2MigrationValidations class provides a comprehensive validation framework that ensures safe, reliable migration from Amplify Gen1 to Gen2. This framework embodies a defense-in-depth approach, performing multiple layers of verification before allowing destructive or irreversible operations. Each validation method serves as a checkpoint, preventing migration from proceeding when the environment is in an unsafe or inconsistent state.

Validation Execution Flow
Validations are invoked by migration commands in a specific order to ensure logical dependency resolution. Each command calls only the validations relevant to its operation:

Lock Command (lock.ts):
└─> validateDeploymentStatus()
└─> validateDrift()

Generate Command (generate.ts):
└─> validateLockStatus()
└─> validateWorkingDirectory()

Decommission Command (decommission.ts):
└─> validateStatefulResources(changeSet, excludeDeploymentBucket=true)



Individual Validation Methods

1. validateWorkingDirectory()

Purpose: Ensures the local Git working directory has no uncommitted changes before generating Gen2 code.

Base Technical Implementation:

const { stdout: statusOutput } = await execa('git', ['status', '—porcelain']);

The —porcelain flag produces machine-readable output where each line represents a file change

Validation Logic:

* If statusOutput.trim() is empty: Working directory is clean 
* If statusOutput contains any content: Uncommitted changes exist 


Error Handling:
Throws AmplifyError with resolution guidance: "Commit or stash your changes before proceeding with migration."

Why This Matters?
The generate command overwrites the amplify/ directory with Gen2 code. Without a clean working tree, customers cannot easily revert if generation fails or produces unexpected results. Git provides the safety net and this validation ensures it's in place.

Edge Case Handling:

* No Git Repository: If the project isn't under Git control, this validation is skipped (handled by execa error catching)
* Gitignored Files: Untracked files that are gitignored don't appear in porcelain output and won't block validation


2. validateDeploymentStatus()

Purpose: Confirms the CloudFormation root stack is in a stable, deployable state before migration operations.

Base Technical Implementation:

const response = await cfnClient.send(new DescribeStacksCommand({ StackName: this.rootStackName }));
const stackStatus = response.Stacks[0].StackStatus;
const validStatuses = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'UPDATE_ROLLBACK_COMPLETE'];

Validation Logic:
Calls DescribeStacksCommand to verify the CloudFormation root stack exists and is in a stable state (UPDATE_COMPLETE, CREATE_COMPLETE, or UPDATE_ROLLBACK_COMPLETE), throwing errors if the stack is missing or in a transitional/failed state that would prevent migration operations.

CloudFormation Stack States:
Acceptable States:

* CREATE_COMPLETE: Stack was successfully created and never updated
* UPDATE_COMPLETE: Stack was successfully updated to its current state
* UPDATE_ROLLBACK_COMPLETE: Stack update failed and rolled back successfully (edge case for resuming migration)

Error Handling:
Two error types are thrown:

* StackNotFoundError: Stack doesn't exist in CloudFormation (project not deployed)
* StackStateError: Stack exists but is in an invalid state for migration


3. validateStatefulResources()

Purpose: Prevents accidental deletion of resources containing customer data by analyzing CloudFormation change sets.

Technical Implementation:
This is the most complex validation, performing deep recursive analysis of CloudFormation stacks.

Phase 1: Change Set Analysis


for (const change of changeSet.Changes) {
  if (change.Type === 'Resource' && change.ResourceChange?.Action === 'Remove')


Iterates through every change in the provided CloudFormation change set, identifying resources marked for deletion (Action === 'Remove').
.
Phase 2: Deployment Bucket Exclusion


const deploymentBucketName = excludeDeploymentBucket
  ? stateManager.getTeamProviderInfo()[this.envName].awscloudformation.DeploymentBucketName
  : undefined;

When excludeDeploymentBucket is true (used during decommission), the validation skips the Amplify deployment bucket. This bucket stores CloudFormation templates and Lambda deployment packages, it's safe to delete during decommission since it contains no customer data.

Phase 3: Nested Stack Recursion


if (change.ResourceChange.ResourceType === 'AWS::CloudFormation::Stack') {
  const nestedResources = await this.getStatefulResources(
    change.ResourceChange.PhysicalResourceId,
    change.ResourceChange.LogicalResourceId,
  );
  statefulRemoves.push(...nestedResources);
}


Amplify uses nested stacks extensively. Each category (Auth, API, Storage) is a nested stack. When a nested stack is marked for deletion, the validation recursively scans its resources using getStatefulResources().

Phase 4: Stateful Resource Detection


else if (STATEFUL_RESOURCES.has(change.ResourceChange.ResourceType)) {
  statefulRemoves.push({
    category,
    resourceType: change.ResourceChange.ResourceType,
    physicalId,
  });
}


Checks if the resource type exists in the STATEFUL_RESOURCES set, which contains 30+ AWS resource types known to store data:

* AWS::DynamoDB::Table: Database tables
* AWS::S3::Bucket: Object storage
* AWS::Cognito::UserPool: User authentication data
* AWS::RDS::DBInstance: Relational databases
* AWS::Logs::LogGroup: Application logs

And 25+ more...

Phase 5: Result Presentation
If stateful resources are found, they're displayed in a formatted table:


┌──────────┬─────────────────────────┬──────────────────────────────────┐
│ Category │ Resource Type           │ Physical ID                      │
├──────────┼─────────────────────────┼──────────────────────────────────┤
│ Auth     │ AWS::Cognito::UserPool  │ us-east-1_AbCdEfGhI              │
│ Storage  │ AWS::DynamoDB::Table    │ Product-xyz123-prod              │
│ Storage  │ AWS::S3::Bucket         │ myapp-user-uploads-prod          │
└──────────┴─────────────────────────┴──────────────────────────────────┘


Error Handling:
Throws DestructiveMigrationError with resolution: "Review the resources above and ensure data is backed up before proceeding."

Why This Matters?
This validation is the last line of defense against data loss. It catches scenarios where:

* Refactor step failed to move stateful resources to Gen2
* Customer is attempting to decommission before completing migration
* CloudFormation template changes would unexpectedly delete data

4. validateLockStatus()

Purpose: Verifies the Gen1 environment is locked (stack policy applied) before proceeding with migration operations.

Base Technical Implementation:

const { StackPolicyBody } = await cfnClient.send(new GetStackPolicyCommand({ StackName: this.rootStackName }));

Policy Verification:
The method performs two checks:

* Policy Existence: Confirms a stack policy is attached
* Policy Content: Validates the policy matches the expected deny-all policy



const expectedPolicy = {
  Statement: [{
    Effect: 'Deny',
    Action: 'Update:*',
    Principal: '*',
    Resource: '*',
  }],
};
if (JSON.stringify(currentPolicy) !== JSON.stringify(expectedPolicy)) {
  throw new AmplifyError('MigrationError', {
    message: 'Stack policy does not match expected lock policy',
  });
}


String Comparison Rationale:
JSON string comparison is used instead of deep object comparison for simplicity and reliability. Since the expected policy is fixed and known, string comparison is sufficient and avoids dependency on deep-equal libraries.

Error Handling:
Two error scenarios:

* No Policy: Stack is not locked, customer must run amplify gen2-migration lock 
* Wrong Policy: Stack has a policy but it's not the migration lock policy, customer must re-run lock command

Why This Matters?
Many migration commands (generate, refactor) assume the Gen1 environment is frozen. If the environment is unlocked, concurrent deployments could invalidate generated Gen2 code or cause refactor operations to fail. This validation enforces the prerequisite.

Private Helper Methods


1. getStatefulResources()

Purpose: Recursively scans nested CloudFormation stacks to build a complete inventory of stateful resources.

Technical Implementation:

Pagination Handling:

do {
  const response = await cfn.send(new ListStackResourcesCommand({ StackName: stackName, NextToken: nextToken }));
  nextToken = response.NextToken;
} while (nextToken);

CloudFormation's ListStackResources API returns up to 100 resources per call. The method paginates through all pages to ensure no resources are missed.

Nested Stack Discovery:

if (resource.ResourceType === 'AWS::CloudFormation::Stack') {
  nestedStackTasks.push({
    physicalId: resource.PhysicalResourceId,
    logicalId: resource.LogicalResourceId,
  });
}

Identifies nested stacks and queues them for recursive scanning.

Parallel Recursion with Rate Limiting:

const nestedResults = await Promise.all(
  nestedStackTasks.map((task) =>
    this.limiter.schedule(() => {
      return this.getStatefulResources(task.physicalId, task.logicalId);
    }),
  ),
);

Scans nested stacks in parallel (up to 3 concurrent) using the Bottleneck limiter. This dramatically reduces validation time for environments with many nested stacks while respecting API rate limits.

Retry Configuration:

const cfn = new CloudFormationClient({
  maxAttempts: 5,
  retryMode: 'adaptive',
});

Configures exponential backoff with adaptive retry mode, which adjusts retry behavior based on throttling responses from CloudFormation.

2. extractCategory()

Purpose: Determines which Amplify category a CloudFormation resource belongs to based on its logical ID.

Technical Implementation:

private extractCategory(logicalId: string): string {
  const idLower = logicalId.toLowerCase();
  if (idLower.includes('auth')) return 'Auth';
  if (idLower.includes('storage')) return 'Storage';
  // ... 10+ more categories
  return 'other';
}

Pattern Matching Strategy:
Uses substring matching on lowercase logical IDs. Amplify's naming conventions include the category name in logical IDs (e.g., authUserPool, storageS3Bucket), making this heuristic reliable.

Supported Categories:

* Auth, Storage, Function, Api, Analytics
* Hosting, Notifications, Interactions, Predictions
* Geo, Custom, Core Infrastructure


Fallback Behavior:
Returns 'other' for resources that don't match known patterns, ensuring the method never fails.

Why This Matters:
Category information helps customers understand which part of their application contains stateful resources, making validation output more actionable.
"
