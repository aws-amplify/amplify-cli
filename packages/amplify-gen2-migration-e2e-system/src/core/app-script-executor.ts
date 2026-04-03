import execa from 'execa';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger';
import * as git from './git';

const FRONTEST_SCRIPT = 'frontest.ts';

/**
 * Runs app-specific scripts (frontest, post-push, post-generate, post-refactor)
 * from the migration app directory. Scripts are executed only if they exist.
 */
export class AppScriptExecutor {
  constructor(
    private readonly appPath: string,
    private readonly gen1BranchName: string,
    private readonly gen2BranchName: string,
    private readonly logger: Logger,
  ) {}

  /**
   * Run the frontest script against the Gen1 config.
   */
  public async frontestGen1(): Promise<void> {
    await git.checkout(this.appPath, this.gen1BranchName, false);
    await this.runIfExists(FRONTEST_SCRIPT, [path.join('src', 'amplifyconfiguration.json')]);
  }

  /**
   * Run the frontest script against the Gen2 config.
   */
  public async frontestGen2(): Promise<void> {
    await git.checkout(this.appPath, this.gen2BranchName, false);
    await this.runIfExists(FRONTEST_SCRIPT, ['amplify_outputs.json']);
  }

  /**
   * Run the post-push script.
   */
  public async postPush(): Promise<void> {
    await this.runIfExists(path.join('migration', 'post-push.ts'), [this.appPath]);
  }

  /**
   * Run the post-generate script.
   */
  public async postGenerate(): Promise<void> {
    await this.runIfExists(path.join('migration', 'post-generate.ts'), [this.appPath]);
  }

  /**
   * Run the post-refactor script.
   */
  public async postRefactor(): Promise<void> {
    await this.runIfExists(path.join('migration', 'post-refactor.ts'), [this.appPath]);
  }

  private async runIfExists(scriptPath: string, args: string[]): Promise<void> {
    if (!fs.existsSync(path.join(this.appPath, scriptPath))) return;
    await this.run(scriptPath, args);
  }

  private async run(scriptPath: string, args: string[]): Promise<void> {
    this.logger.info(`Running ${scriptPath} with args: ${args.join(' ')}`);
    const result = await execa('npx', ['tsx', scriptPath, ...args], {
      cwd: this.appPath,
      stdio: 'inherit',
      reject: false,
      env: { ...process.env, AWS_SDK_LOAD_CONFIG: '1' },
    });

    if (result.exitCode !== 0) {
      throw new Error(`${scriptPath} failed with exit code ${result.exitCode}`);
    }
  }
}
