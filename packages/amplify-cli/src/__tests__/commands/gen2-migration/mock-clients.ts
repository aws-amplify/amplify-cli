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
import { CFN_NESTED_STACK_SEPARATOR, MigrationApp } from './migration-app';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

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

    const apiResourceName = this.app.singleResourceName('api');
    const authResourceName = this.app.singleResourceName('auth');
    const apiId = this.app.meta.api[apiResourceName].output.GraphQLAPIIdOutput;

    mock
      .on(appsync.GetGraphqlApiCommand)
      .callsFake(async (input: appsync.GetGraphqlApiCommandInput): Promise<appsync.GetGraphqlApiCommandOutput> => {
        const cliInputs = this.app.cliInputsForResource(apiResourceName, 'api');
        const additionalAuthenticationProviders: appsync.AdditionalAuthenticationProvider[] = [];

        for (const aut of cliInputs.serviceConfiguration.additionalAuthTypes ?? []) {
          switch (aut.mode) {
            case 'AMAZON_COGNITO_USER_POOLS':
              additionalAuthenticationProviders.push({
                authenticationType: aut.mode,
                userPoolConfig: {
                  awsRegion: this.app.region,
                  userPoolId: this.app.meta.auth[authResourceName].output.UserPoolId,
                },
              });
              break;
            default:
              throw new Error(`Unsupported additional auth mode: ${aut.mode}`);
          }
        }

        return {
          graphqlApi: {
            apiId: input.apiId,
            authenticationType: cliInputs.serviceConfiguration.defaultAuthType.mode,
            additionalAuthenticationProviders,
            logConfig: undefined,
          },
          $metadata: {},
        };
      });
    mock.on(appsync.ListGraphqlApisCommand).resolves({
      graphqlApis: [
        {
          apiId,
          // this is how amplify names appsync APIs
          name: `${apiResourceName}-${this.app.environmentName}`,
          tags: {
            'user:Stack': this.app.environmentName,
            'user:Application': apiResourceName,
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

    const authResourceName = this.app.singleResourceName('auth');
    const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
    mock.on(cognito.DescribeIdentityPoolCommand).resolves({
      AllowUnauthenticatedIdentities: authCliInputs.cognitoConfig.allowUnauthenticatedIdentities,
      IdentityPoolName: this.app.meta.auth[authResourceName].output.IdentityPoolName,
    });

    return mock;
  }

  private mockCognitoIdentityProvider() {
    const mock = mockClient(idp.CognitoIdentityProviderClient);
    const authResourceName = this.app.singleResourceName('auth');
    const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
    const authTemplate = this.app.templateForResource(authResourceName, 'auth');
    mock.on(idp.DescribeUserPoolCommand).resolves({
      UserPool: {
        EmailVerificationMessage: authCliInputs.cognitoConfig.emailVerificationMessage,
        EmailVerificationSubject: authCliInputs.cognitoConfig.emailVerificationSubject,
        SchemaAttributes: authTemplate.Resources.UserPool.Properties.Schema,
        UsernameAttributes: authCliInputs.cognitoConfig.requiredAttributes,
        Policies: {
          PasswordPolicy: {
            MinimumLength: authCliInputs.cognitoConfig.passwordPolicyMinLength,
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
      SoftwareTokenMfaConfiguration: { Enabled: false },
      MfaConfiguration: authCliInputs.cognitoConfig.mfaConfiguration,
    });

    mock
      .on(idp.DescribeUserPoolClientCommand)
      .callsFake(async (input: idp.DescribeUserPoolClientCommandInput): Promise<idp.DescribeUserPoolClientCommandOutput> => {
        const authResourceName = this.app.singleResourceName('auth');
        const authCliInputs = this.app.cliInputsForResource(authResourceName, 'auth');
        return {
          UserPoolClient: {
            ClientId: input.ClientId,
            RefreshTokenValidity: authCliInputs.cognitoConfig.userpoolClientRefreshTokenValidity,
            TokenValidityUnits: { RefreshToken: 'days' },
            EnableTokenRevocation: true,
            EnablePropagateAdditionalUserContextData: false,
            AuthSessionValidity: 3,
            AllowedOAuthFlowsUserPoolClient: false,
          },
          $metadata: {},
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
        // amplify names function like so: `${resourceName}-${envName}`
        const resourceName = input.FunctionName!.split('-')[0];
        const template = this.app.templateForResource(resourceName, 'function');

        return {
          Configuration: {
            FunctionName: input.FunctionName,
            Runtime: template.Resources.LambdaFunction.Properties.Runtime,
            Timeout: template.Resources.LambdaFunction.Properties.Timeout,
            MemorySize: 128,
            Environment: {
              Variables: {
                ENV: this.app.environmentName,
                REGION: this.app.region,
              },
            },
          },
          $metadata: {},
        };
      });
    return mock;
  }
}
