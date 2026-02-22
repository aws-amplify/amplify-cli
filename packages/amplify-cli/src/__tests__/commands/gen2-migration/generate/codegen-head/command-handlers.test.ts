import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import * as amplify from '@aws-sdk/client-amplify';
import * as lambda from '@aws-sdk/client-lambda';
import * as cloudformation from '@aws-sdk/client-cloudformation';
import * as idp from '@aws-sdk/client-cognito-identity-provider';
import * as cognito from '@aws-sdk/client-cognito-identity';
import * as s3 from '@aws-sdk/client-s3';
import * as appsync from '@aws-sdk/client-appsync';
import * as cwe from '@aws-sdk/client-cloudwatch-events';
import { diff, copySync } from '../../../../directories';
import chalk from 'chalk';
import { prepare } from '../../../../../commands/gen2-migration/generate/codegen-head/command-handlers';
import { Logger } from '../../../../../commands/gen2-migration';
import { BackendDownloader } from '../../../../../commands/gen2-migration/generate/codegen-head/backend_downloader';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

// high to allow for debugging in the IDE
const TIMEOUT_MINUTES = 60;

jest.setTimeout(60 * 1000 * TIMEOUT_MINUTES);

jest.unmock('fs-extra');

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

afterAll(() => {
  jest.resetModules();
  jest.mock('fs-extra');
});

const MIGRATION_APPS_PATH = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', '..', 'amplify-migration-apps');

test('project boards snapshot', async () => {
  const appName = 'project-boards';
  const app = new App(appName);

  await withTempDir(appName, async (workDir: string) => {
    // this function overrides workdir with the gen2 app.
    await prepare(app.logger, app.id, app.environmentName, app.region);

    const report = await app.compare(workDir, [/node_modules/, /.gitignore/, /package.json/]);

    if (report) {
      console.log(report);
      throw new Error('Snapshot changes detected. See above report for details.');
    }
  });
});

async function withTempDir(appName: string, callback: (tempDir: string) => Promise<void>) {
  const cwd = process.cwd();
  const workDir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), path.basename(__filename))), appName);
  copySync(path.join(MIGRATION_APPS_PATH, appName, '_snapshot.input'), workDir);
  process.chdir(workDir);
  try {
    await callback(workDir);
  } finally {
    process.chdir(cwd);
  }
}

class App {
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

class MockClients {
  public readonly amplify;
  public readonly cloudformation;
  public readonly lambda;
  public readonly cognitoIdentityProvider;
  public readonly cognitoIdentity;
  public readonly cwe;
  public readonly appsync;
  public readonly s3;

  constructor(private readonly app: App) {
    this.amplify = this.mockAmplify();
    this.cloudformation = this.mockCloudFormation();
    this.lambda = this.mockLambda();
    this.cognitoIdentity = this.mockCognitoIdentity();
    this.cognitoIdentityProvider = this.mockCognitoIdentityProvider();
    this.cwe = this.mockCloudWatchEvents();
    this.appsync = this.mockAppSync();
    this.s3 = this.mockS3();
  }

  private mockS3() {
    const mock = mockClient(s3.S3Client);
    mock.on(s3.GetBucketNotificationConfigurationCommand).resolves({
      LambdaFunctionConfigurations: [],
    });
    mock.on(s3.GetBucketAccelerateConfigurationCommand).resolves({
      Status: undefined,
    });
    mock.on(s3.GetBucketVersioningCommand).resolves({
      Status: undefined,
    });
    mock.on(s3.GetBucketEncryptionCommand).resolves({
      ServerSideEncryptionConfiguration: {
        Rules: [
          {
            ApplyServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
            BucketKeyEnabled: false,
          },
        ],
      },
    });
    return mock;
  }

  private mockAppSync() {
    const mock = mockClient(appsync.AppSyncClient);
    mock.on(appsync.GetGraphqlApiCommand).resolves({
      graphqlApi: {
        additionalAuthenticationProviders: [
          {
            authenticationType: 'AMAZON_COGNITO_USER_POOLS',
            userPoolConfig: {
              awsRegion: 'us-east-1',
              userPoolId: 'us-east-1_u2JZpr8U2',
            },
          },
        ],
        logConfig: undefined,
      },
    });
    mock.on(appsync.ListGraphqlApisCommand).resolves({
      graphqlApis: [
        {
          apiId: 'n3nft7hnjrbwxiwpb32fcdqfaa',
          name: 'projectboards',
          tags: {
            'user:Stack': 'main',
            'user:Application': 'projectboards',
          },
        },
      ],
    });
    return mock;
  }

  private mockCloudWatchEvents() {
    return mockClient(cwe.CloudWatchEventsClient);
  }

  private mockCognitoIdentity() {
    const mock = mockClient(cognito.CognitoIdentityClient);

    mock.on(cognito.DescribeIdentityPoolCommand).resolves({
      AllowUnauthenticatedIdentities: true,
      IdentityPoolName: this.app.meta.auth['projectboardsc8c5bcda'].output.IdentityPoolName,
    });

    return mock;
  }

  private mockCognitoIdentityProvider() {
    const mock = mockClient(idp.CognitoIdentityProviderClient);

    mock.on(idp.DescribeUserPoolCommand).resolves({
      UserPool: {
        EmailVerificationMessage: 'Your verification code is {####}',
        EmailVerificationSubject: 'Your verification code',
        SchemaAttributes: [{ Name: 'email', Required: true, Mutable: true }],
        UsernameAttributes: ['email'],
        Policies: {
          PasswordPolicy: {
            MinimumLength: 8,
            RequireUppercase: false,
            RequireLowercase: false,
            RequireNumbers: false,
            RequireSymbols: false,
            TemporaryPasswordValidityDays: 7,
          },
        },
      },
    });

    mock.on(idp.GetUserPoolMfaConfigCommand).resolves({
      SoftwareTokenMfaConfiguration: {},
      MfaConfiguration: 'OFF',
    });

    mock.on(idp.DescribeUserPoolClientCommand).callsFake((input) => {
      // Return different responses based on which client is being queried
      // The PhysicalResourceId format is "stackName/LogicalId" from the CFN mock
      // UserPoolClient (native app client) vs UserPoolClientWeb (web client)
      if (input.ClientId && !input.ClientId.includes('UserPoolClientWeb')) {
        // Native app client (UserPoolClient) - this is the one used for userPoolClient in auth definition
        return {
          UserPoolClient: {
            ClientId: input.ClientId,
            RefreshTokenValidity: 30,
            TokenValidityUnits: { RefreshToken: 'days' },
            EnableTokenRevocation: true,
            EnablePropagateAdditionalUserContextData: false,
            AuthSessionValidity: 3,
            AllowedOAuthFlowsUserPoolClient: false,
            // ClientSecret is undefined, so generateSecret: false will be added by the synthesizer
            // ExplicitAuthFlows is not included to avoid generating authFlows property
          },
        };
      }
      // Web client (UserPoolClientWeb)
      return {
        UserPoolClient: {
          ClientId: input.ClientId,
          RefreshTokenValidity: 30,
          TokenValidityUnits: { RefreshToken: 'days' },
        },
      };
    });

    mock.on(idp.ListIdentityProvidersCommand).resolves({
      Providers: [],
    });

    mock.on(idp.ListGroupsCommand).resolves({
      Groups: [],
    });

    return mock;
  }

  private mockAmplify() {
    const mock = mockClient(amplify.AmplifyClient);

    mock.on(amplify.GetBackendEnvironmentCommand).resolves({
      backendEnvironment: {
        stackName: this.app.meta.providers.awscloudformation.StackName,
        deploymentArtifacts: this.app.meta.providers.awscloudformation.DeploymentBucketName,
        environmentName: this.app.environmentName,
        backendEnvironmentArn: undefined,
        createTime: undefined,
        updateTime: undefined,
      },
    });

    mock.on(amplify.GetAppCommand).resolves({
      app: {
        name: this.app.name,
        appId: this.app.meta.providers.awscloudformation.AmplifyAppId,
        appArn: undefined,
        repository: undefined,
        description: undefined,
        platform: undefined,
        createTime: undefined,
        updateTime: undefined,
        environmentVariables: undefined,
        defaultDomain: undefined,
        enableBasicAuth: undefined,
        enableBranchAutoBuild: undefined,
        buildSpec:
          "version: 1\nbackend:\n  phases:\n    build:\n      commands:\n        - '# Execute Amplify CLI with the helper script'\n        - amplifyPush --simple\nfrontend:\n  phases:\n    preBuild:\n      commands:\n        - npm install\n    build:\n      commands:\n        - npm run build\n  artifacts:\n    baseDirectory: dist\n    files:\n      - '**/*'\n  cache:\n    paths:\n      - node_modules/**/*\n",
      },
    });

    return mock;
  }

  private mockCloudFormation() {
    const mock = mockClient(cloudformation.CloudFormationClient);

    mock
      .on(cloudformation.DescribeStackResourcesCommand)
      .callsFake(async (input: cloudformation.DescribeStackResourcesInput): Promise<cloudformation.DescribeStackResourcesOutput> => {
        const templatePath = this.app.templatePathForStack(input.StackName!);
        const template: any = JSONUtilities.readJson(templatePath);

        const stackResources: cloudformation.StackResource[] = [];
        for (const logicalId of Object.keys(template.Resources)) {
          const resource = template.Resources[logicalId];
          stackResources.push({
            LogicalResourceId: logicalId,
            PhysicalResourceId: `${input.StackName}/${logicalId}`,
            ResourceType: resource.Type,
            Timestamp: undefined,
            ResourceStatus: undefined,
          });
        }

        return { StackResources: stackResources };
      });

    return mock;
  }

  private mockLambda() {
    const mock = mockClient(lambda.LambdaClient);
    mock
      .on(lambda.GetFunctionCommand)
      .callsFake(async (input: lambda.GetFunctionCommandInput): Promise<lambda.GetFunctionCommandOutput> => {
        return {
          Configuration: {
            FunctionName: input.FunctionName,
            Runtime: 'nodejs22.x',
            Timeout: 25,
            MemorySize: 128,
            Environment: {
              Variables: {
                ENV: this.app.environmentName,
                REGION: 'us-east-1',
              },
            },
          },
          $metadata: {},
        };
      });
    mock.on(lambda.GetPolicyCommand).rejects(new Error('No policy'));
    return mock;
  }
}
