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
const MIGRATION_APP_INPUT_DIR = '_snapshot.input';
const MIGRATION_APP_EXPECTED_DIR = '_snapshot.expected';

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
   * Path to the #current-cloud-backend directory inside the local app dir.
   */
  public readonly ccbPath: string;

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
   * Region of the app. Taken from `amplify-meta.json`.
   */
  public readonly region: string;

  /**
   * Name of the (single) environment in the app. Taken from `team-provider-info.json`.
   */
  public readonly environmentName: string;

  /**
   * Mock SDK clients that return responses based on local information
   * in the app files. Use this to further customize mocks for test specific needs.
   */
  public readonly clients: MockClients;

  /**
   * App specific logger instance that can be passed to codegen related code.
   */
  public readonly logger: Logger;

  constructor(name: string) {
    this.name = name;
    this.inputPath = path.join(MIGRATION_APPS_PATH, this.name, MIGRATION_APP_INPUT_DIR);
    this.expectedPath = path.join(MIGRATION_APPS_PATH, this.name, MIGRATION_APP_EXPECTED_DIR);

    const amplifyPath = path.join(this.inputPath, 'amplify');
    this.ccbPath = path.join(amplifyPath, '#current-cloud-backend');

    this.meta = JSONUtilities.readJson(path.join(this.ccbPath, 'amplify-meta.json'));
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

    // prevents the code from downloading ccb from s3 and instead
    // point to the local input file.
    (BackendDownloader as any).ccbDir = this.ccbPath;
  }

  public static async with(appName: string, callback: (app: MigrationApp) => Promise<void>) {
    const cwd = process.cwd();
    const workDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), path.basename(__filename))), appName);
    copySync(path.join(MIGRATION_APPS_PATH, appName, MIGRATION_APP_INPUT_DIR), workDir);
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

  public templateForResource(resourceName: string, category: string) {
    let templatePath;

    switch (category) {
      case 'function':
        templatePath = path.join(this.ccbPath, 'function', resourceName, `${resourceName}-cloudformation-template.json`);
        break;
      case 'api':
        templatePath = path.join(this.ccbPath, 'api', resourceName, 'build', `cloudformation-template.json`);
        break;
      case 'auth':
        templatePath = path.join(this.ccbPath, 'auth', resourceName, 'build', `${resourceName}-cloudformation-template.json`);
        break;
      default:
        throw new Error(`Unrecognized category: ${category}`);
    }

    return JSONUtilities.readJson<any>(templatePath);
  }

  public cliInputsForResource(resourceName: string, category: string) {
    return JSONUtilities.readJson<any>(path.join(this.ccbPath, category, resourceName, 'cli-inputs.json'));
  }

  public singleResourceName(category: string) {
    const resourceNames = Object.keys(this.tpi[this.environmentName]['categories'][category]);
    if (resourceNames.length !== 1) {
      throw new Error(`Unexpected number of resources for category '${category}': ${resourceNames.join(',')}`);
    }
    return resourceNames[0];
  }
}
