import CategoryTemplateGenerator from './category-template-generator';
import { CFN_AUTH_TYPE, CFN_PSEUDO_PARAMETERS_REF, CFN_S3_TYPE, CFNTemplate } from './types';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DescribeStacksOutput,
  GetTemplateCommand,
  GetTemplateOutput,
  Parameter,
} from '@aws-sdk/client-cloudformation';
import { GetParameterCommand, GetParameterCommandOutput, SSMClient } from '@aws-sdk/client-ssm';
import {
  CognitoIdentityProviderClient,
  DescribeIdentityProviderCommand,
  DescribeIdentityProviderResponse,
} from '@aws-sdk/client-cognito-identity-provider';

// We use 'stub' to indicate fake implementation. If we are asserting a fake, it becomes a 'mock'.
// Ref: https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices#lets-speak-the-same-language
const stubCfnClientSend = jest.fn();
const stubSsmClientSend = jest.fn();
const stubCognitoClientSend = jest.fn();

const GEN1_STORAGE_CATEGORY_STACK_NAME = 'amplify-testauth-dev-12345-storage-ABCDE';
const GEN1_CATEGORY_STACK_ID = `arn:aws:cloudformation:us-east-1:1234567890:stack/${GEN1_STORAGE_CATEGORY_STACK_NAME}/12345`;
const GEN2_CATEGORY_STACK_ID = 'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-mygen2app-test-sandbox-12345-storage-ABCDE/12345';
const GEN1_AUTH_CATEGORY_STACK_NAME = 'amplify-testauth-dev-12345-auth-ABCDE';
const GEN1_AUTH_CATEGORY_STACK_ID = `arn:aws:cloudformation:us-east-1:1234567890:stack/${GEN1_AUTH_CATEGORY_STACK_NAME}/12345`;
const GEN2_AUTH_CATEGORY_STACK_ID =
  'arn:aws:cloudformation:us-east-1:1234567890:stack/amplify-mygen2app-test-sandbox-12345-auth-ABCDE/12345';
const GEN1_S3_BUCKET_LOGICAL_ID = 'S3Bucket';
const GEN2_S3_BUCKET_LOGICAL_ID = 'Gen2S3Bucket';
const GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID = 'MyOtherS3Bucket';
const GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID = 'MyOtherGen2S3Bucket';
const MOCK_APP_ID = 'd123456';
const ENV_NAME = 'test';
const GEN1_AUTH_USER_POOL_LOGICAL_ID = 'UserPool';
const GEN1_AUTH_IDENTITY_POOL_LOGICAL_ID = 'IdentityPool';
const GEN1_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID = 'UserPoolClient';
const GEN1_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID = 'UserPoolClientWeb';
const GEN2_AUTH_USER_POOL_LOGICAL_ID = 'Gen2UserPool';
const GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID = 'Gen2IdentityPool';
const GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID = 'UserPoolAppClient';
const GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID = 'UserPoolNativeAppClient';

const oldGen1Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
    hostedUIProviderMeta: {
      Type: 'String',
      Description: 'HostedUIProviderMeta',
    },
    hostedUIProviderCreds: {
      Type: 'String',
      Description: 'HostedUIProviderCreds',
      NoEcho: true,
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: { Ref: GEN1_S3_BUCKET_LOGICAL_ID },
    },
    UserPoolId: {
      Description: 'User pool id',
      Value: 'userPoolId',
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', { Ref: 'Environment' }, { Ref: CFN_PSEUDO_PARAMETERS_REF.StackName }]] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: { 'Fn::GetAtt': [GEN1_S3_BUCKET_LOGICAL_ID, 'Arn'] },
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN1_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const newGen1Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
    hostedUIProviderMeta: {
      Type: 'String',
      Description: 'HostedUIProviderMeta',
    },
    hostedUIProviderCreds: {
      Type: 'String',
      Description: 'HostedUIProviderCreds',
      NoEcho: true,
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
    UserPoolId: {
      Description: 'User pool id',
      Value: 'userPoolId',
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev', GEN1_STORAGE_CATEGORY_STACK_NAME]] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN1_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const newGen1TemplateWithPredicate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
    hostedUIProviderMeta: {
      Type: 'String',
      Description: 'HostedUIProviderMeta',
    },
    hostedUIProviderCreds: {
      Type: 'String',
      Description: 'HostedUIProviderCreds',
      NoEcho: true,
    },
  },
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
    UserPoolId: {
      Description: 'User pool id',
      Value: 'userPoolId',
    },
  },
  Resources: {
    [GEN1_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev', GEN1_STORAGE_CATEGORY_STACK_NAME]] },
      },
    },
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [],
    },
  },
};

const oldGen2Template = {
  ...oldGen1Template,
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: { Ref: GEN2_S3_BUCKET_LOGICAL_ID },
    },
  },
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: { 'Fn::GetAtt': [GEN2_S3_BUCKET_LOGICAL_ID, 'Arn'] },
            },
          ],
        },
      },
    },
    [GEN2_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', { Ref: 'Environment' }]] },
      },
    },
    [GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket-2',
      },
      DependsOn: [GEN2_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const newGen2Template: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: oldGen2Template.Parameters,
  Outputs: {
    BucketNameOutputRef: {
      Description: 'Bucket name',
      Value: 'my-test-bucket-dev',
    },
  },
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
  },
};

const gen1Params: Parameter[] = [
  {
    ParameterKey: 'Environment',
    ParameterValue: 'dev',
  },
  {
    ParameterKey: 'hostedUIProviderMeta',
    ParameterValue: JSON.stringify([
      {
        ProviderName: 'Facebook',
      },
      {
        ProviderName: 'SignInWithApple',
      },
    ]),
  },
  {
    ParameterKey: 'hostedUIProviderCreds',
    ParameterValue: JSON.stringify([
      {
        ProviderName: 'Facebook',
        client_id: 'fbClientId',
        client_secret: 'fbClientSecret',
      },
      {
        ProviderName: 'SignInWithApple',
        teamId: 'appleTeamId',
        keyId: 'appleKeyId',
        privateKey: 'applePrivateKey',
        clientId: 'appleClientId',
      },
    ]),
  },
];

const refactoredGen1Template: CFNTemplate = {
  ...newGen1Template,
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
  },
};

const refactoredGen2Template: CFNTemplate = {
  ...newGen2Template,
  Resources: {
    MyS3BucketPolicy: {
      Type: 'AWS::IAM::Policy',
      Properties: {
        PolicyName: 'MyS3BucketPolicy',
        PolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Action: 's3:GetObject',
              Resource: 'arn:aws:s3:::my-test-bucket-dev',
            },
          ],
        },
      },
    },
    [GEN2_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: { 'Fn::Join': ['-', ['my-test-bucket', 'dev', GEN1_STORAGE_CATEGORY_STACK_NAME]] },
      },
    },
    [GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID]: {
      Type: CFN_S3_TYPE.Bucket,
      Properties: {
        BucketName: 'my-other-s3-bucket',
      },
      DependsOn: [GEN2_S3_BUCKET_LOGICAL_ID],
    },
  },
};

const oldGen1TemplateWithoutS3Bucket = JSON.parse(JSON.stringify(oldGen1Template)) as CFNTemplate;
delete oldGen1TemplateWithoutS3Bucket.Resources[GEN1_S3_BUCKET_LOGICAL_ID];
delete oldGen1TemplateWithoutS3Bucket.Resources[GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID];

const oldGen2TemplateWithoutS3Bucket = JSON.parse(JSON.stringify(oldGen2Template)) as CFNTemplate;
delete oldGen2TemplateWithoutS3Bucket.Resources[GEN2_S3_BUCKET_LOGICAL_ID];
delete oldGen2TemplateWithoutS3Bucket.Resources[GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID];

const oldGen1AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Parameters: {
    Environment: {
      Type: 'String',
      Description: 'Environment',
    },
    hostedUIProviderMeta: {
      Type: 'String',
      Description: 'HostedUIProviderMeta',
    },
    hostedUIProviderCreds: {
      Type: 'String',
      Description: 'HostedUIProviderCreds',
      NoEcho: true,
    },
  },
  Outputs: {
    UserPoolId: {
      Description: 'User pool id',
      Value: 'userPoolId',
    },
  },
  Resources: {
    [GEN1_AUTH_USER_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPool,
      Properties: {
        UserPoolName: { 'Fn::Join': ['-', 'my-user-pool', { Ref: 'Environment' }] },
      },
    },
    [GEN1_AUTH_IDENTITY_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.IdentityPool,
      Properties: {
        IdentityPoolName: { 'Fn::Join': ['-', 'my-identity-pool', { Ref: 'Environment' }] },
      },
    },
    [GEN1_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'WebClient',
      },
    },
    [GEN1_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'NativeClient',
      },
    },
    DummyResource: {
      Type: 'AWS::CloudFormation::WaitConditionHandle',
      Properties: {},
    },
  },
};

const oldGen2AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'Test template',
  Outputs: {
    UserPoolId: {
      Description: 'User pool id',
      Value: 'userPoolId',
    },
  },
  Resources: {
    [GEN2_AUTH_USER_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPool,
      Properties: {
        UserPoolName: 'my-gen2-user-pool',
      },
    },
    [GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.IdentityPool,
      Properties: {
        IdentityPoolName: 'my-gen2-identity-pool',
      },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'Gen2WebClient',
      },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'Gen2NativeClient',
      },
    },
    AuthRole: {
      Type: 'AWS::IAM::Role',
      Properties: {},
    },
  },
};

const newGen1AuthTemplate: CFNTemplate = {
  ...oldGen1AuthTemplate,
  Resources: {
    [GEN1_AUTH_USER_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPool,
      Properties: {
        UserPoolName: 'my-user-pool-dev',
      },
    },
    [GEN1_AUTH_IDENTITY_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.IdentityPool,
      Properties: {
        IdentityPoolName: 'my-identity-pool-dev',
      },
    },
    [GEN1_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'WebClient',
      },
    },
    [GEN1_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'NativeClient',
      },
    },
  },
};

const newGen2AuthTemplate: CFNTemplate = {
  ...oldGen2AuthTemplate,
  Resources: {
    AuthRole: {
      Type: 'AWS::IAM::Role',
      Properties: {},
    },
  },
};

const refactoredGen1AuthTemplate: CFNTemplate = {
  ...newGen1AuthTemplate,
  Resources: {
    DummyResource: {
      Type: 'AWS::CloudFormation::WaitConditionHandle',
      Properties: {},
    },
  },
};

const refactoredGen2AuthTemplate: CFNTemplate = {
  ...newGen2AuthTemplate,
  Resources: {
    ...oldGen2AuthTemplate.Resources,
    [GEN2_AUTH_USER_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPool,
      Properties: {
        UserPoolName: { 'Fn::Join': ['-', 'my-user-pool', 'dev'] },
      },
    },
    [GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.IdentityPool,
      Properties: {
        IdentityPoolName: { 'Fn::Join': ['-', 'my-identity-pool', 'dev'] },
      },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'WebClient',
      },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolClient,
      Properties: {
        ClientName: 'NativeClient',
      },
    },
  },
};

const generateDescribeStacksResponse = (command: DescribeStacksCommand): DescribeStacksOutput => ({
  Stacks: [
    {
      StackId: command.input.StackName,
      StackName: command.input.StackName,
      Capabilities: ['CAPABILITY_NAMED_IAM'],
      Tags: [
        {
          Key: 'amplify:category-stack',
          Value: GEN1_AUTH_CATEGORY_STACK_NAME,
        },
      ],
      CreationTime: new Date(),
      LastUpdatedTime: new Date(),
      StackStatus: 'CREATE_COMPLETE',
      Parameters: gen1Params,
      Outputs: [
        {
          OutputKey: 'BucketNameOutputRef',
          OutputValue: 'my-test-bucket-dev',
          Description: 'My bucket',
        },
        {
          OutputKey: 'UserPoolId',
          OutputValue: 'userPoolId',
          Description: 'My user pool',
        },
      ],
    },
  ],
});

const generateGetTemplateResponse = (command: GetTemplateCommand): GetTemplateOutput => {
  const stackName = command.input.StackName;
  let templateBody;
  switch (stackName) {
    case GEN1_CATEGORY_STACK_ID: {
      templateBody = JSON.stringify(oldGen1Template);
      break;
    }
    case GEN2_CATEGORY_STACK_ID: {
      templateBody = JSON.stringify(oldGen2Template);
      break;
    }
    case GEN1_AUTH_CATEGORY_STACK_ID: {
      templateBody = JSON.stringify(oldGen1AuthTemplate);
      break;
    }
    case GEN2_AUTH_CATEGORY_STACK_ID: {
      templateBody = JSON.stringify(oldGen2AuthTemplate);
      break;
    }
    default:
      throw new Error(`Unknown stack name: ${stackName}`);
  }
  return {
    TemplateBody: templateBody,
  };
};

const generateDescribeIdentityProviderResponse = ({ input }: DescribeIdentityProviderCommand): DescribeIdentityProviderResponse => ({
  IdentityProvider: {
    ProviderName: input.ProviderName,
    ProviderDetails: {
      client_id: 'client_id',
      client_secret: 'client_secret',
      team_id: input.ProviderName === 'SignInWithApple' ? 'team_id' : '',
      key_id: input.ProviderName === 'SignInWithApple' ? 'key_id' : '',
    },
    UserPoolId: input.UserPoolId,
  },
});

const generateGetParameterResponse = (command: GetParameterCommand): GetParameterCommandOutput => ({
  Parameter: {
    Name: command.input.Name,
    Value: 'private_key',
  },
  $metadata: {},
});

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cloudformation'),
    CloudFormationClient: function () {
      return {
        send: stubCfnClientSend.mockImplementation((command) => {
          if (command instanceof DescribeStacksCommand) {
            return Promise.resolve(generateDescribeStacksResponse(command));
          } else if (command instanceof GetTemplateCommand) {
            return Promise.resolve(generateGetTemplateResponse(command));
          } else if (command instanceof DescribeStackResourcesCommand) {
            return Promise.resolve({
              StackResources: [
                {
                  StackId: command.input.StackName,
                  StackName: command.input.StackName,
                  LogicalResourceId: GEN1_S3_BUCKET_LOGICAL_ID,
                  PhysicalResourceId: GEN1_S3_BUCKET_LOGICAL_ID,
                  ResourceType: CFN_S3_TYPE.Bucket,
                  ResourceStatus: 'CREATE_COMPLETE',
                  Timestamp: new Date(),
                },
              ],
            });
          }
          return Promise.resolve({});
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-cognito-identity-provider', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cognito-identity-provider'),
    CognitoIdentityProviderClient: function () {
      return {
        send: stubCognitoClientSend.mockImplementation((command) => {
          if (command instanceof DescribeIdentityProviderCommand) {
            return Promise.resolve(generateDescribeIdentityProviderResponse(command));
          }
          return Promise.resolve({});
        }),
      };
    },
  };
});

jest.mock('@aws-sdk/client-ssm', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-ssm'),
    SSMClient: function () {
      return {
        send: stubSsmClientSend.mockImplementation((command) => {
          if (command instanceof GetParameterCommand) {
            return Promise.resolve(generateGetParameterResponse(command));
          }
          return Promise.resolve({});
        }),
      };
    },
  };
});

describe('CategoryTemplateGenerator', () => {
  const s3TemplateGenerator = new CategoryTemplateGenerator(
    GEN1_CATEGORY_STACK_ID,
    GEN2_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    new SSMClient(),
    new CognitoIdentityProviderClient(),
    MOCK_APP_ID,
    ENV_NAME,
    [CFN_S3_TYPE.Bucket],
  );

  const s3TemplateGeneratorWithPredicate = new CategoryTemplateGenerator(
    GEN1_CATEGORY_STACK_ID,
    GEN2_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    new SSMClient(),
    new CognitoIdentityProviderClient(),
    MOCK_APP_ID,
    ENV_NAME,
    [CFN_S3_TYPE.Bucket],
    // decide which resources to move based on resource properties
    (resourcesToMove, resourceEntry) => resourcesToMove.includes(CFN_S3_TYPE.Bucket) && resourceEntry[0] === GEN1_S3_BUCKET_LOGICAL_ID,
  );

  const noGen1ResourcesToMoveS3TemplateGenerator = new CategoryTemplateGenerator(
    GEN1_CATEGORY_STACK_ID,
    GEN2_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    new SSMClient(),
    new CognitoIdentityProviderClient(),
    MOCK_APP_ID,
    ENV_NAME,
    [CFN_S3_TYPE.Bucket],
  );

  const authTemplateGenerator = new CategoryTemplateGenerator(
    GEN1_AUTH_CATEGORY_STACK_ID,
    GEN2_AUTH_CATEGORY_STACK_ID,
    'us-east-1',
    '12345',
    new CloudFormationClient(),
    new SSMClient(),
    new CognitoIdentityProviderClient(),
    MOCK_APP_ID,
    ENV_NAME,
    [CFN_AUTH_TYPE.UserPoolClient, CFN_AUTH_TYPE.UserPool, CFN_AUTH_TYPE.IdentityPool, CFN_AUTH_TYPE.UserPoolDomain],
  );

  it('should preprocess gen1 template prior to refactor', async () => {
    await expect(s3TemplateGenerator.generateGen1PreProcessTemplate()).resolves.toEqual({
      oldTemplate: oldGen1Template,
      newTemplate: newGen1Template,
      parameters: gen1Params,
    });
  });

  it('should preprocess gen1 template with predicate prior to refactor', async () => {
    await expect(s3TemplateGeneratorWithPredicate.generateGen1PreProcessTemplate()).resolves.toEqual({
      oldTemplate: oldGen1Template,
      newTemplate: newGen1TemplateWithPredicate,
      parameters: gen1Params,
    });
  });

  it('should remove gen2 resources from gen2 stack prior to refactor', async () => {
    await expect(s3TemplateGenerator.generateGen2ResourceRemovalTemplate()).resolves.toEqual({
      oldTemplate: oldGen2Template,
      newTemplate: newGen2Template,
      parameters: gen1Params,
    });
  });

  it('should refactor gen1 resources into gen2 stack', async () => {
    const { newTemplate: newGen1Template } = await s3TemplateGenerator.generateGen1PreProcessTemplate();
    const { newTemplate: newGen2Template } = await s3TemplateGenerator.generateGen2ResourceRemovalTemplate();
    const { sourceTemplate, destinationTemplate, logicalIdMapping } = s3TemplateGenerator.generateStackRefactorTemplates(
      newGen1Template,
      newGen2Template,
    );
    expect(sourceTemplate).toEqual<CFNTemplate>(refactoredGen1Template);
    expect(destinationTemplate).toEqual<CFNTemplate>(refactoredGen2Template);
    expect(logicalIdMapping).toEqual(
      new Map<string, string>([
        [GEN1_S3_BUCKET_LOGICAL_ID, GEN2_S3_BUCKET_LOGICAL_ID],
        [GEN1_ANOTHER_S3_BUCKET_LOGICAL_ID, GEN2_ANOTHER_S3_BUCKET_LOGICAL_ID],
      ]),
    );
  });

  it('should refactor auth gen1 resources into gen2 stack', async () => {
    const { newTemplate: newGen1Template } = await authTemplateGenerator.generateGen1PreProcessTemplate();
    const { newTemplate: newGen2Template } = await authTemplateGenerator.generateGen2ResourceRemovalTemplate();
    const { sourceTemplate, destinationTemplate, logicalIdMapping } = authTemplateGenerator.generateStackRefactorTemplates(
      newGen1Template,
      newGen2Template,
    );
    expect(sourceTemplate).toEqual<CFNTemplate>(refactoredGen1AuthTemplate);
    expect(destinationTemplate).toEqual<CFNTemplate>(refactoredGen2AuthTemplate);
    expect(logicalIdMapping).toEqual(
      new Map<string, string>([
        [GEN1_AUTH_USER_POOL_LOGICAL_ID, GEN2_AUTH_USER_POOL_LOGICAL_ID],
        [GEN1_AUTH_IDENTITY_POOL_LOGICAL_ID, GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID],
        [GEN1_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID, GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID],
        [GEN1_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID, GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID],
      ]),
    );
  });

  it('should throw error when there are no resources to move in Gen1 stack', async () => {
    const sendFailureMock = (command: any) => {
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve(generateDescribeStacksResponse(command));
      } else if (command instanceof GetTemplateCommand) {
        return Promise.resolve({
          TemplateBody:
            command.input.StackName === GEN1_CATEGORY_STACK_ID
              ? JSON.stringify(oldGen1TemplateWithoutS3Bucket)
              : JSON.stringify(oldGen2Template),
        });
      }
      return Promise.resolve({});
    };
    stubCfnClientSend.mockImplementationOnce(sendFailureMock).mockImplementationOnce(sendFailureMock);
    await expect(noGen1ResourcesToMoveS3TemplateGenerator.generateGen1PreProcessTemplate()).rejects.toThrowError(
      'No resources to move in Gen1 stack.',
    );
  });

  it('should throw error when there are no resources to move in Gen2 stack', async () => {
    const sendFailureMock = (command: any) => {
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve(generateDescribeStacksResponse(command));
      } else if (command instanceof GetTemplateCommand) {
        return Promise.resolve({
          TemplateBody:
            command.input.StackName === GEN1_CATEGORY_STACK_ID
              ? JSON.stringify(oldGen1Template)
              : JSON.stringify(oldGen2TemplateWithoutS3Bucket),
        });
      } else if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve({
          StackResources: [
            {
              StackId: command.input.StackName,
              StackName: command.input.StackName,
              LogicalResourceId: GEN1_S3_BUCKET_LOGICAL_ID,
              PhysicalResourceId: GEN1_S3_BUCKET_LOGICAL_ID,
              ResourceType: CFN_S3_TYPE.Bucket,
              ResourceStatus: 'CREATE_COMPLETE',
              Timestamp: new Date(),
            },
          ],
        });
      }
      return Promise.resolve({});
    };
    stubCfnClientSend
      .mockImplementationOnce(sendFailureMock)
      .mockImplementationOnce(sendFailureMock)
      .mockImplementationOnce(sendFailureMock)
      .mockImplementationOnce(sendFailureMock)
      .mockImplementationOnce(sendFailureMock);
    await noGen1ResourcesToMoveS3TemplateGenerator.generateGen1PreProcessTemplate();
    await expect(noGen1ResourcesToMoveS3TemplateGenerator.generateGen2ResourceRemovalTemplate()).rejects.toThrowError(
      'No resources to remove in Gen2 stack.',
    );
  });
});
