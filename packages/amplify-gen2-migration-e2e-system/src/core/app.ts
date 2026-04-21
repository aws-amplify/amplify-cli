import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { getCLIPath, initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { Logger, LogLevel } from './logger';
import { Git } from './git';
import * as snapshot from './snapshot';
import { sanitize } from './sanitize';
import { normalize } from './normalize';
import { CredentialManager, CredentialSource } from './credentials';
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStackResourcesCommand,
  ListStackResourcesCommand,
  paginateListStacks,
  StackStatus,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import { AmplifyClient, ListAppsCommand, DeleteAppCommand } from '@aws-sdk/client-amplify';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const MIGRATION_TARGET_DIR = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'output-apps');
const MIGRATION_SNAPSHOT_DIR = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'snapshots');
const MIGRATION_APPS_DIR = path.join(__dirname, '..', '..', '..', '..', 'amplify-migration-apps');

interface MigrationConfig {
  /**
   * Per-step configuration overrides.
   */
  readonly lock?: StepConfig;
  readonly refactor?: RefactorConfig;
}

interface StepConfig {
  /**
   * Pass --skip-validations to the step.
   */
  readonly skipValidations?: boolean;
}

interface RefactorConfig {
  /**
   * Skip the refactor step entirely (e.g., when a sub-feature breaks refactoring).
   */
  readonly skip?: boolean;
  /**
   * Pass --skip-validations to the refactor step.
   */
  readonly skipValidations?: boolean;
}

/**
 * Represents a migration app deployed to a temporary directory.
 * Exposes all lifecycle operations as public methods.
 */
export class App {
  private readonly deploymentName: string;
  private readonly gen2BranchName: string;
  private readonly gen1BranchName = 'main';

  private readonly sourceAppPath: string;
  private readonly envName: string;
  private readonly migrationConfig: MigrationConfig;
  private readonly snapshotAppPath: string;

  /**
   * Whether the refactor step should be skipped entirely for this app.
   */
  public get skipRefactor(): boolean {
    return this.migrationConfig.refactor?.skip === true;
  }
  private readonly amplifyPath: string;
  private readonly credentials: CredentialManager;

  public readonly logger: Logger;
  public readonly targetAppPath: string;

  private readonly git: Git;

  constructor(public readonly appName: string, credentialSource: CredentialSource, verbose = false) {
    this.sourceAppPath = path.join(MIGRATION_APPS_DIR, appName);
    if (!fs.existsSync(this.sourceAppPath)) {
      throw new Error(`App not found: ${this.sourceAppPath}`);
    }

    this.deploymentName = generateTimeBasedName(appName);
    this.logger = new Logger(this.deploymentName, verbose ? LogLevel.DEBUG : LogLevel.INFO);

    this.envName = generateRandomEnvName();
    this.gen2BranchName = `gen2-${this.envName}`;
    this.amplifyPath = getCLIPath(true);

    const region = process.env.CLI_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
    const generatedProfile = `amplify-migration-e2e-${this.deploymentName}`;
    this.credentials = new CredentialManager(credentialSource, region, generatedProfile, this.logger);

    // temporary directory to store snapshot of each step
    // callers can then call .updateSnapshot to copy over the snapshots
    // into the original source path
    this.snapshotAppPath = path.join(MIGRATION_SNAPSHOT_DIR, this.deploymentName);
    fs.mkdirSync(this.snapshotAppPath, { recursive: true });

    // Copy source to temp directory
    this.targetAppPath = path.join(MIGRATION_TARGET_DIR, this.deploymentName);
    fs.mkdirSync(this.targetAppPath, { recursive: true });
    fs.copySync(this.sourceAppPath, this.targetAppPath, {
      filter: (src: string) => !src.includes('_snapshot') && !src.includes('node_modules'),
    });

    this.logger.info(`App directory: ${this.targetAppPath}`);
    this.logger.info(`Snapshot directory: ${this.snapshotAppPath}`);

    // Update package.json name for predictable Gen2 stack naming
    const packageJsonPath = path.join(this.targetAppPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { name: string };
    packageJson.name = this.deploymentName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

    this.migrationConfig = this.loadMigrationConfig();
    this.git = new Git(this.targetAppPath, this.logger);

    this.logger.info(`Deployment name: ${this.deploymentName}, env: ${this.envName}`);
  }

  // ============================================================
  // Gen1 Lifecycle
  // ============================================================

  /**
   * Run `amplify init` to initialize the Gen1 project.
   */
  public async init(): Promise<void> {
    await this.credentials.refresh();
    this.logger.info('amplify init');
    const mainTsx = path.join(this.sourceAppPath, 'src', 'main.tsx');
    const framework = fs.existsSync(mainTsx) ? 'react' : 'none';

    await initJSProjectWithProfile(this.targetAppPath, {
      name: this.deploymentName,
      envName: this.envName,
      editor: 'Visual Studio Code',
      framework,
      srcDir: 'src',
      distDir: 'dist',
      buildCmd: 'npm run build',
      startCmd: 'npm run start',
      disableAmplifyAppCreation: process.env.IS_AMPLIFY_CI === 'true',
      profileName: this.credentials.profile,
    });
    this.logger.info('amplify init completed');
  }

  /**
   * Restore the pre-generate snapshot into the amplify/ directory.
   */
  public async configure(): Promise<void> {
    this.logger.info('Configuring categories...');
    const restore = (p: string): void => {
      fs.removeSync(path.join(this.targetAppPath, 'amplify', p));
      fs.copySync(path.join(this.targetAppPath, '.amplify.init', p), path.join(this.targetAppPath, 'amplify', p));
    };

    const metaPath = path.join(this.targetAppPath, 'amplify', 'backend', 'amplify-meta.json');
    const oldMeta = JSON.parse(fs.readFileSync(metaPath, { encoding: 'utf-8' })) as { providers: Record<string, unknown> };

    fs.moveSync(path.join(this.targetAppPath, 'amplify'), path.join(this.targetAppPath, '.amplify.init'));
    fs.copySync(path.join(this.sourceAppPath, '_snapshot.pre.generate', 'amplify'), path.join(this.targetAppPath, 'amplify'));

    restore('#current-cloud-backend');
    restore('.config');
    restore('team-provider-info.json');

    const newMeta = JSON.parse(fs.readFileSync(metaPath, { encoding: 'utf-8' })) as { providers: Record<string, unknown> };
    newMeta.providers['awscloudformation'] = oldMeta.providers['awscloudformation'];
    fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2));
    fs.removeSync(path.join(this.targetAppPath, '.amplify.init'));
    this.removeGitignoreLine('amplifyconfiguration.json');
    this.logger.info('Categories configured');
  }

  /**
   * Run `npm install` in the target directory.
   */
  public async installDeps(): Promise<void> {
    this.logger.info('Installing dependencies...');
    await execa('npm', ['install'], { cwd: this.targetAppPath });
    this.logger.info('Finished installing dependencies');
  }

  /**
   * Run `amplify status`.
   */
  public async status(): Promise<void> {
    this.logger.info('amplify status');
    await this.runAmplify(['status'], { stdio: 'inherit' });
    this.logger.info('amplify status completed');
  }

  /**
   * Run `amplify push --yes`.
   */
  public async push(): Promise<void> {
    await this.credentials.refresh();
    this.logger.info('amplify push');
    await this.runAmplify(['push', '--yes', '--debug']);
    this.logger.info('amplify push completed');
  }

  /**
   * Runs all steps to fully deploy the Gen1 app.
   */
  public async deploy(): Promise<void> {
    await this.git.init();
    await this.init();
    await this.configure();
    await this.installDeps();
    await this.status();
    await this.prePush();
    await this.push();
    await this.postPush();
    await this.testGen1();

    this.logger.info(`Capturing pre.generate snapshot`);
    console.log('');
    await snapshot.capturePreGenerate(this.targetAppPath, this.snapshotAppPath);
    console.log('');
  }

  // ============================================================
  // Gen2 Migration
  // ============================================================

  /**
   * Runs the full migration workflow
   */
  public async migrate(): Promise<void> {
    await this.deploy();
    await this.assess();
    await this.lock();
    await this.git.checkout(this.gen2BranchName, true);
    await this.generate();

    this.logger.info(`Capturing post.generate snapshot`);
    console.log('');
    await snapshot.capturePostGenerate(this.targetAppPath, this.snapshotAppPath);
    console.log('');

    await this.git.commit('chore: generate');
    await this.installDeps();
    await this.git.commit('chore: install dependencies');
    await this.postGenerate();
    await this.git.diff();
    await this.git.commit('chore: post generate');
    await this.preSandbox();
    const gen2StackName = await this.deployGen2Sandbox();
    await this.postSandbox(gen2StackName);

    await this.testGen1();
    await this.testGen2();

    const gen1StackName = await this.findGen1RootStack();

    this.logger.info(`Capturing pre.refactor snapshot`);
    console.log('');
    await snapshot.capturePreRefactor(gen1StackName, gen2StackName, this.snapshotAppPath);
    console.log('');

    if (this.skipRefactor) {
      this.logger.info('Skipping refactor (configured in migration/config.json)');
      return;
    }

    await this.git.checkout(this.gen1BranchName, false);
    await this.refactor(gen2StackName);

    this.logger.info(`Capturing post.refactor snapshot`);
    console.log('');
    await snapshot.capturePostRefactor(this.targetAppPath, this.snapshotAppPath);
    console.log('');

    await this.testGen1();
    await this.testGen2();

    await this.git.checkout(this.gen2BranchName, false);
    await this.postRefactor();
    await this.git.diff();
    await this.git.commit('chore: post refactor');

    await this.deployGen2Sandbox();

    await this.testGen1();
    await this.testGen2();

    await this.testSharedData();
  }

  /**
   * Run `amplify gen2-migration assess`.
   */
  public async assess(): Promise<void> {
    await this.credentials.refresh();
    await this.runMigrationStep('assess');
  }

  /**
   * Run `amplify gen2-migration lock`.
   */
  public async lock(): Promise<void> {
    await this.credentials.refresh();
    const extraArgs = this.migrationConfig.lock?.skipValidations ? ['--skip-validations'] : [];
    await this.runMigrationStep('lock', extraArgs);
  }

  /**
   * Run `amplify gen2-migration generate`.
   */
  public async generate(): Promise<void> {
    await this.credentials.refresh();
    await this.runMigrationStep('generate');
    this.removeGitignoreLine('amplify_outputs*');
  }

  /**
   * Run `amplify gen2-migration refactor`.
   */
  public async refactor(gen2StackName: string): Promise<void> {
    await this.credentials.refresh();
    const extraArgs = ['--to', gen2StackName];
    if (this.migrationConfig.refactor?.skipValidations) {
      extraArgs.push('--skip-validations');
    }
    await this.runMigrationStep('refactor', extraArgs);
  }

  /**
   * Deploy Gen2 app using `npx ampx sandbox --once`.
   * Returns the Gen2 root stack name.
   */
  public async deployGen2Sandbox(): Promise<string> {
    await this.credentials.refresh();
    this.logger.info('Deploying Gen2 app using ampx sandbox...');
    const startTime = Date.now();

    const result = await execa('npx', ['ampx', 'sandbox', '--once', '--identifier', 'e2e'], {
      cwd: this.targetAppPath,
      reject: false,
      stdio: 'inherit',
      env: { ...process.env, AWS_BRANCH: this.gen2BranchName },
    });

    if (result.exitCode !== 0) {
      throw new Error('ampx sandbox failed');
    }

    this.logger.info(`ampx sandbox completed (${Date.now() - startTime}ms)`);

    const stackPrefix = `amplify-${this.deploymentName}-e2e-sandbox`;
    return this.findGen2RootStack(stackPrefix);
  }

  // ============================================================
  // App Tests
  // ============================================================

  /**
   * Run the Jest tests against the Gen1 config.
   */
  public async testGen1(): Promise<void> {
    await this.git.checkout(this.gen1BranchName, false);
    await this.runNpmScript('test:gen1');
  }

  /**
   * Run the Jest tests against the Gen2 config.
   */
  public async testGen2(): Promise<void> {
    await this.git.checkout(this.gen2BranchName, false);
    await this.runNpmScript('test:gen2');
  }

  // ============================================================
  // App Hooks
  // ============================================================

  /**
   * Run the Jest tests that validate stateful resources are shared.
   */
  public async testSharedData(): Promise<void> {
    await this.git.checkout(this.gen2BranchName, false);

    // these tests require both config files, so pull the gen1 config into the gen2 branch
    await this.git.run('checkout', this.gen1BranchName, '--', 'src/amplifyconfiguration.json');
    await this.runNpmScript('test:shared-data');
  }

  // ============================================================
  // App Hooks
  // ============================================================

  /**
   * Run the pre-push script.
   */
  public async prePush(): Promise<void> {
    await this.runNpmScript('pre-push');
  }

  /**
   * Run the post-push script.
   */
  public async postPush(): Promise<void> {
    await this.runNpmScript('post-push');
  }

  /**
   * Run the post-generate script.
   */
  public async postGenerate(): Promise<void> {
    await this.runNpmScript('post-generate', { AWS_BRANCH: 'sandbox' });
  }

  /**
   * Run the post-refactor script.
   */
  public async postRefactor(): Promise<void> {
    await this.runNpmScript('post-refactor');
  }

  /**
   * Run the post-sandbox script with the Gen2 root stack name.
   */
  public async postSandbox(gen2StackName: string): Promise<void> {
    await this.runNpmScript('post-sandbox', { APP_GEN2_ROOT_STACK_NAME: gen2StackName });
  }

  /**
   * Run the pre-sandbox script.
   */
  public async preSandbox(): Promise<void> {
    await this.runNpmScript('pre-sandbox');
  }

  /**
   * Sanitizes and copies captured snapshots back to the source app directory.
   */
  public updateSnapshots(): void {
    this.logger.info(`Normalizing snapshots`);
    normalize(path.basename(this.sourceAppPath), this.snapshotAppPath);
    this.logger.info(`Sanitizing snapshots`);
    sanitize(path.basename(this.sourceAppPath), this.snapshotAppPath);
    for (const snapshot of fs.readdirSync(this.snapshotAppPath).filter((f) => f.includes('_snapshot'))) {
      const sourceSnapshotPath = path.join(this.sourceAppPath, snapshot);
      this.logger.info(`Updating snapshot: ${sourceSnapshotPath}`);
      if (fs.existsSync(sourceSnapshotPath)) {
        fs.removeSync(sourceSnapshotPath);
      }
      fs.copySync(path.join(this.snapshotAppPath, snapshot), sourceSnapshotPath, {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filter: (src: string, _dst: string) => !src.includes('node_modules'),
      });
    }
  }

  // ============================================================
  // Teardown
  // ============================================================

  /**
   * Delete all deployed resources (Gen1 backend + Gen2 sandbox + holding stacks).
   * Runs in a best-effort manner — logs errors but does not throw.
   */
  public async teardown(): Promise<void> {
    this.logger.info('Starting teardown...');

    // Refresh credentials in case the original session expired during a long test.
    await this.credentials.refresh();

    // Delete Gen1 CFN stacks first. We do this before Gen2 because the
    // migration may have moved resources between stacks, and deleting Gen2
    // first can leave Gen1 stacks in a state where their custom resources
    // reference resources that no longer exist.
    try {
      this.logger.info('Deleting Gen1 CloudFormation stacks...');
      const cfnClient = new CloudFormationClient({});
      const stackPrefix = `amplify-${this.deploymentName}-`;
      for await (const page of paginateListStacks(
        { client: cfnClient },
        {
          StackStatusFilter: [
            StackStatus.CREATE_COMPLETE,
            StackStatus.UPDATE_COMPLETE,
            StackStatus.UPDATE_ROLLBACK_COMPLETE,
            StackStatus.ROLLBACK_COMPLETE,
            StackStatus.DELETE_FAILED,
          ],
        },
      )) {
        for (const stack of page.StackSummaries ?? []) {
          if (stack.StackName?.startsWith(stackPrefix) && !stack.RootId) {
            this.logger.info(`Deleting stack: ${stack.StackName}`);
            await this.emptyStackBuckets(cfnClient, stack.StackName);
            await this.deleteStackWithRetainOnFailure(cfnClient, stack.StackName);
          }
        }
      }
    } catch (e) {
      this.logger.info(`Gen1 stack cleanup failed: ${(e as Error).message} (continuing teardown)`);
    }

    // Delete the Amplify console app
    try {
      this.logger.info('Deleting Amplify console app...');
      const amplifyClient = new AmplifyClient({});
      const apps = await amplifyClient.send(new ListAppsCommand({ maxResults: 25 }));
      const app = apps.apps?.find((a) => a.name === this.deploymentName);
      if (app?.appId) {
        await amplifyClient.send(new DeleteAppCommand({ appId: app.appId }));
        this.logger.info(`Deleted Amplify app: ${this.deploymentName} (${app.appId})`);
      } else {
        this.logger.info(`Amplify app ${this.deploymentName} not found (may already be deleted)`);
      }
    } catch (e) {
      this.logger.info(`Amplify app cleanup failed: ${(e as Error).message} (continuing teardown)`);
    }

    // Delete Gen2 sandbox stack
    try {
      this.logger.info('Deleting Gen2 sandbox...');
      await this.git.checkout(this.gen2BranchName, false);
      const sandboxResult = await execa('npx', ['ampx', 'sandbox', 'delete', '--yes'], {
        cwd: this.targetAppPath,
        reject: false,
        stdio: 'inherit',
        env: { ...process.env, AWS_BRANCH: this.gen2BranchName },
      });
      if (sandboxResult.exitCode !== 0) {
        this.logger.info(`ampx sandbox delete exited with code ${sandboxResult.exitCode} (continuing teardown)`);
      } else {
        this.logger.info('Gen2 sandbox deleted');
      }
    } catch (e) {
      this.logger.info(`Gen2 sandbox delete failed: ${(e as Error).message} (continuing teardown)`);
    }

    // Delete holding stacks created during refactor (Gen2-related)
    try {
      this.logger.info('Deleting holding stacks...');
      const cfnClient = new CloudFormationClient({});
      for await (const page of paginateListStacks(
        { client: cfnClient },
        { StackStatusFilter: [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.REVIEW_IN_PROGRESS] },
      )) {
        for (const stack of page.StackSummaries ?? []) {
          if (stack.StackName?.includes(this.deploymentName) && stack.StackName.endsWith('-holding')) {
            this.logger.info(`Deleting holding stack: ${stack.StackName}`);
            await this.emptyStackBuckets(cfnClient, stack.StackName);
            await this.deleteStackWithRetainOnFailure(cfnClient, stack.StackName);
          }
        }
      }
    } catch (e) {
      this.logger.info(`Holding stack cleanup failed: ${(e as Error).message} (continuing teardown)`);
    }

    this.logger.info('Teardown complete');
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Delete a CloudFormation stack, handling the common failure mode where a
   * custom resource (typically `CustomAuthTriggerResource`) fails to clean
   * itself up because its service-token Lambda or the Cognito user pool it
   * references has already been removed.
   *
   * Strategy:
   *   1. Issue the delete and wait for completion.
   *   2. If the stack reaches `DELETE_FAILED`, inspect its resources:
   *      - For any nested stack that failed, recursively clean it up. This
   *        matters because `RetainResources` on a parent stack cannot skip
   *        resources inside a nested stack — the nested stack itself must be
   *        deleted with its own `RetainResources` targeting the actual
   *        problem leaf.
   *      - After the recursive pass, retry the parent, retaining any nested
   *        stacks or leaf resources that are still `DELETE_FAILED`.
   */
  private async deleteStackWithRetainOnFailure(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    await cfnClient.send(new DeleteStackCommand({ StackName: stackName }));
    if (await this.tryWaitForStackDelete(cfnClient, stackName)) return;

    await this.cleanupNestedFailedStacks(cfnClient, stackName);

    const failed = await this.listFailedResources(cfnClient, stackName);
    if (failed.length === 0) {
      this.logger.info(`Stack ${stackName} delete did not complete within timeout (continuing teardown)`);
      return;
    }

    this.logger.info(`Retrying delete of ${stackName} with retained resources: ${failed.join(', ')}`);
    try {
      await cfnClient.send(new DeleteStackCommand({ StackName: stackName, RetainResources: failed }));
      if (!(await this.tryWaitForStackDelete(cfnClient, stackName))) {
        this.logger.info(`Stack ${stackName} retry did not complete within timeout (continuing teardown)`);
      }
    } catch (e) {
      this.logger.info(`Failed to retry stack ${stackName} delete: ${(e as Error).message} (continuing teardown)`);
    }
  }

  /**
   * Recursively delete any nested stacks of `stackName` that are in
   * `DELETE_FAILED`. Each recursive call can itself retain problem leaf
   * resources, so after this returns the parent's retry only needs to retain
   * nested-stack logical IDs that remained stuck.
   */
  private async cleanupNestedFailedStacks(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    let resources;
    try {
      resources = await cfnClient.send(new DescribeStackResourcesCommand({ StackName: stackName }));
    } catch (e) {
      this.logger.info(`Failed to describe resources for ${stackName}: ${(e as Error).message} (continuing teardown)`);
      return;
    }
    const nestedFailed = (resources.StackResources ?? []).filter(
      (r) => r.ResourceType === 'AWS::CloudFormation::Stack' && r.ResourceStatus === 'DELETE_FAILED' && r.PhysicalResourceId,
    );
    for (const nested of nestedFailed) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const nestedName = nested.PhysicalResourceId!;
      this.logger.info(`Recursively cleaning nested stack: ${nestedName}`);
      await this.emptyStackBuckets(cfnClient, nestedName);
      await this.deleteStackWithRetainOnFailure(cfnClient, nestedName);
    }
  }

  /**
   * List logical IDs of resources in `DELETE_FAILED` for the given stack.
   */
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
      this.logger.info(`Failed to list failed resources for ${stackName}: ${(e as Error).message} (continuing teardown)`);
      return [];
    }
  }

  /**
   * Wait for a stack delete to complete. Returns true on success, false on
   * timeout or delete-failure (the caller decides how to recover).
   */
  private async tryWaitForStackDelete(cfnClient: CloudFormationClient, stackName: string): Promise<boolean> {
    try {
      await waitUntilStackDeleteComplete({ client: cfnClient, maxWaitTime: 300 }, { StackName: stackName });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Empty all S3 buckets owned by the given CloudFormation stack.
   * CloudFormation cannot delete a bucket with objects, so we must empty them first.
   */
  private async emptyStackBuckets(cfnClient: CloudFormationClient, stackName: string): Promise<void> {
    const resources = await cfnClient.send(new ListStackResourcesCommand({ StackName: stackName }));
    const buckets = (resources.StackResourceSummaries ?? [])
      .filter((r) => r.ResourceType === 'AWS::S3::Bucket' && r.PhysicalResourceId)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((r) => r.PhysicalResourceId!);
    if (buckets.length === 0) return;

    const s3 = new S3Client({});
    for (const bucket of buckets) {
      try {
        this.logger.info(`Emptying bucket: ${bucket}`);
        let continuationToken: string | undefined;
        do {
          const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }));
          if (page.Contents && page.Contents.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const objects = page.Contents.filter((o) => o.Key).map((o) => ({ Key: o.Key! }));
            await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: objects, Quiet: true } }));
          }
          continuationToken = page.NextContinuationToken;
        } while (continuationToken);
      } catch (e) {
        this.logger.info(`Failed to empty bucket ${bucket}: ${(e as Error).message} (continuing)`);
      }
    }
  }

  private removeGitignoreLine(line: string): void {
    const gitignorePath = path.join(this.targetAppPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) return;
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const updated = content
      .split('\n')
      .filter((l) => l.trim() !== line)
      .join('\n');
    fs.writeFileSync(gitignorePath, updated, 'utf-8');
  }

  private loadMigrationConfig(): MigrationConfig {
    const configPath = path.join(this.targetAppPath, 'migration', 'config.json');
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8')) as MigrationConfig;
  }

  private async runAmplify(args: string[], options?: { stdio?: 'inherit' }): Promise<void> {
    const originalCwd = process.cwd();
    process.chdir(this.targetAppPath);
    try {
      const result = await execa(this.amplifyPath, args, {
        cwd: this.targetAppPath,
        stdio: options?.stdio,
      });
      if (result.exitCode !== 0) {
        throw new Error(`amplify ${args[0]} failed with exit code ${result.exitCode}`);
      }
    } finally {
      process.chdir(originalCwd);
    }
  }

  private async runMigrationStep(step: string, extraArgs: string[] = []): Promise<void> {
    const argsStr = extraArgs.length > 0 ? ` ${extraArgs.join(' ')}` : '';
    this.logger.info(`Executing gen2-migration ${step}${argsStr}...`);
    const startTime = Date.now();

    const result = await execa(this.amplifyPath, ['gen2-migration', step, '--yes', ...extraArgs], {
      cwd: this.targetAppPath,
      stdio: 'inherit',
      reject: false,
    });

    if (result.exitCode !== 0) {
      throw new Error(`gen2-migration ${step} failed with exit code ${result.exitCode}`);
    }

    this.logger.info(`gen2-migration ${step} completed (${Date.now() - startTime}ms)`);
  }

  /**
   * Run an npm script defined in the app's package.json.
   * Silently skips if the script is not defined.
   */
  private async runNpmScript(scriptName: string, extraEnv?: Record<string, string>): Promise<void> {
    const result = await execa('npm', ['run', scriptName], {
      cwd: this.targetAppPath,
      stdio: 'inherit',
      reject: false,
      env: { ...process.env, ENV_NAME: this.envName, AWS_SDK_LOAD_CONFIG: '1', ...extraEnv },
    });

    if (result.exitCode !== 0) {
      throw new Error(`npm run ${scriptName} failed with exit code ${result.exitCode}`);
    }
  }

  private async findGen1RootStack(): Promise<string> {
    const rootPattern = new RegExp(`^amplify-${this.deploymentName}-${this.envName}-[0-9a-f]{5}$`);
    return findStackByPattern(rootPattern);
  }

  private async findGen2RootStack(stackPrefix: string): Promise<string> {
    const result = await execa(
      'aws',
      [
        'cloudformation',
        'list-stacks',
        '--stack-status-filter',
        'CREATE_COMPLETE',
        'UPDATE_COMPLETE',
        '--query',
        `StackSummaries[?starts_with(StackName, '${stackPrefix}')].StackName`,
        '--output',
        'text',
      ],
      { reject: false },
    );

    if (result.exitCode !== 0) {
      throw new Error(`Failed to list CloudFormation stacks: ${result.stderr || result.stdout}`);
    }

    const stacks = result.stdout
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);
    const rootStacks = stacks.filter((name) => /^-[a-f0-9]+$/.test(name.replace(stackPrefix, '')));

    if (rootStacks.length === 0) {
      throw new Error(`No Gen2 sandbox stack found with prefix: ${stackPrefix}`);
    }

    this.logger.info(`Gen2 stack name: ${rootStacks[0]}`);
    return rootStacks[0];
  }
}

/**
 * Generates a time-based Amplify app name.
 * Format: [prefix][YYMMDDHHMM] (20 chars max for Amplify compatibility).
 */
function generateTimeBasedName(appName: string): string {
  const now = new Date();
  const timestamp = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
  ].join('');

  const alphanumericOnly = appName.replace(/[^a-zA-Z0-9]/g, '');
  const prefix = alphanumericOnly.slice(0, 10).toLowerCase();
  const safePrefix = /^[a-z]/.test(prefix) ? prefix : `e${prefix.slice(1)}`;
  return `${safePrefix}${timestamp}`;
}

/**
 * Generates a random env name (2-10 lowercase letters).
 */
function generateRandomEnvName(): string {
  return Array.from({ length: 10 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
}

async function findStackByPattern(pattern: RegExp): Promise<string> {
  const cfnClient = new CloudFormationClient({});
  for await (const page of paginateListStacks(
    { client: cfnClient },
    { StackStatusFilter: [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.UPDATE_ROLLBACK_COMPLETE] },
  )) {
    const match = page.StackSummaries?.find((s) => s.StackName && pattern.test(s.StackName));
    if (match?.StackName) return match.StackName;
  }
  throw new Error(`No stack found matching pattern "${pattern.source}"`);
}
