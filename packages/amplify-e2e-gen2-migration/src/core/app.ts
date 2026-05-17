/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import {
  amplifyPullNonInteractive,
  getCLIPath,
  initJSProjectWithProfileGen2Migration,
  ensureGen1PlaceholderApp,
} from '@aws-amplify/amplify-e2e-core';
import { Logger, LogLevel } from './logger';
import { Git } from './git';
import * as snapshot from './snapshot';
import { sanitize } from './sanitize';
import { normalize } from './normalize';
import { CredentialManager } from './credentials';
import { CloudFormationClient, paginateListStacks, StackStatus } from '@aws-sdk/client-cloudformation';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { AmplifyClient } from '@aws-sdk/client-amplify';
import { fromIni } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentity } from '@aws-sdk/types';
import { Teardown } from './teardown';

const REPO_ROOT_DIR = process.env.CODEBUILD_SRC_DIR ?? path.join(__dirname, '..', '..', '..', '..');
const MIGRATION_TARGET_DIR = path.join(os.tmpdir(), 'amplify-e2e-gen2-migration', 'output-apps');
const MIGRATION_SNAPSHOT_DIR = path.join(os.tmpdir(), 'amplify-e2e-gen2-migration', 'snapshots');
const MIGRATION_APPS_DIR = path.join(REPO_ROOT_DIR, 'amplify-migration-apps');

interface MigrationConfig {
  /**
   * Per-step configuration overrides.
   */
  readonly lockForward?: StepConfig;
  readonly lockRollback?: StepConfig;
  readonly refactorForward?: StepConfig;
  readonly refactorRollback?: StepConfig;
  readonly generate?: StepConfig;
}

interface StepConfig {
  /**
   * Pass --skip-validations to the step.
   */
  readonly skipValidations?: boolean;

  /**
   * Skip the step entirely.
   */
  readonly skip?: boolean;
}

interface E2EOptions {
  readonly teardown: boolean;
}

interface ForwardOptions {
  readonly lock: boolean;
}

/**
 * Represents a migration app deployed to a temporary directory.
 * Exposes all lifecycle operations as public methods.
 */
export class App {
  readonly deploymentName: string;
  readonly gen2BranchName: string;
  private readonly gen1BranchName = 'main';

  private readonly sourceAppPath: string;
  private readonly envName: string;
  private readonly migrationConfig: MigrationConfig;
  private readonly snapshotAppPath: string;

  /**
   * Whether the refactor step should be skipped entirely for this app.
   */
  public get skipRefactor(): boolean {
    return this.migrationConfig.refactorForward?.skip === true;
  }
  private readonly amplifyPath: string;
  private readonly credentials: CredentialManager;

  public get profile(): string {
    return this.credentials.profile;
  }

  public readonly logger: Logger;
  public readonly targetAppPath: string;

  readonly git: Git;

  constructor(public readonly appName: string, profile: string | undefined, verbose = false) {
    this.sourceAppPath = path.join(MIGRATION_APPS_DIR, appName);
    if (!fs.existsSync(this.sourceAppPath)) {
      throw new Error(`App not found: ${this.sourceAppPath}`);
    }

    this.deploymentName = generateTimeBasedName(appName);
    this.logger = new Logger(this.deploymentName, verbose ? LogLevel.DEBUG : LogLevel.INFO);

    this.envName = generateRandomEnvName();
    this.gen2BranchName = `gen2-${this.envName}`;
    const testingWithLatestCodebase = process.env.AMPLIFY_PATH ? false : true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    this.amplifyPath = getCLIPath(testingWithLatestCodebase);
    this.logger.info(`Amplify Path: ${this.amplifyPath}`);

    const region = process.env.CLI_REGION ?? process.env.AWS_REGION ?? 'us-east-1';
    const generatedProfile = `amplify-migration-e2e-${this.deploymentName}`;

    this.credentials = new CredentialManager(profile, region, generatedProfile, this.logger);

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
    await this.refreshCredentials();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await ensureGen1PlaceholderApp(new AmplifyClient(this.getClientConfig()));
    this.logger.info('amplify init started');
    const mainTsx = path.join(this.sourceAppPath, 'src', 'main.tsx');
    const framework = fs.existsSync(mainTsx) ? 'react' : 'none';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await initJSProjectWithProfileGen2Migration(this.targetAppPath, {
      name: this.deploymentName,
      envName: this.envName,
      editor: 'Visual Studio Code',
      framework,
      srcDir: 'src',
      distDir: 'dist',
      buildCmd: 'npm run build',
      startCmd: 'npm run start',
      disableAmplifyAppCreation: false,
      profileName: this.profile,
    });
    this.logger.info('amplify init completed');
  }

  public async pull(): Promise<void> {
    const tpiPath = path.join(this.targetAppPath, 'amplify', 'team-provider-info.json');
    const tpi = JSON.parse(fs.readFileSync(tpiPath, { encoding: 'utf-8' }));
    const appId = tpi[this.envName].awscloudformation.AmplifyAppId;
    this.logger.info('amplify pull started');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await amplifyPullNonInteractive(this.targetAppPath, {
      appId: appId,
      envName: this.envName,
      profile: this.profile,
    });
    this.logger.info('amplify pull completed');
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
    await this.runAmplify(['status'], { stdio: 'inherit' });
  }

  /**
   * Run `amplify push --yes`.
   */
  public async push(): Promise<void> {
    await this.runAmplify(['push', '--force', '--yes']);
  }

  /**
   * Run a full E2E migration test on this app.
   */
  public async e2e(options: E2EOptions): Promise<void> {
    this.logger.info(`Started e2e execution`);
    try {
      printPhaseBanner(`Phase 1 | Migration`);
      const gen2StackName = await this.migrate();

      if (!this.skipRefactor) {
        printPhaseBanner(`Phase 2 | Post Migration | Rollback`);
        await this.rollback(gen2StackName);

        printPhaseBanner(`Phase 3 | Post Migration | Forward`);
        // lock: true because we rolled back
        await this.forward(gen2StackName, { lock: true });
      }

      printPhaseBanner(`Phase 4 | Post Migration | Retain`);
      await this.git.checkout(this.gen1BranchName, false);
      await this.pull();
      await this.retain();

      await this.testGen1();
      await this.testGen2();

      this.logger.info(`Execution completed successfully (${this.targetAppPath})`);
      if (process.env.UPDATE_SNAPSHOTS === '1') {
        this.updateSnapshots();
      }
    } catch (error) {
      console.log();
      (error as Error).message = `Migration failed: ${(error as Error).message}\n\n(App path: ${this.targetAppPath})\n`;
      console.log((error as Error).stack);
      console.log();
      throw error;
    } finally {
      if (options.teardown) {
        await this.refreshCredentials();
        const teardown = new Teardown(this.deploymentName, this.getClientConfig());
        await teardown.clean();
      }
    }
  }

  public async rollback(gen2StackName: string): Promise<void> {
    await this.git.checkout(this.gen1BranchName, false);
    await this.pull();
    await this.refactorRollback(gen2StackName);
    await this.lockRollback();
    await this.push();

    await this.testGen1();

    await this.git.checkout(this.gen2BranchName, false);
    await this.postRollback();
    await this.git.diff();
    await this.git.commit('chore: post rollback');
    await this.deployGen2Sandbox();

    await this.testGen1();
    await this.testGen2();
  }

  public async forward(gen2StackName: string, options: ForwardOptions): Promise<void> {
    await this.git.checkout(this.gen1BranchName, false);
    await this.pull();
    if (options.lock) {
      await this.lockForward();
    }
    await this.refactorForward(gen2StackName);

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

    await this.testShared();
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
  public async migrate(): Promise<string> {
    await this.deploy();
    await this.assess();
    await this.lockForward();

    await this.testGen1();

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
    await snapshot.capturePreRefactor(gen1StackName, gen2StackName, this.snapshotAppPath, this.getClientConfig());
    console.log('');

    if (this.skipRefactor) {
      this.logger.info('Skipping refactor (configured in migration/config.json)');
      return gen2StackName;
    }

    // lock: false because we already executed lock
    await this.forward(gen2StackName, { lock: false });

    return gen2StackName;
  }

  /**
   * Run `amplify gen2-migration assess`.
   */
  public async assess(): Promise<void> {
    await this.refreshCredentials();
    await this.runMigrationStep('assess');
  }

  /**
   * Run `amplify gen2-migration lock`.
   */
  public async lockForward(): Promise<void> {
    await this.refreshCredentials();
    const extraArgs: string[] = [];
    if (this.migrationConfig.lockForward?.skipValidations) {
      extraArgs.push('--skip-validations');
    }
    await this.runMigrationStep('lock', extraArgs);
  }

  /**
   * Run `amplify gen2-migration lock --rollback`.
   */
  public async lockRollback(): Promise<void> {
    await this.refreshCredentials();
    const extraArgs = ['--rollback'];
    if (this.migrationConfig.lockRollback?.skipValidations) {
      extraArgs.push('--skip-validations');
    }
    await this.runMigrationStep('lock', extraArgs);
  }

  /**
   * Run `amplify gen2-migration generate`.
   */
  public async generate(): Promise<void> {
    await this.refreshCredentials();
    const extraArgs = this.migrationConfig.generate?.skipValidations ? ['--skip-validations'] : [];
    await this.runMigrationStep('generate', extraArgs);
    this.removeGitignoreLine('amplify_outputs*');
  }

  /**
   * Run `amplify gen2-migration refactor`.
   */
  public async refactorForward(gen2StackName: string): Promise<void> {
    await this.refreshCredentials();
    const extraArgs = ['--to', gen2StackName];
    if (this.migrationConfig.refactorForward?.skipValidations) {
      extraArgs.push('--skip-validations');
    }

    // twice for idempotancy. print a banner so its easier to distinguish
    // the different runs in the logs.

    printStepBanner('Forward Refactor (1)');
    await this.runMigrationStep('refactor', extraArgs);

    printStepBanner('Forward Refactor (2)');
    await this.runMigrationStep('refactor', extraArgs);
  }

  /**
   * Run `amplify gen2-migration refactor --rollback`.
   */
  public async refactorRollback(gen2StackName: string): Promise<void> {
    await this.refreshCredentials();
    const extraArgs = ['--to', gen2StackName, '--rollback'];
    if (this.migrationConfig.refactorRollback?.skipValidations) {
      extraArgs.push('--skip-validations');
    }

    // twice for idempotancy. print a banner so its easier to distinguish
    // the different runs in the logs.

    printStepBanner('Rollback Refactor (1)');
    await this.runMigrationStep('refactor', extraArgs);

    printStepBanner('Rollback Refactor (2)');
    await this.runMigrationStep('refactor', extraArgs);
  }

  /**
   * Run `amplify gen2-migration retain`.
   */
  public async retain(): Promise<void> {
    await this.refreshCredentials();
    await this.runMigrationStep('retain');
  }

  /**
   * Deploy Gen2 app using `npx ampx sandbox --once`.
   * Returns the Gen2 root stack name.
   */
  public async deployGen2Sandbox(): Promise<string> {
    await this.refreshCredentials();
    await this.bootstrapCDK();
    this.logger.info('Deploying Gen2 app using ampx sandbox...');
    const startTime = Date.now();

    const result = await execa('npx', ['ampx', 'sandbox', '--once', '--identifier', 'e2e'], {
      cwd: this.targetAppPath,
      reject: false,
      stdio: 'inherit',
      env: this.getEnv({ AWS_BRANCH: this.gen2BranchName }),
      extendEnv: false,
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
  public async testShared(): Promise<void> {
    await this.git.checkout(this.gen1BranchName, false);

    // these tests require both config files, so pull the gen2 config into the gen1 branch
    await this.git.run('checkout', this.gen2BranchName, '--', 'amplify_outputs.json');
    await this.runNpmScript('test:shared');
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
   * Run the post-rollback script.
   */
  public async postRollback(): Promise<void> {
    await this.runNpmScript('post-rollback');
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
  // Credential Helpers
  // ============================================================

  /**
   * Refresh credentials. Call before any AWS operation in role mode so the
   * underlying profile doesn't expire mid-step. No-op in profile mode.
   */
  public async refreshCredentials(): Promise<AwsCredentialIdentity | undefined> {
    return await this.credentials.refresh();
  }

  /**
   * Build an env object for sub-process execution, merging `process.env`
   * with `AWS_PROFILE` and optional extras. The profile is the only
   * credential signal — sub-processes resolve it via the shared AWS config.
   */
  public getEnv(extra?: Record<string, string>): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = { ...process.env, AWS_PROFILE: this.profile, ...extra };
    // Remove credential env vars so subprocesses use only the profile.
    // Without this, the AWS CLI and CDK prefer env var credentials over
    // the profile, causing operations to run in the wrong account.
    delete env.AWS_ACCESS_KEY_ID;
    delete env.AWS_SECRET_ACCESS_KEY;
    delete env.AWS_SESSION_TOKEN;
    return env;
  }

  /**
   * Build an AWS SDK client config that explicitly resolves credentials from
   * the active profile via `fromIni`. This bypasses the SDK default provider
   * chain, which may prefer container/IMDS credentials in CI environments.
   */
  public getClientConfig(): { credentials: ReturnType<typeof fromIni> } {
    return { credentials: fromIni({ profile: this.profile, ignoreCache: true }) };
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Bootstrap CDK in the target account/region. Idempotent — succeeds
   * silently if the CDKToolkit stack already exists.
   */
  private async bootstrapCDK(): Promise<void> {
    const region = process.env.CLI_REGION ?? 'us-east-1';
    this.logger.info(`Bootstrapping CDK for region ${region}...`);

    const stsClient = new STSClient({ ...this.getClientConfig(), region });
    const identity = await stsClient.send(new GetCallerIdentityCommand({}));
    const accountId = identity.Account;
    if (!accountId) {
      throw new Error('Unable to determine AWS account ID from STS.');
    }

    const result = await execa('npx', ['cdk', 'bootstrap', `aws://${accountId}/${region}`], {
      cwd: this.targetAppPath,
      reject: false,
      stdio: 'inherit',
      env: this.getEnv(),
      extendEnv: false,
    });
    if (result.exitCode !== 0) {
      throw new Error(`'cdk bootstrap' failed. See above logs for details.`);
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
    await this.refreshCredentials();
    const originalCwd = process.cwd();
    process.chdir(this.targetAppPath);
    try {
      const startTime = Date.now();
      const command = `${this.amplifyPath} ${args.join(' ')}`;

      // just to have shorter log lines that fit the laptop screen
      const commandToLog = command.replace(this.amplifyPath, path.basename(this.amplifyPath));

      this.logger.info(`(→) ${commandToLog}`);
      const result = await execa(this.amplifyPath, args, {
        cwd: this.targetAppPath,
        stdio: options?.stdio,
        env: this.getEnv(),
        extendEnv: false,
      });
      if (result.exitCode !== 0) {
        throw new Error(`${command} failed with exit code ${result.exitCode}`);
      }
      this.logger.info(`(✔) ${commandToLog} (${Date.now() - startTime}ms)`);
    } finally {
      process.chdir(originalCwd);
    }
  }

  private async runMigrationStep(step: string, extraArgs: string[] = []): Promise<void> {
    const startTime = Date.now();

    const args = ['gen2-migration', step, '--yes', ...extraArgs];
    const command = `${this.amplifyPath} ${args.join(' ')}`;

    // just to have shorter log lines that fit the laptop screen
    const commandToLog = command.replace(this.amplifyPath, path.basename(this.amplifyPath));

    this.logger.info(`(→) ${commandToLog}`);
    const result = await execa(this.amplifyPath, args, {
      cwd: this.targetAppPath,
      stdio: 'inherit',
      reject: false,
      env: this.getEnv(),
      extendEnv: false,
    });

    if (result.exitCode !== 0) {
      throw new Error(`${command} failed with exit code ${result.exitCode}`);
    }

    this.logger.info(`(✔) ${commandToLog} (${Date.now() - startTime}ms)`);
  }

  /**
   * Run an npm script defined in the app's package.json.
   * Silently skips if the script is not defined.
   */
  private async runNpmScript(scriptName: string, extraEnv?: Record<string, string>): Promise<void> {
    await this.refreshCredentials();
    const result = await execa('npm', ['run', scriptName], {
      cwd: this.targetAppPath,
      stdio: 'inherit',
      reject: false,
      env: this.getEnv({ GEN1_ENV_NAME: this.envName, AWS_SDK_LOAD_CONFIG: '1', ...extraEnv }),
      extendEnv: false,
    });

    if (result.exitCode !== 0) {
      throw new Error(`npm run ${scriptName} failed with exit code ${result.exitCode}`);
    }
  }

  private async findGen1RootStack(): Promise<string> {
    const rootPattern = new RegExp(`^amplify-${this.deploymentName}-${this.envName}-[0-9a-f]{5}$`);
    return findStackByPattern(rootPattern, this.getClientConfig());
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
      { reject: false, env: this.getEnv(), extendEnv: false },
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
 * Prints a centered emphasized phase banner to stdout for visual separation in logs.
 *
 * ╔════════════════════════════════════════════════════════════╗
 * ║                                                            ║
 * ║                           ${text}                          ║
 * ║                                                            ║
 * ╚════════════════════════════════════════════════════════════╝
 *
 */
function printPhaseBanner(text: string): void {
  const innerWidth = 60;
  const padding = Math.max(0, innerWidth - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  const border = '\u2550'.repeat(innerWidth);
  const emptyLine = `\u2551${' '.repeat(innerWidth)}\u2551`;
  const textLine = `\u2551${' '.repeat(leftPad)}${text}${' '.repeat(rightPad)}\u2551`;
  console.log(`\n\u2554${border}\u2557\n${emptyLine}\n${textLine}\n${emptyLine}\n\u255A${border}\u255D\n`);
}

/**
 * Prints a smaller step banner for sub-steps within a phase.
 *
 * +---------------------------+
 * |          {text}           |
 * +---------------------------+
 */
function printStepBanner(text: string): void {
  const innerWidth = 40;
  const padding = Math.max(0, innerWidth - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  const border = '-'.repeat(innerWidth);
  const textLine = `|${' '.repeat(leftPad)}${text}${' '.repeat(rightPad)}|`;
  console.log(`\n+${border}+\n${textLine}\n+${border}+\n`);
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

async function findStackByPattern(
  pattern: RegExp,
  clientConfig: ConstructorParameters<typeof CloudFormationClient>[0] = {},
): Promise<string> {
  const cfnClient = new CloudFormationClient(clientConfig);
  for await (const page of paginateListStacks(
    { client: cfnClient },
    { StackStatusFilter: [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.UPDATE_ROLLBACK_COMPLETE] },
  )) {
    const match = page.StackSummaries?.find((s) => s.StackName && pattern.test(s.StackName));
    if (match?.StackName) return match.StackName;
  }
  throw new Error(`No stack found matching pattern "${pattern.source}"`);
}
