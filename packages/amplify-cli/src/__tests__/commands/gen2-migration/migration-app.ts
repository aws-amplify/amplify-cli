import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { MockClients } from './mock-clients';
import { diff, copySync } from './directories';
import { Logger } from '../../../commands/gen2-migration';
import { BackendDownloader } from '../../../commands/gen2-migration/generate/codegen-head/backend_downloader';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import chalk from 'chalk';

const MIGRATION_APPS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'amplify-migration-apps');

export class MigrationApp {
  /**
   * Path in the repository to the application input directory.
   */
  public readonly inputPath: string;

  /**
   * Path in the repository to the application expectation directory.
   */
  public readonly expectedPath: string;

  /**
   * Name of the app.
   */
  public readonly name: string;

  /**
   * `amplify-meta.json`.
   */
  public readonly meta: any;

  /**
   * `team-provider-info.json`
   */
  public readonly tpi: any;

  /**
   * Id of the app. Taken from `amplify-meta.json`.
   */
  public readonly id: string;

  /**
   * Name of the (single) environment in the app.
   */
  public readonly environmentName: string;

  /**
   * Region of the app. Taken from `amplify-meta.json`.
   */
  public readonly region: string;

  /**
   * Mock SDK clients that return responses based on local information
   * in the app files. Use this to customize mocks for test specific needs.
   */
  public readonly clients: MockClients;

  /**
   * App specific logger instance that can be passed to codegen related code.
   */
  public readonly logger: Logger;

  constructor(name: string) {
    this.name = name;
    this.inputPath = path.join(MIGRATION_APPS_PATH, this.name, '_snapshot.input');
    this.expectedPath = path.join(MIGRATION_APPS_PATH, this.name, '_snapshot.expected');

    const amplifyPath = path.join(this.inputPath, 'amplify');
    const ccbPath = path.join(amplifyPath, '#current-cloud-backend');

    (BackendDownloader as any).ccbDir = ccbPath;

    this.meta = JSONUtilities.readJson(path.join(ccbPath, 'amplify-meta.json'));
    this.tpi = JSONUtilities.readJson(path.join(amplifyPath, 'team-provider-info.json'));
    this.id = this.meta.providers.awscloudformation.AmplifyAppId;
    this.region = this.meta.providers.awscloudformation.Region;

    const environments = Object.keys(this.tpi);
    if (environments.length !== 1) {
      throw new Error(`Unexpected number of environments in app ${this.name}: ${environments.length}`);
    }
    this.environmentName = environments[0];
    this.clients = new MockClients(this);
    this.logger = new Logger('generate', this.name, this.environmentName);
  }

  public static async with(appName: string, callback: (app: MigrationApp) => Promise<void>) {
    const cwd = process.cwd();
    const workDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), path.basename(__filename))), appName);
    copySync(path.join(MIGRATION_APPS_PATH, appName, '_snapshot.input'), workDir);
    process.chdir(workDir);
    try {
      await callback(new MigrationApp(appName));
    } finally {
      process.chdir(cwd);
    }
  }

  public async compare(actualDir: string, ignorePatterns: RegExp[]): Promise<string | undefined> {
    const differences = await diff({ expectedDir: this.expectedPath, actualDir, ignorePatterns });
    if (differences.length === 0) {
      return undefined;
    }

    const report = [
      '',
      `----------- Snapshot Report (${this.name}) -----------`,
      '',
      ` • Actual: ${actualDir}`,
      ` • Expected: ${this.expectedPath}`,
      ` • Input: ${this.inputPath}`,
      ` • Ignored: ${ignorePatterns}`,
    ];

    // first print the missing/extra files
    for (const difference of differences.filter((f) => !f.diff)) {
      switch (difference.diffType) {
        case 'missing':
          report.push(chalk.bold(chalk.red(`(-) ${difference.relativePath} (${difference.diffType})`)));
          break;
        case 'extra':
          report.push(chalk.bold(chalk.green(`(+) ${difference.relativePath} (${difference.diffType})`)));
          break;
        case 'modified':
          // handled separately below
          break;
        default:
          throw new Error(`Unrecognized diff type: ${difference.diffType}`);
      }
    }

    report.push('');

    // then print the modified files
    for (const difference of differences.filter((f) => f.diff)) {
      report.push(chalk.bold(chalk.yellow(`(~) ${difference.relativePath} (${difference.diffType})`)));
      report.push('');
      report.push(difference.diff!);
    }

    return report.join('\n');
  }

  public templatePathForStack(stackName: string) {
    const ccbPath = path.join(this.inputPath, 'amplify', '#current-cloud-backend');

    const parts = stackName.split('/');

    if (parts.length === 1) {
      return path.join(ccbPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    }

    if (parts[1].startsWith('auth')) {
      const authName = parts[1].substring(4);
      return path.join(ccbPath, 'auth', authName, 'build', `${authName}-cloudformation-template.json`);
    }

    if (parts[1].startsWith('storage')) {
      const storageName = parts[1].substring(7);
      return path.join(ccbPath, 'storage', storageName, 'build', 'cloudformation-template.json');
    }

    if (parts[1].startsWith('function')) {
      const functionName = parts[1].substring(8);
      return path.join(ccbPath, 'function', functionName, `${functionName}-cloudformation-template.json`);
    }

    if (parts[1].startsWith('api')) {
      const apiName = parts[1].substring(3);

      if (parts.length === 2) {
        return path.join(ccbPath, 'api', apiName, 'build', 'cloudformation-template.json');
      }

      if (parts.length === 3) {
        let nestedStackName = parts[2];
        if (nestedStackName === 'CustomResourcesjson') {
          // why god why
          nestedStackName = 'CustomResources';
        }
        return path.join(ccbPath, 'api', apiName, 'build', 'stacks', `${nestedStackName}.json`);
      }

      throw new Error(`Unexpected number of parts for stack: ${stackName}`);
    }

    throw new Error(`Unable to locate template path for stack: ${stackName}`);
  }
}
