import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  paginateListStacks,
  StackStatus,
} from '@aws-sdk/client-cloudformation';
import { AmplifyClient, ListAppsCommand, DeleteAppCommand } from '@aws-sdk/client-amplify';
import { S3Client, paginateListObjectsV2, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { App } from './app';

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
 *
 * Deletion order matters:
 *   1. Gen1 CloudFormation stacks — deleted first because the migration may
 *      have moved resources between stacks. Deleting Gen2 first can leave
 *      Gen1 stacks referencing resources that no longer exist.
 *   2. Amplify console app.
 *   3. Gen2 sandbox (via `ampx sandbox delete`).
 *   4. Holding stacks created during the refactor step.
 */
export class Teardown {
  private readonly app: App;
  private readonly errors: string[] = [];

  constructor(app: App) {
    this.app = app;
  }

  /**
   * Delete all deployed resources.
   * @throws Error if any cleanup phase encountered failures.
   */
  async clean(): Promise<void> {
    this.app.logger.info('Starting teardown...');

    await this.app.refreshCredentials();

    await this.deleteGen1Stacks();
    await this.deleteAmplifyApp();
    await this.deleteGen2Sandbox();
    await this.deleteHoldingStacks();

    if (this.errors.length > 0) {
      const summary = this.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n');
      throw new Error(`Teardown completed with ${this.errors.length} error(s):\n${summary}`);
    }

    this.app.logger.info('Teardown complete');
  }

  // ============================================================
  // Phases
  // ============================================================

  private async deleteGen1Stacks(): Promise<void> {
    try {
      this.app.logger.info('Deleting Gen1 CloudFormation stacks...');
      const cfnClient = new CloudFormationClient(this.app.getClientConfig());
      const stackPrefix = `amplify-${this.app.deploymentName}-`;
      await this.deleteStacksWithRetry(
        cfnClient,
        [
          StackStatus.CREATE_COMPLETE,
          StackStatus.UPDATE_COMPLETE,
          StackStatus.UPDATE_ROLLBACK_COMPLETE,
          StackStatus.ROLLBACK_COMPLETE,
          StackStatus.DELETE_FAILED,
        ],
        (name) => name.startsWith(stackPrefix),
      );
    } catch (e) {
      this.recordError('Gen1 stack cleanup', e);
    }
  }

  private async deleteAmplifyApp(): Promise<void> {
    try {
      this.app.logger.info('Deleting Amplify console app...');
      const amplifyClient = new AmplifyClient(this.app.getClientConfig());
      const apps = await amplifyClient.send(new ListAppsCommand({ maxResults: 25 }));
      const match = apps.apps?.find((a) => a.name === this.app.deploymentName);
      if (match?.appId) {
        await amplifyClient.send(new DeleteAppCommand({ appId: match.appId }));
        this.app.logger.info(`Deleted Amplify app: ${this.app.deploymentName} (${match.appId})`);
      } else {
        this.app.logger.info(`Amplify app ${this.app.deploymentName} not found (may already be deleted)`);
      }
    } catch (e) {
      this.recordError('Amplify app cleanup', e);
    }
  }

  private async deleteGen2Sandbox(): Promise<void> {
    try {
      this.app.logger.info('Deleting Gen2 CloudFormation stacks...');
      const cfnClient = new CloudFormationClient(this.app.getClientConfig());
      const stackPrefix = `amplify-${this.app.deploymentName}-`;
      await this.deleteStacksWithRetry(
        cfnClient,
        [
          StackStatus.CREATE_COMPLETE,
          StackStatus.UPDATE_COMPLETE,
          StackStatus.UPDATE_ROLLBACK_COMPLETE,
          StackStatus.ROLLBACK_COMPLETE,
          StackStatus.DELETE_FAILED,
        ],
        (name) => name.startsWith(stackPrefix) && name.includes('e2e-sandbox'),
      );
    } catch (e) {
      this.recordError('Gen2 stack cleanup', e);
    }
  }

  private async deleteHoldingStacks(): Promise<void> {
    try {
      this.app.logger.info('Deleting holding stacks...');
      const cfnClient = new CloudFormationClient(this.app.getClientConfig());
      await this.deleteStacksWithRetry(
        cfnClient,
        [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.REVIEW_IN_PROGRESS],
        (name) => name.includes(this.app.deploymentName) && name.endsWith('-holding'),
      );
    } catch (e) {
      this.recordError('Holding stack cleanup', e);
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
  ): Promise<string[]> {
    const stacks: string[] = [];
    for await (const page of paginateListStacks({ client: cfnClient }, { StackStatusFilter: statusFilter })) {
      for (const stack of page.StackSummaries ?? []) {
        if (stack.ParentId) {
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
  private async deleteStacksWithRetry(
    cfnClient: CloudFormationClient,
    statusFilter: StackStatus[],
    predicate: (name: string) => boolean,
  ): Promise<void> {
    for (let pass = 0; pass < MAX_DELETE_PASSES; pass++) {
      const stacks = await this.discoverStacks(cfnClient, statusFilter, predicate);
      if (stacks.length === 0) return;

      if (pass > 0) {
        this.app.logger.info(`Delete pass ${pass + 1} for ${stacks.length} remaining stack(s)`);
      }

      for (const stackName of stacks) {
        await this.emptyStackBuckets(cfnClient, stackName);
      }

      for (const stackName of stacks) {
        this.app.logger.info(`Deleting stack: ${stackName}`);
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
          this.app.logger.info(`Retrying ${stackName} with retained resources: ${failedResources.join(', ')}`);
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
    const leftover = await this.discoverStacks(cfnClient, statusFilter, predicate);
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

    const s3 = new S3Client(this.app.getClientConfig());
    for (const bucket of buckets) {
      try {
        this.app.logger.info(`Emptying bucket: ${bucket}`);
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
  }

  private recordError(phase: string, error: unknown): void {
    const message = `${phase}: ${(error as Error).message}`;
    this.app.logger.info(`${message} (continuing teardown)`);
    this.errors.push(message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
