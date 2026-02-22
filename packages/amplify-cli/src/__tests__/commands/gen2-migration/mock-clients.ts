import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import * as path from 'path';
import * as amplify from '@aws-sdk/client-amplify';
import * as lambda from '@aws-sdk/client-lambda';
import * as cloudformation from '@aws-sdk/client-cloudformation';
import * as idp from '@aws-sdk/client-cognito-identity-provider';
import * as cognito from '@aws-sdk/client-cognito-identity';
import * as s3 from '@aws-sdk/client-s3';
import * as appsync from '@aws-sdk/client-appsync';
import * as cwe from '@aws-sdk/client-cloudwatch-events';
import { MigrationApp } from './migration-app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

const CFN_NESTED_STACK_SEPARATOR = '/';

export class MockClients {
  public readonly amplify;
  public readonly cloudformation;
  public readonly lambda;
  public readonly cognitoIdentityProvider;
  public readonly cognitoIdentity;
  public readonly cwe;
  public readonly appsync;
  public readonly s3;

  constructor(private readonly app: MigrationApp) {
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
              awsRegion: this.app.region,
              userPoolId: this.app.meta.auth['projectboardsc8c5bcda'].output.UserPoolId,
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
        const templatePath = this.templatePathForStack(input.StackName!, this.app.ccbPath);

        const template: any = JSONUtilities.readJson(templatePath);
        const stackResources: cloudformation.StackResource[] = [];
        for (const logicalId of Object.keys(template.Resources)) {
          const resource = template.Resources[logicalId];
          stackResources.push({
            LogicalResourceId: logicalId,

            // this value will be used to determine nested stack names.
            // combining the parent stack name with the current logical id
            // gives us enough information to locate the corresponding template
            // in our local files (ccb)
            PhysicalResourceId: `${input.StackName}${CFN_NESTED_STACK_SEPARATOR}${logicalId}`,
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

  private templatePathForStack(stackName: string, ccbPath: string) {
    const parts = stackName.split(CFN_NESTED_STACK_SEPARATOR);

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
