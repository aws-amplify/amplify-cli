import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { getCLIPath, initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { Logger, LogLevel } from './logger';
import { Git } from './git';

const MIGRATION_TARGET_DIR = path.join(os.tmpdir(), 'amplify-gen2-migration-e2e-system', 'output-apps');
const MIGRATION_APPS_DIR = path.join(__dirname, '..', '..', '..', '..', 'amplify-migration-apps');
const FRONTEST_SCRIPT = 'frontest.ts';

interface MigrationConfig {
  /**
   * Per-step configuration overrides.
   */
  readonly lock?: StepConfig;
}

interface StepConfig {
  /**
   * Pass --skip-validations to the step.
   */
  readonly skipValidations?: boolean;
}

/**
 * Represents a migration app deployed to a temporary directory.
 * Exposes all lifecycle operations as public methods.
 */
export class App {
  private readonly targetAppPath: string;
  private readonly deploymentName: string;
  private readonly gen2BranchName: string;

  private readonly sourceAppPath: string;
  private readonly envName: string;
  private readonly migrationConfig: MigrationConfig;
  private readonly amplifyPath: string;

  public readonly logger: Logger;
  private readonly git: Git;

  constructor(public readonly appName: string, private readonly profile: string, verbose = false) {
    this.sourceAppPath = path.join(MIGRATION_APPS_DIR, appName);
    if (!fs.existsSync(this.sourceAppPath)) {
      throw new Error(`App not found: ${this.sourceAppPath}`);
    }

    this.deploymentName = generateTimeBasedName(appName);
    this.logger = new Logger(this.deploymentName, verbose ? LogLevel.DEBUG : LogLevel.INFO);

    this.envName = generateRandomEnvName();
    this.gen2BranchName = `gen2-${this.envName}`;
    this.amplifyPath = getCLIPath(true);

    // Copy source to temp directory
    this.targetAppPath = path.join(MIGRATION_TARGET_DIR, this.deploymentName);
    fs.mkdirSync(this.targetAppPath);
    fs.copySync(this.sourceAppPath, this.targetAppPath, {
      filter: (src: string) => !src.includes('_snapshot') && !src.includes('node_modules'),
    });

    // Update package.json name for predictable Gen2 stack naming
    const packageJsonPath = path.join(this.targetAppPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { name: string };
    packageJson.name = this.deploymentName;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

    this.migrationConfig = this.loadMigrationConfig();
    this.git = new Git(this.targetAppPath, this.logger);

    this.logger.info(`App ${appName} prepared at ${this.targetAppPath}`);
    this.logger.info(`Deployment name: ${this.deploymentName}, env: ${this.envName}`);
  }

  // ============================================================
  // Gen1 Lifecycle
  // ============================================================

  /**
   * Run `amplify init` to initialize the Gen1 project.
   */
  public async init(): Promise<void> {
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
      disableAmplifyAppCreation: false,
      profileName: this.profile,
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
    this.logger.info('amplify push');
    await this.runAmplify(['push', '--yes', '--debug']);
    this.logger.info('amplify push completed');
  }

  // ============================================================
  // Gen2 Migration
  // ============================================================

  /**
   * Run `amplify gen2-migration assess`.
   */
  public async assess(): Promise<void> {
    await this.runMigrationStep('assess');
  }

  /**
   * Run `amplify gen2-migration lock`.
   */
  public async lock(): Promise<void> {
    const extraArgs = this.migrationConfig.lock?.skipValidations ? ['--skip-validations'] : [];
    await this.runMigrationStep('lock', extraArgs);
  }

  /**
   * Run `amplify gen2-migration generate` and install dependencies.
   */
  public async generate(): Promise<void> {
    await this.runMigrationStep('generate');
    this.removeGitignoreLine('amplify_outputs*');
  }

  /**
   * Run `amplify gen2-migration refactor`.
   */
  public async refactor(gen2StackName: string): Promise<void> {
    await this.runMigrationStep('refactor', ['--to', gen2StackName]);
  }

  /**
   * Deploy Gen2 app using `npx ampx sandbox --once`.
   * Returns the Gen2 root stack name.
   */
  public async deployGen2Sandbox(): Promise<string> {
    this.logger.info('Deploying Gen2 app using ampx sandbox...');
    const startTime = Date.now();

    const result = await execa('npx', ['ampx', 'sandbox', '--once'], {
      cwd: this.targetAppPath,
      reject: false,
      stdio: 'inherit',
      env: { ...process.env, AWS_BRANCH: this.gen2BranchName },
    });

    if (result.exitCode !== 0) {
      throw new Error('ampx sandbox failed');
    }

    this.logger.info(`ampx sandbox completed (${Date.now() - startTime}ms)`);

    const username = os.userInfo().username;
    const stackPrefix = `amplify-${this.deploymentName}-${username}-sandbox`;
    return this.findGen2RootStack(stackPrefix);
  }

  // ============================================================
  // App Scripts
  // ============================================================

  /**
   * Run the frontest script against the Gen1 config.
   */
  public async frontestGen1(): Promise<void> {
    await this.gitCheckoutGen1();
    await this.runScriptIfExists(FRONTEST_SCRIPT, [path.join('src', 'amplifyconfiguration.json')]);
  }

  /**
   * Run the frontest script against the Gen2 config.
   */
  public async frontestGen2(): Promise<void> {
    await this.gitCheckoutGen2();
    await this.runScriptIfExists(FRONTEST_SCRIPT, ['amplify_outputs.json']);
  }

  /**
   * Run the post-push script.
   */
  public async postPush(): Promise<void> {
    await this.runScriptIfExists(path.join('migration', 'post-push.ts'), [this.targetAppPath]);
  }

  /**
   * Run the post-generate script.
   */
  public async postGenerate(): Promise<void> {
    await this.runScriptIfExists(path.join('migration', 'post-generate.ts'), [this.targetAppPath]);
  }

  /**
   * Run the post-refactor script.
   */
  public async postRefactor(): Promise<void> {
    await this.runScriptIfExists(path.join('migration', 'post-refactor.ts'), [this.targetAppPath]);
  }

  // ============================================================
  // Git
  // ============================================================

  /**
   * Initialize a git repo and create the initial commit.
   */
  public async gitInit(): Promise<void> {
    await this.git.init();
  }

  /**
   * Commit all changes.
   */
  public async gitCommit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  /**
   * Checkout the Gen1 (main) branch.
   */
  public async gitCheckoutGen1(): Promise<void> {
    await this.git.checkout('main', false);
  }

  /**
   * Checkout the Gen2 branch (creates it if create is true).
   */
  public async gitCheckoutGen2(create = false): Promise<void> {
    await this.git.checkout(this.gen2BranchName, create);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  private removeGitignoreLine(line: string): void {
    const gitignorePath = path.join(this.targetAppPath, '.gitignore');
    if (!fs.existsSync(gitignorePath)) return;
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    const updated = content
      .split('\n')
      .filter((l) => l.trim() !== line)
      .join('\n');
    fs.writeFileSync(gitignorePath, updated, 'utf-8');
    this.logger.info(`Removed '${line}' from .gitignore`);
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

  private async runScriptIfExists(scriptPath: string, args: string[]): Promise<void> {
    if (!fs.existsSync(path.join(this.targetAppPath, scriptPath))) {
      this.logger.info(`Skipping ${scriptPath} (not found)`);
      return;
    }

    this.logger.info(`Running ${scriptPath} ${args.join(' ')}...`);
    const result = await execa('npx', ['tsx', scriptPath, ...args], {
      cwd: this.targetAppPath,
      stdio: 'inherit',
      reject: false,
      env: { ...process.env, AWS_SDK_LOAD_CONFIG: '1' },
    });

    if (result.exitCode !== 0) {
      throw new Error(`${scriptPath} failed with exit code ${result.exitCode}`);
    }
    this.logger.info(`${scriptPath} completed`);
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
  const length = Math.floor(Math.random() * 9) + 2;
  return Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
}
