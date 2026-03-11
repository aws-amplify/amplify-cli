import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import { MockClients } from './clients';
import { copySync } from './directories';
import { Logger } from '../../../../commands/gen2-migration';
import { BackendDownloader } from '../../../../commands/gen2-migration/generate/codegen-head/backend_downloader';
import { BackendDownloader as NewBackendDownloader } from '../../../../commands/gen2-migration/generate-new/input/backend-downloader';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { Snapshot } from './snapshot';

const MIGRATION_APPS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'amplify-migration-apps');

/**
 * Options that individual tests can pass when constructing a `MigrationApp`.
 *
 * These options customize behavior that varies between test cases but cannot
 * be derived from the app's local files alone.
 */
export interface MigrationAppOptions {
  /**
   * The Amplify build spec YAML string returned by the `GetAppCommand` mock.
   *
   * In a real Amplify app, the build spec is configured in the Amplify Console
   * and defines how the frontend is built and deployed. The migration codegen
   * reads this to generate an `amplify.yml` file in the Gen2 output.
   *
   * Apps that are backend-only (no hosting) omit this, which causes the codegen
   * to skip `amplify.yml` generation. For example, `project-boards-backend-only`
   * does not pass a buildSpec.
   */
  readonly buildSpec?: string;
}

/**
 * Represents a Gen1 Amplify application under test for the migration codegen.
 *
 * Each `MigrationApp` corresponds to a directory under `amplify-migration-apps/`
 * (e.g., `amplify-migration-apps/fitness-tracker/`). That directory contains a
 * realistic Gen1 project layout with `amplify/`, `package.json`, `.gitignore`,
 * and a set of `_snapshot.*` directories holding the test inputs and golden outputs.
 *
 * The class reads the app's configuration files (`amplify-meta.json`,
 * `team-provider-info.json`, `root-cloudformation-stack.json`) and exposes
 * parsed metadata (app ID, region, environment name, stack name). It also
 * creates a full set of mock AWS SDK clients via {@link MockClients} so that
 * the migration codegen can make SDK calls that return realistic responses
 * derived entirely from local files — no AWS credentials needed.
 *
 * Typical usage in a test:
 *
 * ```typescript
 * await MigrationApp.run('fitness-tracker', async (app) => {
 *   await prepare(app.logger, app.id, app.environmentName, app.region);
 *   const report = await app.snapshots.generate.compare(process.cwd());
 *   expect(report.hasChanges).toBeFalsy();
 * });
 * ```
 *
 * The static `run()` method handles the boilerplate of copying the app to a
 * temp directory, `chdir`-ing into it, and restoring the original cwd afterward.
 */
export class MigrationApp {
  /**
   * Absolute path in the repository to the application directory.
   *
   * Example: `/Users/dev/amplify-cli/amplify-migration-apps/fitness-tracker`
   */
  public readonly path: string;

  /**
   * Absolute path to the `#current-cloud-backend` directory inside the app.
   *
   * This directory mirrors what the Amplify CLI stores locally after a successful
   * `amplify push`. It contains the last-deployed CloudFormation templates,
   * `amplify-meta.json`, and per-resource configuration files. The mock clients
   * read templates and resource configs from this directory.
   *
   * Example: `.../fitness-tracker/amplify/#current-cloud-backend`
   */
  public readonly ccbPath: string;

  /**
   * Name of the app, matching the directory name under `amplify-migration-apps/`.
   *
   * Example: `"fitness-tracker"`, `"discussions"`, `"mood-board"`
   */
  public readonly name: string;

  /**
   * Parsed contents of `amplify/#current-cloud-backend/amplify-meta.json`.
   *
   * This file is the central registry of all deployed Amplify resources. It maps
   * each category (auth, api, function, storage, analytics) to its resources,
   * including the AWS service type and deployed outputs (ARNs, IDs, names).
   *
   * Structure example:
   * ```json
   * {
   *   "providers": {
   *     "awscloudformation": {
   *       "StackName": "amplify-fitnesstracker-main-123456",
   *       "DeploymentBucketName": "amplify-fitnesstracker-main-...",
   *       "AmplifyAppId": "d1abc2def3",
   *       "Region": "us-east-1"
   *     }
   *   },
   *   "auth": { "<resourceName>": { "service": "Cognito", "output": { "UserPoolId": "..." } } },
   *   "api":  { "<resourceName>": { "service": "AppSync", "output": { "GraphQLAPIIdOutput": "..." } } },
   *   "function": { "<resourceName>": { "service": "Lambda", "output": { "Arn": "..." } } }
   * }
   * ```
   */
  public readonly meta: any;

  /**
   * Parsed contents of `amplify/team-provider-info.json`.
   *
   * This file stores per-environment configuration, keyed by environment name
   * (e.g., `"main"`, `"dev"`). Each environment entry contains a `categories`
   * object that lists all resources per category along with their parameter
   * overrides. The test framework expects exactly one environment per app.
   *
   * Structure example:
   * ```json
   * {
   *   "main": {
   *     "categories": {
   *       "auth": { "fitnesstracker99c4df21": {} },
   *       "function": { "admin": {}, "PreSignup": {} },
   *       "api": { "fitnesstracker": {} }
   *     }
   *   }
   * }
   * ```
   */
  public readonly tpi: any;

  /**
   * Parsed contents of the root CloudFormation stack template.
   *
   * Located at `amplify/#current-cloud-backend/awscloudformation/build/root-cloudformation-stack.json`.
   * This is the top-level CloudFormation template that Amplify deploys. It contains
   * nested stack resources (one per Amplify resource) and wires parameters between
   * them.
   *
   * Key sections:
   * - `Resources`: Nested `AWS::CloudFormation::Stack` resources, one per Amplify resource
   * - `Resources.<id>.Properties.Parameters`: Values passed to nested stacks (may be
   *   concrete strings, `{ "Ref": "..." }`, or `{ "Fn::GetAtt": [...] }`)
   */
  public readonly rootTemplate: any;

  /**
   * Name of the root CloudFormation stack.
   *
   * Taken from `amplify-meta.json` at `providers.awscloudformation.StackName`.
   * Example: `"amplify-fitnesstracker-main-123456"`
   */
  public readonly rootStackName: string;

  /**
   * Amplify app ID. Taken from `amplify-meta.json` at
   * `providers.awscloudformation.AmplifyAppId`.
   *
   * Example: `"d1abc2def3"`
   */
  public readonly id: string;

  /**
   * AWS region of the app. Taken from `amplify-meta.json` at
   * `providers.awscloudformation.Region`.
   *
   * Example: `"us-east-1"`
   */
  public readonly region: string;

  /**
   * Name of the single environment in the app.
   *
   * Taken from the top-level keys of `team-provider-info.json`. The framework
   * requires exactly one environment per test app (e.g., `"main"` or `"dev"`).
   * Multiple environments would make mock responses ambiguous.
   */
  public readonly environmentName: string;

  /**
   * Mock AWS SDK clients that return responses derived from local app files.
   *
   * Each property on `MockClients` is an `aws-sdk-client-mock` instance for a
   * specific AWS service. Tests can further customize mock behavior via the
   * `customize` callback in `testSnapshot`:
   *
   * ```typescript
   * await testSnapshot('my-app', {}, async (app) => {
   *   app.clients.cognitoIdentityProvider
   *     .on(GetUserPoolMfaConfigCommand)
   *     .resolves({ MfaConfiguration: 'ON' });
   * });
   * ```
   */
  public readonly clients: MockClients;

  /**
   * Logger instance scoped to this app, passed to the migration codegen.
   *
   * Logs are prefixed with the command name, app name, and environment name
   * for easy identification in test output.
   */
  public readonly logger: Logger;

  /**
   * Generate and refactor snapshots for this app.
   *
   * - `snapshots.generate` — compares against `_snapshot.post.generate/`, uses `_snapshot.pre.generate/` as input.
   * - `snapshots.refactor` — compares against `_snapshot.post.refactor/`, uses `_snapshot.pre.refactor/` as input.
   */
  public readonly snapshots: { generate: Snapshot; refactor: Snapshot };

  /**
   * Custom options for the app, provided by individual tests.
   *
   * See {@link MigrationAppOptions} for available options.
   */
  public readonly options: MigrationAppOptions;

  /**
   * Creates a new MigrationApp by reading all configuration files from disk.
   *
   * This constructor is typically called by `MigrationApp.run()` rather than
   * directly. It reads `amplify-meta.json`, `team-provider-info.json`, and the
   * root CloudFormation template, then initializes all mock clients.
   *
   * It also monkey-patches `BackendDownloader.ccbDir` to point to the local
   * `#current-cloud-backend` directory, preventing the codegen from attempting
   * to download it from S3 (which would require real AWS credentials).
   *
   * @param name - Directory name under `amplify-migration-apps/` (e.g., `"fitness-tracker"`).
   * @param options - Optional test-specific configuration (e.g., `buildSpec`).
   * @throws Error if the app has more or fewer than exactly one environment in `team-provider-info.json`.
   */
  constructor(name: string, options: MigrationAppOptions = {}) {
    this.options = options;
    this.name = name;
    this.path = path.join(MIGRATION_APPS_PATH, this.name);
    this.snapshots = {
      refactor: new Snapshot({
        app: this,
        inputPath: path.join(this.path, '_snapshot.pre.refactor'),
        expectedPath: path.join(this.path, '_snapshot.post.refactor'),
      }),
      generate: new Snapshot({
        app: this,
        inputPath: path.join(this.path, '_snapshot.pre.generate'),
        expectedPath: path.join(this.path, '_snapshot.post.generate'),
      }),
    };

    const amplifyPath = path.join(this.snapshots.generate.props.inputPath, 'amplify');
    this.ccbPath = path.join(amplifyPath, '#current-cloud-backend');

    this.meta = JSONUtilities.readJson(path.join(this.ccbPath, 'amplify-meta.json'));
    this.tpi = JSONUtilities.readJson(path.join(amplifyPath, 'team-provider-info.json'));
    this.rootTemplate = JSONUtilities.readJson(path.join(this.ccbPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json'));
    this.rootStackName = this.meta.providers.awscloudformation.StackName;
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
    (NewBackendDownloader as any).ccbDir = this.ccbPath;
  }

  /**
   * Runs a test callback in an isolated temporary directory that simulates a
   * customer's Gen1 project.
   *
   * This is the primary entry point for snapshot tests. It:
   * 1. Creates a temp directory and copies the app's `amplify/`, `package.json`,
   *    and `.gitignore` into it (simulating what a customer would have locally).
   * 2. Constructs a `MigrationApp` instance with all mock clients initialized.
   * 3. `chdir`s into the temp directory so the codegen writes output there.
   * 4. Executes the callback (which typically runs the codegen and compares snapshots).
   * 5. Restores the original working directory in a `finally` block.
   *
   * Example:
   * ```typescript
   * await MigrationApp.run('fitness-tracker', async (app) => {
   *   await prepare(app.logger, app.id, app.environmentName, app.region);
   *   const report = await app.snapshots.generate.compare(process.cwd());
   *   expect(report.hasChanges).toBeFalsy();
   * }, { buildSpec: BUILDSPEC });
   * ```
   *
   * @param appName - The name of the migration app (corresponds to a directory under `amplify-migration-apps/`).
   * @param callback - An async function that receives the `MigrationApp` instance and performs the migration logic to test.
   * @param appOptions - Optional configuration passed to the `MigrationApp` constructor (e.g., `buildSpec`).
   */
  public static async run(appName: string, callback: (app: MigrationApp) => Promise<void>, appOptions?: MigrationAppOptions) {
    const cwd = process.cwd();
    const tempDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), path.basename(__filename))));
    const workDir = path.join(tempDir, appName);

    const app = new MigrationApp(appName, appOptions);

    copySync({ src: path.join(app.snapshots.generate.props.inputPath), dest: workDir });

    process.chdir(workDir);
    try {
      await callback(app);
    } finally {
      process.chdir(cwd);
    }
  }

  /**
   * Returns the path to a CloudFormation template file in `_snapshot.pre.refactor/`.
   *
   * @param stackName - The CloudFormation stack name (e.g., `"amplify-fitnesstracker-main-12345"`).
   */
  public templatePathForStack(stackName: string): string {
    return path.join(this.snapshots.refactor.props.inputPath, `${stackName}.template.json`);
  }

  /**
   * Returns the template path for the stack that owns a given physical resource ID.
   *
   * Uses the CloudFormation mock's internal mapping (built during `DescribeStackResources`
   * calls) to resolve which stack a resource belongs to.
   *
   * @param physicalId - The physical resource ID to look up.
   */
  public templatePathForResource(physicalId: string) {
    const stackName = this.clients.cloudformation.stackNameForResource(physicalId);
    return this.templatePathForStack(stackName);
  }

  /**
   * Resolves the nested stack name for a given parent stack and logical resource ID.
   *
   * CloudFormation truncates hashes when naming nested stacks, so this method scans
   * `_snapshot.pre.refactor/` for template files that match the parent stack base name
   * and contain the logical ID, returning the shortest match.
   *
   * @param parentStackName - The parent stack name.
   * @param logicalId - The logical resource ID of the nested stack (e.g., `"FunctionDirectiveStack"`).
   */
  public nestedStackName(parentStackName: string, logicalId: string) {
    // the fifth element is a hash that gets trimmed for length when naming nested stacks.
    // remove it from consideration. For example
    //
    // parentStackName = 'amplify-productcatalog-main-31323-apiproductcatalog-1KOJQLNKG63G'
    // logicalId = 'FunctionDirectiveStack'
    // nestedStackName = 'amplify-productcatalog-main-31323-apiproductcatalog-1KOJQLNKG63-FunctionDirectiveStack-1X1DEXAOL9FGJ'
    //
    // notice the hash in the parent is longer than the hash in the nested stack.
    const parentStackBaseName = parentStackName.split('-').slice(0, 5).join('-');
    const candidates = fs
      .readdirSync(this.snapshots.refactor.props.inputPath)
      .filter((f) => f.startsWith(parentStackBaseName) && f.includes(logicalId) && f.endsWith('.template.json'))
      .sort((a, b) => a.length - b.length);
    if (candidates.length === 0) {
      throw new Error(`Unable to find candidates for nested ${logicalId} of parent stack ${parentStackName}`);
    }
    return candidates[0].replace('.template.json', '');
  }

  /**
   * Resolves the physical resource ID for a logical resource in a stack.
   *
   * Scans the stack template's `Outputs` for a `Ref` to the logical ID and returns
   * the corresponding output value from the stack's outputs file. Returns `undefined`
   * if the resource doesn't expose its physical ID as an output.
   *
   * @param stackName - The CloudFormation stack name.
   * @param logicalId - The logical resource ID to resolve.
   */
  public physicalId(stackName: string, logicalId: string) {
    const templatePath = this.templatePathForStack(stackName);
    const template = JSONUtilities.readJson<any>(templatePath);
    for (const outputKey of Object.keys(template.Outputs ?? [])) {
      const output = template.Outputs[outputKey];
      const refValue = output.Value.Ref;
      if (refValue === logicalId) {
        const outputValue = this.cfnOutputForStack(stackName, outputKey);
        return outputValue;
      }
    }

    // some resources don't expose their physical id as an output
    return undefined;
  }

  /**
   * Finds the Amplify resource name in a category by matching an output value from `amplify-meta.json`.
   *
   * @param options - The category, service, output key, and expected output value to match.
   * @throws Error if no resource matches.
   */
  public resourceName(options: { category: string; service: string; outputKey: string; outputValue: string }) {
    for (const resourceName of Object.keys(this.meta[options.category])) {
      const actualOutputValue = this.metaOutput(options.category, resourceName, options.outputKey);
      if (actualOutputValue === options.outputValue) {
        return resourceName;
      }
    }

    throw new Error(
      `Unable to find resource name in category ${options.category} (${options.service}) that contains ${options.outputKey} output with value ${options.outputValue}`,
    );
  }

  /**
   * Reads and returns the CLI inputs configuration for a specific resource.
   *
   * The `cli-inputs.json` file stores the user's answers to Amplify CLI prompts
   * when adding or updating a resource. For example, the auth `cli-inputs.json`
   * contains password policy settings, MFA configuration, OAuth metadata, and
   * social provider configuration. The API `cli-inputs.json` contains the default
   * and additional authentication types.
   *
   * @param resourceName - The Amplify-friendly name of the resource (e.g., `"fitnesstracker99c4df21"`).
   * @param category - The Amplify category (e.g., `"auth"`, `"api"`, `"function"`).
   * @returns The parsed `cli-inputs.json` content as a JSON object.
   */
  public cliInputsForResource(resourceName: string, category: string) {
    return JSONUtilities.readJson<any>(path.join(this.ccbPath, category, resourceName, 'cli-inputs.json'));
  }

  /**
   * Returns all CloudFormation outputs for a stack from `_snapshot.pre.refactor/`.
   *
   * @param stackName - The CloudFormation stack name.
   */
  public cfnOutputsForStack(stackName: string) {
    const templatePath = this.templatePathForStack(stackName);
    return JSONUtilities.readJson<any>(templatePath.replace('.template.json', '.outputs.json'));
  }

  /**
   * Returns a single CloudFormation output value for a stack.
   *
   * @param stackName - The CloudFormation stack name.
   * @param outputKey - The output key to retrieve.
   * @throws Error if zero or more than one output matches the key.
   */
  public cfnOutputForStack(stackName: string, outputKey: string) {
    const outputs = this.cfnOutputsForStack(stackName) as any[];
    const candidates = outputs.filter((o) => o.OutputKey === outputKey);
    if (candidates.length !== 1) {
      throw new Error(`Unexpected number of outputs with key ${outputKey} in stack ${stackName}: ${candidates.length}`);
    }
    return candidates[0].OutputValue;
  }

  /**
   * Returns all CloudFormation parameters for a stack from `_snapshot.pre.refactor/`.
   *
   * @param stackName - The CloudFormation stack name.
   */
  public cfnParametersForStack(stackName: string) {
    const templatePath = this.templatePathForStack(stackName);
    return JSONUtilities.readJson<any>(templatePath.replace('.template.json', '.parameters.json'));
  }

  /**
   * Returns a single CloudFormation parameter value for a stack.
   *
   * @param stackName - The CloudFormation stack name.
   * @param parameterKey - The parameter key to retrieve.
   * @throws Error if zero or more than one parameter matches the key.
   */
  public cfnParameterForStack(stackName: string, parameterKey: string) {
    const outputs = this.cfnParametersForStack(stackName) as any[];
    const candidates = outputs.filter((o) => o.ParameterKey === parameterKey);
    if (candidates.length !== 1) {
      throw new Error(`Unexpected number of parameters with key ${parameterKey} in stack ${stackName}: ${candidates.length}`);
    }
    return candidates[0].ParameterValue;
  }

  /**
   * Returns the CloudFormation stack description from `_snapshot.pre.refactor/`.
   *
   * @param stackName - The CloudFormation stack name.
   */
  public cfnDescriptionForStack(stackName: string) {
    const templatePath = this.templatePathForStack(stackName);
    return fs.readFileSync(templatePath.replace('.template.json', '.description.txt'), { encoding: 'utf-8' });
  }

  /**
   * Returns a resource output value from `amplify-meta.json`.
   *
   * Example: `metaOutput('auth', 'myAuth', 'UserPoolId')` returns the user pool ID
   * from `meta.auth.myAuth.output.UserPoolId`.
   *
   * @param category - The Amplify category (e.g., `"auth"`, `"api"`, `"storage"`).
   * @param resourceName - The Amplify-friendly resource name.
   * @param outputKey - The output key to retrieve.
   * @returns The output value as a string.
   */
  public metaOutput(category: string, resourceName: string, outputKey: string): string {
    return this.meta[category]![resourceName]!.output![outputKey]!;
  }

  /**
   * Returns the name of the single resource in a given category.
   *
   * This is a convenience method for categories that have exactly one primary
   * resource. It reads resource names from `team-provider-info.json` and applies
   * category-specific filtering:
   *
   * - For `auth`: Filters out auxiliary resources like `userPoolGroups` (service
   *   `Cognito-UserPool-Groups`), keeping only the primary Cognito resource.
   * - For `api`: Filters out API Gateway resources, keeping only AppSync APIs.
   *
   * This filtering is necessary because Gen1 apps can have multiple resources
   * in a category that serve different purposes. For example, an auth category
   * might contain both `myAuth` (the primary user pool, service `Cognito`) and
   * `userPoolGroups` (service `Cognito-UserPool-Groups`). Most mock clients
   * only need the primary resource.
   *
   * @param category - The Amplify category (e.g., `"auth"`, `"api"`, `"function"`, `"storage"`).
   * @param service - The Amplify service type to filter by (e.g., `"Cognito"`, `"AppSync"`).
   * @returns The name of the single resource in the category.
   * @throws Error if the category contains zero or more than one resource after filtering.
   */
  public singleResourceName(category: string, service: string) {
    let resourceNames = Object.keys(this.tpi[this.environmentName]['categories'][category]);

    if (resourceNames.length > 1) {
      resourceNames = resourceNames.filter((name) => {
        return this.meta[category]?.[name]?.service === service;
      });
    }

    if (resourceNames.length !== 1) {
      throw new Error(`Unexpected number of resources for category '${category}': ${resourceNames.join(',')}`);
    }
    return resourceNames[0];
  }
}
