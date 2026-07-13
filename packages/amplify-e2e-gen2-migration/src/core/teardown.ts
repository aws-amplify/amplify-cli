import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  GetTemplateCommand,
  ListStackResourcesCommand,
  paginateListStacks,
  StackStatus,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import { AmplifyClient, ListAppsCommand, DeleteAppCommand } from '@aws-sdk/client-amplify';
import { DynamoDBClient, UpdateTableCommand } from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  paginateListObjectsV2,
  DeleteObjectsCommand,
  CreateBucketCommand,
  PutObjectCommand,
  DeleteBucketCommand,
} from '@aws-sdk/client-s3';
import { Logger } from './logger';
import type { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types';

/** Maximum number of discover-and-delete passes for stuck stacks. */
const MAX_DELETE_PASSES = 5;

/** Seconds to wait for a single stack deletion before giving up. */
const DELETE_WAIT_SECONDS = 300;

/** Seconds between polls when waiting for stack deletion. */
const DELETE_POLL_INTERVAL_SECONDS = 10;

/**
 * Deletes all AWS resources deployed by an `App` instance.
 *
 * Each phase runs to completion regardless of failures in other phases.
 * Errors are collected and reported as a single aggregate error at the end.
 */
export class Teardown {
  private readonly deploymentName: string;
  private readonly logger: Logger;
  private readonly clientConfig: { credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider };
  private readonly errors: string[] = [];
  private templateBucket: string | undefined;

  /**
   * @param deploymentName The deployment name prefix used to discover stacks.
   * @param clientConfig   SDK client config with a credentials provider.
   *                       Typically obtained from `App.getClientConfig()`.
   */
  constructor(deploymentName: string, clientConfig: { credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider }) {
    this.deploymentName = deploymentName;
    this.logger = new Logger(`teardown-${deploymentName}`);
    this.clientConfig = clientConfig;
  }

  /**
   * Delete all deployed resources.
   * @throws Error if any cleanup phase encountered failures.
   */
  async clean(): Promise<void> {
    this.logger.info('Starting teardown...');

    const cfnClient = new CloudFormationClient(this.clientConfig);
    const s3Client = new S3Client(this.clientConfig);

    const stackPrefix = `amplify-${this.deploymentName}-`;
    const allStatuses = [
      StackStatus.CREATE_COMPLETE,
      StackStatus.UPDATE_COMPLETE,
      StackStatus.UPDATE_ROLLBACK_COMPLETE,
      StackStatus.ROLLBACK_COMPLETE,
      StackStatus.DELETE_FAILED,
      StackStatus.REVIEW_IN_PROGRESS,
    ];

    const allStacks = await this.discoverStacks(cfnClient, allStatuses, (name) => name.startsWith(stackPrefix), false);
    this.logger.info(`Discovered ${allStacks.length} total stack(s) matching prefix '${stackPrefix}'`);
    for (const stackName of allStacks) {
      await this.emptyStackBuckets(cfnClient, stackName);
    }

    const rootStacks = await this.discoverStacks(cfnClient, allStatuses, (name) => name.startsWith(stackPrefix), true);
    if (rootStacks.length === 0) {
      this.logger.info('No stacks found. Nothing to tear down.');
      return;
    }
    this.logger.info(`Discovered ${rootStacks.length} root stack(s) matching prefix '${stackPrefix}'`);

    await this.createTemplateBucket(s3Client);

    await this.setDeletionPolicies(cfnClient, rootStacks);
    await this.disableDeletionProtection(cfnClient, rootStacks);

    await this.deleteGen1Stacks(cfnClient, rootStacks);
    await this.deleteAmplifyApp();
    await this.deleteGen2Sandbox(cfnClient, rootStacks);
    await this.deleteHoldingStacks(cfnClient, rootStacks);

    await this.deleteTemplateBucket(s3Client);

    if (this.errors.length > 0) {
      const summary = this.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
      throw new Error(`Teardown completed with ${this.errors.length} error(s):\n${summary}`);
    }

    this.logger.info('Teardown complete');
  }

  // ============================================================
  // Template bucket management
  // ============================================================

  /** Create a dedicated S3 bucket for uploading large CloudFormation templates. */
  private async createTemplateBucket(s3Client: S3Client): Promise<void> {
    const bucketName = `amplify-teardown-templates-${this.deploymentName}-${Date.now()}`;
    this.logger.info(`Creating template bucket: ${bucketName}`);
    try {
      await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      this.templateBucket = bucketName;
    } catch (e) {
      this.recordError('Create template bucket', e);
    }
  }

  /** Empty and delete the dedicated template bucket. */
  private async deleteTemplateBucket(s3Client: S3Client): Promise<void> {
    if (!this.templateBucket) return;
    try {
      this.logger.info(`Cleaning up template bucket: ${this.templateBucket}`);
      await this.emptyBucket(this.templateBucket);
      await s3Client.send(new DeleteBucketCommand({ Bucket: this.templateBucket }));
      this.logger.info(`Deleted template bucket: ${this.templateBucket}`);
    } catch (e) {
      this.recordError('Delete template bucket', e);
    }
  }

  /** Upload a template to S3 and return the URL for use with TemplateURL. */
  private async uploadTemplate(s3Client: S3Client, stackName: string, templateBody: string): Promise<string> {
    if (!this.templateBucket) {
      throw new Error('Template bucket was not created. Cannot upload template.');
    }
    // Stack name may be an ARN (e.g. arn:aws:cloudformation:us-east-1:123456789:stack/my-stack/guid).
    const name = stackName.startsWith('arn:') ? stackName.split('/')[1] ?? stackName : stackName;
    const key = `${name}-${Date.now()}.json`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.templateBucket,
        Key: key,
        Body: templateBody,
        ContentType: 'application/json',
      }),
    );
    const region = await s3Client.config.region();
    return `https://${this.templateBucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // ============================================================
  // Phases
  // ============================================================

  private async deleteGen1Stacks(cfnClient: CloudFormationClient, stacks: readonly string[]): Promise<void> {
    try {
      const gen1Stacks = stacks.filter((name) => !name.includes('e2e-sandbox') && !name.endsWith('-holding'));
      if (gen1Stacks.length === 0) return;
      await this.deleteStacksWithRetry(cfnClient, (name) => gen1Stacks.includes(name));
    } catch (e) {
      this.recordError('Gen1 stack cleanup', e);
    }
  }

  private async deleteAmplifyApp(): Promise<void> {
    try {
      const amplifyClient = new AmplifyClient(this.clientConfig);
      const apps = await amplifyClient.send(new ListAppsCommand({ maxResults: 25 }));
      const match = apps.apps?.find((a) => a.name === this.deploymentName);
      if (match?.appId) {
        this.logger.info(`Deleting Amplify app: ${this.deploymentName} (${match.appId})`);
        await amplifyClient.send(new DeleteAppCommand({ appId: match.appId }));
      }
    } catch (e) {
      this.recordError('Amplify app cleanup', e);
    }
  }

  private async deleteGen2Sandbox(cfnClient: CloudFormationClient, stacks: readonly string[]): Promise<void> {
    try {
      const sandboxStacks = stacks.filter((name) => name.includes('e2e-sandbox'));
      if (sandboxStacks.length === 0) return;
      await this.deleteStacksWithRetry(cfnClient, (name) => sandboxStacks.includes(name));
    } catch (e) {
      this.recordError('Gen2 stack cleanup', e);
    }
  }

  private async deleteHoldingStacks(cfnClient: CloudFormationClient, stacks: readonly string[]): Promise<void> {
    try {
      const holdingStacks = stacks.filter((name) => name.endsWith('-holding'));
      if (holdingStacks.length === 0) return;
      await this.deleteStacksWithRetry(cfnClient, (name) => holdingStacks.includes(name));
    } catch (e) {
      this.recordError('Holding stack cleanup', e);
    }
  }

  // ============================================================
  // Deletion policy toggle
  // ============================================================

  /** Set DeletionPolicy to Delete on every resource in the given stacks (recursively). */
  private async setDeletionPolicies(cfnClient: CloudFormationClient, stacks: readonly string[]): Promise<void> {
    try {
      for (const stackName of stacks) {
        await this.setDeletionPolicyForStack(cfnClient, stackName);
      }
    } catch (e) {
      this.recordError('Set deletion policies', e);
    }
  }

  private async setDeletionPolicyForStack(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    await this.toggleDeletionPolicy(cfnClient, stackName);

    const resources = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));
    for (const r of resources.StackResourceSummaries ?? []) {
      if (r.ResourceType === 'AWS::CloudFormation::Stack' && r.PhysicalResourceId) {
        await this.setDeletionPolicyForStack(cfnClient, r.PhysicalResourceId);
      }
    }
  }

  private async toggleDeletionPolicy(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    try {
      const { TemplateBody } = await cfnClient.send(new GetTemplateCommand({ StackName: stackName, TemplateStage: 'Original' }));
      if (!TemplateBody) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const template = JSON.parse(TemplateBody);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const resources: Record<string, Record<string, unknown>> | undefined = template.Resources;
      if (!resources) return;

      let modified = false;
      for (const resource of Object.values(resources)) {
        if (resource.DeletionPolicy && resource.DeletionPolicy !== 'Delete') {
          resource.DeletionPolicy = 'Delete';
          modified = true;
        }
      }

      if (!modified) return;

      // Preserve existing parameters as-is.
      const { Stacks } = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const existingParams = (Stacks?.[0]?.Parameters ?? []).map((p) => ({
        ParameterKey: p.ParameterKey,
        UsePreviousValue: true,
      }));

      const templateJson = JSON.stringify(template);
      const s3Client = new S3Client(this.clientConfig);
      const templateUrl = await this.uploadTemplate(s3Client, stackName, templateJson);

      this.logger.info(`Updating DeletionPolicy of stateful resources in stack ${stackName} to 'Delete'`);

      await cfnClient.send(
        new UpdateStackCommand({
          StackName: stackName,
          TemplateURL: templateUrl,
          Parameters: existingParams,
          Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
        }),
      );

      await this.waitForUpdate(cfnClient, stackName);
    } catch (e) {
      if ((e as Error).message?.includes('No updates are to be performed')) {
        return;
      }
      this.recordError(`Toggle DeletionPolicy (${stackName})`, e);
    }
  }

  /** Wait for a stack update to complete. */
  private async waitForUpdate(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    this.logger.info(`Waiting for stack update: ${stackName}`);
    const deadline = Date.now() + DELETE_WAIT_SECONDS * 1000;
    while (Date.now() < deadline) {
      const { Stacks } = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
      const status = Stacks?.[0]?.StackStatus;
      if (status === StackStatus.UPDATE_COMPLETE || status === StackStatus.UPDATE_ROLLBACK_COMPLETE) return;
      await sleep(DELETE_POLL_INTERVAL_SECONDS * 1000);
    }
    this.recordError(`Wait for update (${stackName})`, new Error('Timed out'));
  }

  // ============================================================
  // Deletion protection
  // ============================================================

  /** Disable deletion protection on DynamoDB tables and Cognito User Pools in the given stacks. */
  private async disableDeletionProtection(cfnClient: CloudFormationClient, stacks: readonly string[]): Promise<void> {
    try {
      for (const stackName of stacks) {
        await this.disableProtectionForStack(cfnClient, stackName);
      }
    } catch (e) {
      this.recordError('Disable deletion protection', e);
    }
  }

  /** Discover DynamoDB tables and User Pools in a stack (recursively) and disable their deletion protection. */
  private async disableProtectionForStack(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    const resources = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));
    for (const r of resources.StackResourceSummaries ?? []) {
      if (!r.PhysicalResourceId) continue;

      if (r.ResourceType === 'AWS::DynamoDB::Table') {
        await this.disableDynamoDbDeletionProtection(r.PhysicalResourceId);
      } else if (r.ResourceType === 'AWS::CloudFormation::Stack') {
        await this.disableProtectionForStack(cfnClient, r.PhysicalResourceId);
      }
    }
  }

  /** Disable DeletionProtectionEnabled on a DynamoDB table. */
  private async disableDynamoDbDeletionProtection(tableName: string): Promise<void> {
    try {
      const ddb = new DynamoDBClient(this.clientConfig);
      this.logger.info(`Disabling deletion protection on DynamoDB table: ${tableName}`);
      await ddb.send(new UpdateTableCommand({ TableName: tableName, DeletionProtectionEnabled: false }));
    } catch (e) {
      this.recordError(`Disable DynamoDB deletion protection (${tableName})`, e);
    }
  }

  // ============================================================
  // Stack deletion engine
  // ============================================================

  /**
   * Discover all stacks matching a name predicate, regardless of whether
   * they are root or nested. After a parent is deleted with
   * `RetainResources`, its formerly-nested children become orphans that
   * must be cleaned up in subsequent passes.
   */
  private async discoverStacks(
    cfnClient: CloudFormationClient,
    statusFilter: StackStatus[],
    predicate: (name: string) => boolean,
    ignoreNested: boolean,
  ): Promise<string[]> {
    const stacks: string[] = [];
    for await (const page of paginateListStacks({ client: cfnClient }, { StackStatusFilter: statusFilter })) {
      for (const stack of page.StackSummaries ?? []) {
        if (ignoreNested && stack.ParentId) {
          // nested stacks are skipped because the parent will deleted them.
          continue;
        }
        if (stack.StackName && predicate(stack.StackName)) {
          stacks.push(stack.StackName);
        }
      }
    }
    return stacks;
  }

  /**
   * Repeatedly discover and delete stacks matching a predicate.
   *
   * Each pass:
   *   1. Re-discover all matching stacks (picks up orphaned nested stacks
   *      from previous passes).
   *   2. Empty all S3 buckets in every discovered stack.
   *   3. Issue `DeleteStack` on each.
   *   4. Wait for DELETE_COMPLETE or DELETE_FAILED.
   *   5. For failures, retry with `RetainResources` for stuck resources.
   *
   * Repeats up to {@link MAX_DELETE_PASSES} times. Each pass peels off one
   * layer:
   *   - Pass 1: root stack R fails because child stack C fails → retain C,
   *     R deletes successfully.
   *   - Pass 2: re-discover finds C (now orphaned, in DELETE_FAILED) →
   *     retain its stuck custom resource X, C deletes successfully.
   *   - Pass 3: if X was itself a nested stack, repeat.
   */
  private async deleteStacksWithRetry(cfnClient: CloudFormationClient, predicate: (name: string) => boolean): Promise<void> {
    const statusFilter = [
      StackStatus.CREATE_COMPLETE,
      StackStatus.UPDATE_COMPLETE,
      StackStatus.UPDATE_ROLLBACK_COMPLETE,
      StackStatus.ROLLBACK_COMPLETE,
      StackStatus.DELETE_FAILED,
      StackStatus.REVIEW_IN_PROGRESS,
    ];
    for (let pass = 0; pass < MAX_DELETE_PASSES; pass++) {
      const stacks = await this.discoverStacks(cfnClient, statusFilter, predicate, true);
      if (stacks.length === 0) return;

      if (pass > 0) {
        this.logger.info(`Delete pass ${pass + 1} for ${stacks.length} remaining stack(s)`);
      }

      for (const stackName of stacks) {
        this.logger.info(`Deleting stack: ${stackName}`);
        try {
          await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
        } catch (e) {
          this.recordError(`Delete stack (${stackName})`, e);
        }
      }

      for (const stackName of stacks) {
        if (await this.waitForDelete(cfnClient, stackName)) continue;

        const failedResources = await this.listFailedResources(cfnClient, stackName);
        if (failedResources.length > 0) {
          this.logger.info(`Retrying ${stackName} with retained resources: ${failedResources.join(', ')}`);
          try {
            await cfnClient.send(new DeleteStackCommand({ StackName: stackName, RetainResources: failedResources }));
          } catch (e) {
            this.recordError(`Retry delete (${stackName})`, e);
          }
          await this.waitForDelete(cfnClient, stackName);
        }
      }
    }

    // Final check: anything still around after all passes is an error.
    const leftover = await this.discoverStacks(cfnClient, statusFilter, predicate, false);
    for (const stackName of leftover) {
      this.recordError('Stack delete', new Error(`${stackName} could not be deleted after ${MAX_DELETE_PASSES} passes`));
    }
  }

  // ============================================================
  // Low-level helpers
  // ============================================================

  /**
   * Wait for a stack to reach DELETE_COMPLETE. Returns true on success,
   * false on timeout or DELETE_FAILED.
   */
  private async waitForDelete(cfnClient: CloudFormationClient, stackName: string): Promise<boolean> {
    this.logger.info(`Waiting for stack deletion: ${stackName}`);
    const deadline = Date.now() + DELETE_WAIT_SECONDS * 1000;
    while (Date.now() < deadline) {
      try {
        const { Stacks } = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
        const status = Stacks?.[0]?.StackStatus;
        if (status === StackStatus.DELETE_COMPLETE) return true;
        if (status === StackStatus.DELETE_FAILED) return false;
      } catch (e) {
        // Stack not found means it was successfully deleted.
        if ((e as Error).message?.includes('does not exist')) return true;
        throw e;
      }
      await sleep(DELETE_POLL_INTERVAL_SECONDS * 1000);
    }
    return false;
  }

  /** List logical IDs of resources in DELETE_FAILED for a stack. */
  private async listFailedResources(cfnClient: CloudFormationClient, stackName: string): Promise<string[]> {
    try {
      const { StackResources } = await cfnClient.send(new DescribeStackResourcesCommand({ StackName: stackName }));
      return (
        (StackResources ?? [])
          .filter((r) => r.ResourceStatus === 'DELETE_FAILED' && r.LogicalResourceId)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .map((r) => r.LogicalResourceId!)
      );
    } catch (e) {
      this.recordError(`List failed resources (${stackName})`, e);
      return [];
    }
  }

  /** Empty all S3 buckets owned by a CloudFormation stack. */
  private async emptyStackBuckets(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    const resources = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));
    const buckets = (resources.StackResourceSummaries ?? [])
      .filter((r) => r.ResourceType === 'AWS::S3::Bucket' && r.PhysicalResourceId)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((r) => r.PhysicalResourceId!);
    if (buckets.length === 0) return;

    for (const bucket of buckets) {
      this.logger.info(`Emptying bucket: ${bucket} (stack: ${stackName})`);
      await this.emptyBucket(bucket);
    }
  }

  /** Delete all objects in an S3 bucket. */
  private async emptyBucket(bucket: string): Promise<void> {
    const s3 = new S3Client(this.clientConfig);
    try {
      for await (const page of paginateListObjectsV2({ client: s3 }, { Bucket: bucket })) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const objects = (page.Contents ?? []).filter((o) => o.Key).map((o) => ({ Key: o.Key! }));
        if (objects.length > 0) {
          await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }));
        }
      }
    } catch (e) {
      this.recordError(`Empty bucket (${bucket})`, e);
    }
  }

  private recordError(phase: string, error: unknown): void {
    const message = `${phase}: ${(error as Error).message}`;
    this.logger.info(`${message} (continuing teardown)`);
    this.errors.push(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
