import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { MockClients } from './migration-app-mock-clients';
import { diff, copySync } from './directories';
import { Logger } from '../../../commands/gen2-migration';
import { BackendDownloader } from '../../../commands/gen2-migration/generate/codegen-head/backend_downloader';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Snapshot } from './migration-app-snapshot';

const MIGRATION_APPS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'amplify-migration-apps');
const MIGRATION_APP_INPUT_DIR = '_snapshot.input';
const MIGRATION_APP_EXPECTED_DIR = '_snapshot.expected';

export const CFN_NESTED_STACK_SEPARATOR = '/';

export interface AppOptions {
  readonly buildSpec?: string;
}

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

  /**
   * Custom options for the app, provided by individual tests.
   */
  public readonly options: AppOptions;

  constructor(name: string, options: AppOptions = {}) {
    this.options = options;
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

  /**
   * Runs a functions in an isolated app specific environment.
   *
   * This method sets up a test environment by copying the app's input snapshot
   * to a temporary directory and executing the provided callback. The callback
   * receives a `MigrationApp` instance configured to work within the temporary
   * directory.
   *
   * Note: This method does not perform snapshot comparison. Use the `compare()`
   * method within the callback to compare results against expected snapshots.
   *
   * @param appName - The name of the migration app (corresponds to a directory under `amplify-migration-apps/`).
   * @param callback - An async function that receives the `MigrationApp` instance and performs the migration logic to test.
   *
   */
  public static async run(appName: string, callback: (app: MigrationApp) => Promise<void>, appOptions?: AppOptions) {
    const cwd = process.cwd();
    const workDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), path.basename(__filename))), appName);
    copySync(path.join(MIGRATION_APPS_PATH, appName, MIGRATION_APP_INPUT_DIR), workDir);
    process.chdir(workDir);
    try {
      const app = new MigrationApp(appName, appOptions);
      await callback(app);
    } finally {
      process.chdir(cwd);
    }
  }

  /**
   * Compares the contents of an actual directory against the expected snapshot for this app.
   *
   * This method performs a recursive diff between the provided directory and the app's
   * expected snapshot directory, returning a `Snapshot` object that contains the differences
   * and provides methods for reporting and updating.
   *
   * @param actualDir - The directory containing the actual output to compare.
   * @param ignorePatterns - Optional array of regex patterns for files/directories to exclude from comparison.
   *                         The `node_modules` pattern is always added automatically.
   * @returns A `Snapshot` object containing the comparison results, which can be used to
   *          check for changes, generate reports, or update the expected snapshot.
   */
  public async compare(actualDir: string, ignorePatterns?: RegExp[]): Promise<Snapshot> {
    const fulleIgnorePatterns = [...(ignorePatterns ?? []), /node_modules/];
    const differences = await diff({ expectedDir: this.expectedPath, actualDir, ignorePatterns: fulleIgnorePatterns });
    return new Snapshot({
      appName: this.name,
      expectedPath: this.expectedPath,
      inputPath: this.inputPath,
      actualPath: actualDir,
      differences: differences,
      ignorePatterns: fulleIgnorePatterns,
    });
  }

  /**
   * Resolves the file path to the CloudFormation template for a given stack.
   *
   * Stack names can be hierarchical, using `/` as a separator (see `CFN_NESTED_STACK_SEPARATOR`).
   * The method parses the stack name to determine the category (auth, storage, function, api)
   * and returns the appropriate template path within the `#current-cloud-backend` directory.
   *
   * @param stackName - The CloudFormation stack name, which may include nested stack paths
   *                    (e.g., `root`, `root/authMyAuth`, `root/apiMyApi/CustomResources`).
   * @returns The absolute file path to the CloudFormation template JSON file.
   * @throws Error if the stack name format is unrecognized or the category is unsupported.
   */
  public templatePathForStack(stackName: string) {
    const parts = stackName.split(CFN_NESTED_STACK_SEPARATOR);

    if (parts.length === 1) {
      return path.join(this.ccbPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    }

    if (parts[1].startsWith('auth')) {
      const authName = parts[1].substring(4);
      return path.join(this.ccbPath, 'auth', authName, 'build', `${authName}-cloudformation-template.json`);
    }

    if (parts[1].startsWith('storage')) {
      const storageName = parts[1].substring(7);
      return path.join(this.ccbPath, 'storage', storageName, 'build', 'cloudformation-template.json');
    }

    if (parts[1].startsWith('function')) {
      const functionName = parts[1].substring(8);
      return path.join(this.ccbPath, 'function', functionName, `${functionName}-cloudformation-template.json`);
    }

    if (parts[1].startsWith('api')) {
      const apiName = parts[1].substring(3);

      if (parts.length === 2) {
        return path.join(this.ccbPath, 'api', apiName, 'build', 'cloudformation-template.json');
      }

      if (parts.length === 3) {
        let nestedStackName = parts[2];
        if (nestedStackName === 'CustomResourcesjson') {
          // why god why
          nestedStackName = 'CustomResources';
        }
        return path.join(this.ccbPath, 'api', apiName, 'build', 'stacks', `${nestedStackName}.json`);
      }

      throw new Error(`Unexpected number of parts for stack: ${stackName}`);
    }

    throw new Error(`Unable to locate template path for stack: ${stackName}`);
  }

  /**
   * Reads and returns the parsed CloudFormation template for a specific resource.
   *
   * @param resourceName - The amplify friendly name of the resource (e.g., the Lambda function name or API name).
   * @param category - The Amplify category of the resource (`function`, `api`, or `auth`).
   * @returns The parsed CloudFormation template as a JSON object.
   * @throws Error if the category is not recognized.
   */
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

  /**
   * Reads and returns the CLI inputs configuration for a specific resource.
   *
   * @param resourceName - The amplify friendly name of the resource.
   * @param category - The Amplify category of the resource (e.g., `function`, `api`, `auth`).
   * @returns The parsed `cli-inputs.json` content as a JSON object.
   */
  public cliInputsForResource(resourceName: string, category: string) {
    return JSONUtilities.readJson<any>(path.join(this.ccbPath, category, resourceName, 'cli-inputs.json'));
  }

  /**
   * Returns the name of the single resource in a given category.
   *
   * This is a convenience method for apps that have exactly one resource per category.
   * It reads the resource names from `team-provider-info.json` and throws if there
   * is not exactly one resource.
   *
   * @param category - The Amplify category (e.g., `function`, `api`, `auth`).
   * @returns The name of the single resource in the category.
   * @throws Error if the category contains zero or more than one resource.
   */
  public singleResourceName(category: string) {
    const resourceNames = Object.keys(this.tpi[this.environmentName]['categories'][category]);
    if (resourceNames.length !== 1) {
      throw new Error(`Unexpected number of resources for category '${category}': ${resourceNames.join(',')}`);
    }
    return resourceNames[0];
  }
}
