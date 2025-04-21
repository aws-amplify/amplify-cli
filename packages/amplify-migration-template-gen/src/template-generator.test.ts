import { TemplateGenerator } from './template-generator';
import CategoryTemplateGenerator from './category-template-generator';
import {
  CloudFormationClient,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  DescribeStackResourcesCommand,
  DescribeStackResourcesOutput,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
  ExecuteStackRefactorCommand,
  StackRefactorExecutionStatus,
  StackRefactorStatus,
  StackStatus,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import fs from 'node:fs/promises';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CATEGORY, CFN_AUTH_TYPE, CFN_S3_TYPE, CFN_IAM_TYPE, CFNTemplate } from './types';
import assert from 'node:assert';

jest.useFakeTimers();

const mockCfnClientSendMock = jest.fn();
const mockGenerateGen1PreProcessTemplate = jest.fn();
const mockGenerateGen2ResourceRemovalTemplate = jest.fn();
const mockGenerateStackRefactorTemplates = jest.fn();
const mockGenerateRefactorTemplates = jest.fn();
const mockReadTemplate = jest.fn();
const mockDescribeStack = jest.fn();
const mockReadMeInitialize = jest.fn();
const mockReadMeRenderStep1 = jest.fn();
const REGION = 'us-east-1';
const getStackId = (stackName: string, category: CATEGORY) => {
  // In Gen1, user pool group and auth are their own stacks. In Gen2, they are combined into 1.
  const resolvedCategory = stackName === GEN2_ROOT_STACK_NAME && category === 'auth-user-pool-group' ? 'auth' : category;
  return `arn:aws:cloudformation:${REGION}:${ACCOUNT_ID}:stack/${stackName}-${resolvedCategory}/12345`;
};

const NUM_CATEGORIES_TO_REFACTOR = 3;
const ACCOUNT_ID = 'TEST_ACCOUNT_ID';
const GEN1_ROOT_STACK_NAME = 'amplify-gen1-dev-12345';
const GEN2_ROOT_STACK_NAME = 'amplify-gen2-test-sandbox-12345';
const GEN1_AUTH_STACK_ID = getStackId(GEN1_ROOT_STACK_NAME, 'auth');
const GEN1_AUTH_USER_POOL_GROUP_STACK_ID = getStackId(GEN1_ROOT_STACK_NAME, 'auth-user-pool-group');
const GEN2_AUTH_STACK_ID = getStackId(GEN2_ROOT_STACK_NAME, 'auth');
const GEN1_STORAGE_STACK_ID = getStackId(GEN1_ROOT_STACK_NAME, 'storage');
const GEN2_STORAGE_STACK_ID = getStackId(GEN2_ROOT_STACK_NAME, 'storage');
const GEN1_S3_BUCKET_LOGICAL_ID = 'S3Bucket';
const GEN2_S3_BUCKET_LOGICAL_ID = 'Gen2S3Bucket';
const STUB_CFN_CLIENT = new CloudFormationClient();
const STUB_SSM_CLIENT = new SSMClient();
const STUB_COGNITO_IDP_CLIENT = new CognitoIdentityProviderClient();
const APP_ID = 'd123456';
const ENV_NAME = 'test';
const CDK_IDENTIFIER = '12345678';
const GEN2_AUTH_LOGICAL_ID_PREFIX = 'amplifyAuth';
const GEN2_AUTH_USER_POOL_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}Gen2UserPool${CDK_IDENTIFIER}`;
const GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}Gen2IdentityPool${CDK_IDENTIFIER}`;
const GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}UserPoolAppClient${CDK_IDENTIFIER}`;
const GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}UserPoolNativeAppClient${CDK_IDENTIFIER}`;
const GEN2_IDENTITY_POOL_ROLE_ATTACHMENT_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}IdentityPoolRoleAttachment${CDK_IDENTIFIER}`;
const GEN2_USER_POOL_GROUP_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}MyUserPoolGroup${CDK_IDENTIFIER}`;
const GEN2_USER_POOL_GROUP_NAME = 'MyUserPool';
const GEN2_USER_POOL_GROUP_ROLE_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}myUserPoolGroupRole${CDK_IDENTIFIER}`;
const GEN2_AUTH_ROLE_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}unauthenticatedUserRole${CDK_IDENTIFIER}`;
const GEN2_UNAUTH_ROLE_LOGICAL_ID = `${GEN2_AUTH_LOGICAL_ID_PREFIX}authenticatedUserRole${CDK_IDENTIFIER}`;
const STACK_CATEGORIES_TO_REFACTOR: CATEGORY[] = ['auth', 'auth-user-pool-group', 'storage'];
export const GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION = 'auth-Cognito-UserPool-Groups';
export const GEN1_AUTH_STACK_TYPE_DESCRIPTION = 'auth-Cognito';
const USER_POOL_PARAM_NAME = 'authUserPoolId';

const mockDescribeGen1StackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'auth',
      PhysicalResourceId: GEN1_AUTH_STACK_ID,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'authUserPoolGroup',
      PhysicalResourceId: GEN1_AUTH_USER_POOL_GROUP_STACK_ID,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'storage',
      PhysicalResourceId: GEN1_STORAGE_STACK_ID,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::S3::Bucket',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN1_S3_BUCKET_LOGICAL_ID,
      PhysicalResourceId: 'my-s3-bucket-gen1',
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::Cognito::UserPoolClient',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'UserPoolClient',
      PhysicalResourceId: 'user-pool-client-id',
      Timestamp: new Date(),
    },
  ],
};

const mockDescribeGen2StackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'auth',
      PhysicalResourceId: getStackId(GEN2_ROOT_STACK_NAME, 'auth'),
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'storage',
      PhysicalResourceId: getStackId(GEN2_ROOT_STACK_NAME, 'storage'),
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::S3::Bucket',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_S3_BUCKET_LOGICAL_ID,
      PhysicalResourceId: 'my-s3-bucket-gen2',
      Timestamp: new Date(),
    },
  ],
};

const mockDescribeGen2AuthStackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: CFN_IAM_TYPE.Role,
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_AUTH_ROLE_LOGICAL_ID,
      PhysicalResourceId: `authRole`,
      Timestamp: new Date(),
    },
    {
      ResourceType: CFN_IAM_TYPE.Role,
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_UNAUTH_ROLE_LOGICAL_ID,
      PhysicalResourceId: 'unAuthRole',
      Timestamp: new Date(),
    },
    {
      ResourceType: CFN_IAM_TYPE.Role,
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_USER_POOL_GROUP_ROLE_LOGICAL_ID,
      PhysicalResourceId: 'myGroupRole',
      Timestamp: new Date(),
    },
  ],
};

const mockDescribeGen1AuthStackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: CFN_AUTH_TYPE.UserPool,
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: `UserPool`,
      PhysicalResourceId: `userPoolId`,
      Timestamp: new Date(),
    },
  ],
};

const mockDescribeGen1AuthUserPoolGroupStackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: CFN_AUTH_TYPE.UserPoolGroup,
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_USER_POOL_GROUP_LOGICAL_ID,
      PhysicalResourceId: GEN2_USER_POOL_GROUP_NAME,
      Timestamp: new Date(),
    },
  ],
};

const mockDescribeGen2StackResourcesWithStorageMissing: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'auth',
      PhysicalResourceId: `arn:aws:cloudformation:${REGION}:${ACCOUNT_ID}:stack/${GEN2_ROOT_STACK_NAME}-auth/12345`,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::S3::Bucket',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: GEN2_S3_BUCKET_LOGICAL_ID,
      PhysicalResourceId: 'my-s3-bucket-gen2',
      Timestamp: new Date(),
    },
  ],
};

jest.mock('@aws-sdk/client-cloudformation', () => {
  return {
    ...jest.requireActual('@aws-sdk/client-cloudformation'),
    CloudFormationClient: function () {
      return {
        config: {
          region: () => REGION,
        },
        send: mockCfnClientSendMock,
      };
    },
  };
});

jest.mock('node:fs/promises');
jest.mock('./migration-readme-generator', () => {
  return function () {
    return {
      initialize: mockReadMeInitialize,
      renderStep1: mockReadMeRenderStep1,
    };
  };
});
const stubReadTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: 'AWSTemplateFormatVersion',
  Description: 'Gen2 template',
  Parameters: {
    [USER_POOL_PARAM_NAME]: {
      Type: 'String',
      Description: 'Cognito User Pool ID',
    },
  },
  Resources: {
    [GEN2_AUTH_USER_POOL_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPool,
      Properties: {
        UserPoolName: { 'Fn::Join': ['-', 'my-user-pool', 'dev'] },
        UserPoolId: { Ref: 'authUserPoolId' },
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
    [GEN2_IDENTITY_POOL_ROLE_ATTACHMENT_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
      Properties: {
        IdentityPoolId: { Ref: GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID },
        Roles: {
          authenticated: { 'Fn::GetAtt': [GEN2_AUTH_ROLE_LOGICAL_ID, 'Arn'] },
          unauthenticated: { 'Fn::GetAtt': [GEN2_UNAUTH_ROLE_LOGICAL_ID, 'Arn'] },
        },
      },
    },
    [GEN2_USER_POOL_GROUP_LOGICAL_ID]: {
      Type: CFN_AUTH_TYPE.UserPoolGroup,
      Properties: {
        GroupName: GEN2_USER_POOL_GROUP_NAME,
        RoleArn: {
          'Fn::GetAtt': [GEN2_USER_POOL_GROUP_ROLE_LOGICAL_ID, 'Arn'],
        },
      },
    },
    [GEN2_S3_BUCKET_LOGICAL_ID]: {
      Properties: {
        BucketName: 'S3BucketName',
      },
      Type: CFN_S3_TYPE.Bucket,
    },
  },
  Outputs: {
    [GEN2_AUTH_USER_POOL_LOGICAL_ID]: {
      Value: { Ref: GEN2_AUTH_USER_POOL_LOGICAL_ID },
    },
    [GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID]: {
      Value: { Ref: GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID]: {
      Value: { Ref: GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID },
    },
    [GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID]: {
      Value: { Ref: GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID },
    },
  },
};
const stubCategoryTemplateGenerator = {
  generateGen1PreProcessTemplate: mockGenerateGen1PreProcessTemplate.mockReturnValue({
    oldTemplate: {},
    newTemplate: {},
    parameters: [],
  }),
  generateGen2ResourceRemovalTemplate: mockGenerateGen2ResourceRemovalTemplate.mockReturnValue({
    oldTemplate: {},
    newTemplate: {},
    parameters: [],
  }),
  generateStackRefactorTemplates: mockGenerateStackRefactorTemplates.mockReturnValue({
    sourceTemplate: {},
    destinationTemplate: {},
    logicalIdMapping: new Map([['ResourceA', 'ResourceB']]),
  }),
  generateRefactorTemplates: mockGenerateRefactorTemplates.mockReturnValue({
    sourceTemplate: {},
    destinationTemplate: {},
    logicalIdMapping: new Map([['ResourceA', 'ResourceB']]),
  }),
  readTemplate: mockReadTemplate.mockReturnValue(stubReadTemplate),
  describeStack: mockDescribeStack.mockReturnValue({
    Outputs: [
      {
        OutputKey: GEN2_AUTH_USER_POOL_LOGICAL_ID,
        OutputValue: 'user-pool-id',
      },
      {
        OutputKey: GEN2_AUTH_IDENTITY_POOL_LOGICAL_ID,
        OutputValue: 'identity-pool-id',
      },
      {
        OutputKey: GEN2_AUTH_USER_POOL_CLIENT_WEB_LOGICAL_ID,
        OutputValue: 'web-client-id',
      },
      {
        OutputKey: GEN2_AUTH_USER_POOL_CLIENT_NATIVE_LOGICAL_ID,
        OutputValue: 'native-client-id',
      },
    ],
    Parameters: [
      {
        ParameterKey: USER_POOL_PARAM_NAME,
        ParameterValue: 'user-pool-id',
      },
    ],
  }),
};
jest.mock('./category-template-generator', () => {
  return jest.fn().mockImplementation(() => {
    return stubCategoryTemplateGenerator;
  });
});

const describeStackResourcesResponse = (stackName: string | undefined) => {
  assert(stackName);
  switch (stackName) {
    case GEN1_ROOT_STACK_NAME:
      return Promise.resolve(mockDescribeGen1StackResources);
    case GEN2_ROOT_STACK_NAME:
      return Promise.resolve(mockDescribeGen2StackResources);
    case GEN1_AUTH_STACK_ID:
      return Promise.resolve(mockDescribeGen1AuthStackResources);
    case GEN2_AUTH_STACK_ID:
      return Promise.resolve(mockDescribeGen2AuthStackResources);
    case GEN1_AUTH_USER_POOL_GROUP_STACK_ID:
      return Promise.resolve(mockDescribeGen1AuthUserPoolGroupStackResources);
    default:
      throw new Error(`Unexpected stack: ${stackName}`);
  }
};

const describeStacksResponse = (stackName: string | undefined, stackStatus: StackStatus = 'UPDATE_COMPLETE') => {
  assert(stackName);
  const defaultResponse: DescribeStacksCommandOutput = {
    Stacks: [
      {
        StackStatus: stackStatus,
        StackName: stackName,
        CreationTime: new Date(),
      },
    ],
    $metadata: {},
  };
  assert(defaultResponse.Stacks?.[0]);
  switch (stackName) {
    case GEN1_AUTH_STACK_ID: {
      defaultResponse.Stacks[0].Description = JSON.stringify({
        stackType: GEN1_AUTH_STACK_TYPE_DESCRIPTION,
      });
      return Promise.resolve(defaultResponse);
    }
    case GEN1_AUTH_USER_POOL_GROUP_STACK_ID:
      defaultResponse.Stacks[0].Description = JSON.stringify({
        stackType: GEN1_USER_POOL_GROUPS_STACK_TYPE_DESCRIPTION,
      });
      return Promise.resolve(defaultResponse);
    default:
      return Promise.resolve(defaultResponse);
  }
};

describe('TemplateGenerator', () => {
  beforeEach(() => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      }
      if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      }
      if (command instanceof DescribeStackRefactorCommand) {
        return Promise.resolve({
          Status: StackRefactorStatus.CREATE_COMPLETE,
          ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE,
        });
      }
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should refactor resources from Gen1 to Gen2 successfully', async () => {
    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate();

    // Assert
    successfulTemplateGenerationAssertions();
    assertCFNCalls();
  });

  it('should refactor resources from Gen1 to Gen2 successfully, skipping categories that have already been refactored previously', async () => {
    mockGenerateGen1PreProcessTemplate.mockImplementationOnce(() => {
      throw new Error('No resources to move in Gen1 stack');
    });
    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate();

    // Assert
    successfulTemplateGenerationAssertions(1);
    assertCFNCalls(false, ['auth']);
  });

  it('should refactor custom resources from Gen1 to Gen2 successfully', async () => {
    // Arrange
    const customResourceMap = [
      {
        Source: { LogicalResourceId: 'CustomResource1', StackName: GEN1_ROOT_STACK_NAME },
        Destination: { LogicalResourceId: 'CustomResource1', StackName: GEN2_ROOT_STACK_NAME },
      },
    ];
    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate(customResourceMap);

    // Assert
    successfulCustomResourcesAssertions();
    assertCFNCalls();
  });

  it('should fail to generate when no applicable categories are found', async () => {
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    const failureSendMock = (command: any) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME
            ? mockDescribeGen1StackResources
            : mockDescribeGen2StackResourcesWithStorageMissing,
        );
      }
      return Promise.resolve({});
    };
    mockCfnClientSendMock.mockImplementationOnce(failureSendMock).mockImplementationOnce(failureSendMock);
    await expect(() => generator.generate()).rejects.toEqual(
      new Error('No corresponding category found in destination stack for storage category'),
    );
  });

  it('should throw exception when update stack fails', async () => {
    // Arrange
    const errorMessage = 'Malformed template';
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        throw new Error(errorMessage);
      }
      return Promise.resolve({});
    });

    // Act + Assert
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await expect(generator.generate()).rejects.toThrow(errorMessage);
  });

  it('should skip update if already updated', async () => {
    // Arrange
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        throw new Error('No updates are to be performed');
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      } else if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      } else if (command instanceof DescribeStackRefactorCommand) {
        return Promise.resolve({
          Status: StackRefactorStatus.CREATE_COMPLETE,
          ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE,
        });
      }
      return Promise.resolve({});
    });

    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate();

    // Assert
    successfulTemplateGenerationAssertions();
    assertCFNCalls(true);
  });

  it('should fail after all poll attempts have exhausted during update stack', async () => {
    // Arrange
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName, 'UPDATE_IN_PROGRESS');
      }
      return Promise.resolve({});
    });

    // Act + Assert
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    expect.assertions(1);
    // Intentionally not awaiting the below call to be able to advance timers and micro task queue in waitForPromisesAndFakeTimers
    // and catch the error below
    generator.generate().catch((e) => {
      expect(e.message).toBe(
        `Stack ${getStackId(GEN1_ROOT_STACK_NAME, 'auth')} did not reach a completion state within the given time period.`,
      );
    });
    await waitForPromisesAndFakeTimers();
    return;
  });

  it('should rollback gen2 stack when create stack refactor fails', async () => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      } else if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      } else if (command instanceof DescribeStackRefactorCommand) {
        return Promise.resolve({
          Status: StackRefactorStatus.CREATE_FAILED,
          StatusReason: 'Update operations not permitted in refactor',
        });
      }
      return Promise.resolve({});
    });

    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate();
    const numCFNOperationsBeforeGen2StackUpdate = 5;
    assertRollbackRefactor('auth', numCFNOperationsBeforeGen2StackUpdate + 1, true);
    expect(mockReadMeRenderStep1).not.toHaveBeenCalled();
  });

  it('should rollback gen2 stack when execute stack refactor fails', async () => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      } else if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      } else if (command instanceof DescribeStackRefactorCommand) {
        return Promise.resolve({
          Status: StackRefactorStatus.CREATE_COMPLETE,
          ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_FAILED,
          StatusReason: 'Update operations not permitted in refactor',
        });
      }
      return Promise.resolve({});
    });

    // Act
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.generate();
    const numCFNOperationsBeforeGen2StackUpdate = 5;
    assertRollbackRefactor('auth', numCFNOperationsBeforeGen2StackUpdate + 1, false, true);
    expect(mockReadMeRenderStep1).not.toHaveBeenCalled();
  });

  it('should fail after all poll attempts have exhausted during create stack refactor', async () => {
    // Arrange
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return describeStackResourcesResponse(command.input.StackName);
      } else if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      } else if (command instanceof DescribeStacksCommand) {
        return describeStacksResponse(command.input.StackName);
      } else if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      } else if (command instanceof DescribeStackRefactorCommand) {
        return Promise.resolve({
          Status: StackRefactorStatus.CREATE_IN_PROGRESS,
        });
      }
      return Promise.resolve({});
    });

    // Act + Assert
    const generator = new TemplateGenerator(
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    expect.assertions(2);
    // Intentionally not awaiting the below call to be able to advance timers and micro task queue in waitForPromisesAndFakeTimers
    // and catch the error below
    generator.generate().catch((e) => {
      expect(e.message).toBe(`Stack refactor 12345 did not reach a completion state within the given time period.`);
      expect(mockReadMeRenderStep1).not.toHaveBeenCalled();
    });
    await waitForPromisesAndFakeTimers();
    return;
  });

  it('should revert resources from Gen2 to Gen1 successfully', async () => {
    // Act
    const generator = new TemplateGenerator(
      GEN2_ROOT_STACK_NAME,
      GEN1_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.revert();

    // Assert
    successfulRevertAssertions();
    // 2 describe stack resources call for each root stack (Gen1, Gen2)
    // 2 describe stacks call for Gen 1 auth related stacks (auth, user pool groups)
    // 1 describe stack resources call for Gen2 auth stack to get physical ids for auth roles
    let callIndex = assertStackRefactorCommands('auth', 5, false, false, true);
    // 1 describe stack resources call for Gen2 auth stack to get physical ids for user group roles
    callIndex = assertStackRefactorCommands('auth-user-pool-group', callIndex + 2, false, false, true);
    assertStackRefactorCommands('storage', callIndex + 1, false, false, true);
  });

  it('should revert resources from Gen2 to Gen1 successfully, skipping categories that have already been updated previously', async () => {
    const clonedStubGetTemplate = JSON.parse(JSON.stringify(stubReadTemplate));
    delete clonedStubGetTemplate.Resources[GEN2_S3_BUCKET_LOGICAL_ID];
    mockReadTemplate.mockReturnValue(clonedStubGetTemplate);
    // Act
    const generator = new TemplateGenerator(
      GEN2_ROOT_STACK_NAME,
      GEN1_ROOT_STACK_NAME,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
    );
    await generator.revert();

    // Assert
    successfulRevertAssertions(1);
    // 2 describe stack resources call for each root stack (Gen1, Gen2)
    // 2 describe stacks call for Gen 1 auth related stacks (auth, user pool groups)
    // 1 describe stack resources call for Gen2 auth stack to get physical ids for auth roles
    const callIndex = assertStackRefactorCommands('auth', 5, false, false, true);
    assertStackRefactorCommands('auth-user-pool-group', callIndex + 2, false, false, true);
  });

  function successfulTemplateGenerationAssertions(numCategoriesToSkipUpdate = 0) {
    expect(fs.mkdir).toBeCalledTimes(1);
    expect(mockGenerateGen1PreProcessTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockGenerateGen2ResourceRemovalTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR - numCategoriesToSkipUpdate);
    expect(mockGenerateStackRefactorTemplates).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR - numCategoriesToSkipUpdate);
    expect(mockReadMeInitialize).toBeCalledTimes(1);
    expect(mockReadMeRenderStep1).toBeCalledTimes(1);
    expect(CategoryTemplateGenerator).toBeCalledTimes(3);
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      1,
      GEN1_AUTH_STACK_ID,
      GEN2_AUTH_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [
        CFN_AUTH_TYPE.UserPool,
        CFN_AUTH_TYPE.UserPoolClient,
        CFN_AUTH_TYPE.IdentityPool,
        CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
        CFN_AUTH_TYPE.UserPoolDomain,
      ],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      2,
      GEN1_AUTH_USER_POOL_GROUP_STACK_ID,
      GEN2_AUTH_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_AUTH_TYPE.UserPoolGroup],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      3,
      GEN1_STORAGE_STACK_ID,
      GEN2_STORAGE_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_S3_TYPE.Bucket],
      undefined,
    );
  }

  function successfulRevertAssertions(numCategoriesToSkipUpdate = 0) {
    expect(fs.mkdir).not.toBeCalled();
    expect(mockGenerateGen1PreProcessTemplate).not.toBeCalled();
    expect(mockGenerateGen2ResourceRemovalTemplate).not.toBeCalled();
    expect(mockGenerateRefactorTemplates).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR - numCategoriesToSkipUpdate);
    expect(mockReadMeInitialize).not.toBeCalled();
    expect(mockReadMeRenderStep1).not.toBeCalled();
    expect(CategoryTemplateGenerator).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      1,
      GEN2_AUTH_STACK_ID,
      GEN1_AUTH_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [
        CFN_AUTH_TYPE.UserPool,
        CFN_AUTH_TYPE.UserPoolClient,
        CFN_AUTH_TYPE.IdentityPool,
        CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
        CFN_AUTH_TYPE.UserPoolDomain,
      ],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      2,
      GEN2_AUTH_STACK_ID,
      GEN1_AUTH_USER_POOL_GROUP_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_AUTH_TYPE.UserPoolGroup],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      3,
      GEN2_STORAGE_STACK_ID,
      GEN1_STORAGE_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_S3_TYPE.Bucket],
      undefined,
    );
  }

  function successfulCustomResourcesAssertions() {
    expect(fs.mkdir).toBeCalledTimes(1);
    expect(mockGenerateGen1PreProcessTemplate).toBeCalledTimes(4);
    expect(mockGenerateGen2ResourceRemovalTemplate).toBeCalledTimes(4);
    expect(mockGenerateStackRefactorTemplates).toBeCalledTimes(3);
    expect(mockReadMeInitialize).toBeCalledTimes(1);
    expect(mockReadMeRenderStep1).toBeCalledTimes(1);
    expect(CategoryTemplateGenerator).toBeCalledTimes(4);
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      1,
      GEN1_AUTH_STACK_ID,
      GEN2_AUTH_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [
        CFN_AUTH_TYPE.UserPool,
        CFN_AUTH_TYPE.UserPoolClient,
        CFN_AUTH_TYPE.IdentityPool,
        CFN_AUTH_TYPE.IdentityPoolRoleAttachment,
        CFN_AUTH_TYPE.UserPoolDomain,
      ],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      2,
      GEN1_AUTH_USER_POOL_GROUP_STACK_ID,
      GEN2_AUTH_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_AUTH_TYPE.UserPoolGroup],
      undefined,
    );
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      3,
      GEN1_STORAGE_STACK_ID,
      GEN2_STORAGE_STACK_ID,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [CFN_S3_TYPE.Bucket],
      undefined,
    );
    // custom resource category
    expect(CategoryTemplateGenerator).toHaveBeenNthCalledWith(
      4,
      GEN1_ROOT_STACK_NAME,
      GEN2_ROOT_STACK_NAME,
      REGION,
      ACCOUNT_ID,
      STUB_CFN_CLIENT,
      STUB_SSM_CLIENT,
      STUB_COGNITO_IDP_CLIENT,
      APP_ID,
      ENV_NAME,
      [],
      expect.any(Function),
    );
  }

  function assertCFNCalls(skipUpdate = false, categoriesToSkipUpdate: CATEGORY[] = []) {
    let callIndex = 0;
    expect(mockCfnClientSendMock.mock.calls[callIndex++]).toBeACloudFormationCommand(
      {
        StackName: GEN1_ROOT_STACK_NAME,
      },
      DescribeStackResourcesCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[callIndex++]).toBeACloudFormationCommand(
      {
        StackName: GEN2_ROOT_STACK_NAME,
      },
      DescribeStackResourcesCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[callIndex++]).toBeACloudFormationCommand(
      {
        StackName: GEN1_AUTH_STACK_ID,
      },
      DescribeStacksCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[callIndex++]).toBeACloudFormationCommand(
      {
        StackName: GEN1_AUTH_USER_POOL_GROUP_STACK_ID,
      },
      DescribeStacksCommand,
    );

    let updateStackCallIndex = callIndex;
    for (const category of STACK_CATEGORIES_TO_REFACTOR) {
      if (categoriesToSkipUpdate.includes(category)) {
        continue;
      }
      updateStackCallIndex = assertUpdateCFNCallsWithCategory(category, updateStackCallIndex, skipUpdate);
      updateStackCallIndex++;
    }
  }

  function assertUpdateCFNCallsWithCategory(category: CATEGORY, updateStackCallIndex: number, skipUpdate: boolean) {
    const updateStackCallIndexInterval = skipUpdate ? 1 : 2;
    expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN1_ROOT_STACK_NAME, category),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: [],
        TemplateBody: JSON.stringify({}),
        Tags: [],
      },
      UpdateStackCommand,
    );
    if (!skipUpdate) {
      expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex + 1]).toBeACloudFormationCommand(
        {
          StackName: getStackId(GEN1_ROOT_STACK_NAME, category),
        },
        DescribeStacksCommand,
      );
    }
    updateStackCallIndex += updateStackCallIndexInterval;
    expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: [],
        TemplateBody: JSON.stringify({}),
        Tags: [],
      },
      UpdateStackCommand,
    );
    if (!skipUpdate) {
      expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex + 1]).toBeACloudFormationCommand(
        {
          StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
        },
        DescribeStacksCommand,
      );
    }
    return assertStackRefactorCommands(category, updateStackCallIndex + (skipUpdate ? 1 : 2));
  }

  function assertStackRefactorCommands(
    category: CATEGORY,
    callIndex: number,
    onCreateRefactorFailed = false,
    onExecuteRefactorFailed = false,
    isRevert = false,
  ) {
    const sourceStackName = isRevert ? getStackId(GEN2_ROOT_STACK_NAME, category) : getStackId(GEN1_ROOT_STACK_NAME, category);
    const destinationStackName = isRevert ? getStackId(GEN1_ROOT_STACK_NAME, category) : getStackId(GEN2_ROOT_STACK_NAME, category);
    expect(mockCfnClientSendMock.mock.calls[callIndex]).toBeACloudFormationCommand(
      {
        ResourceMappings: [
          {
            Source: {
              LogicalResourceId: 'ResourceA',
              StackName: sourceStackName,
            },
            Destination: {
              LogicalResourceId: 'ResourceB',
              StackName: destinationStackName,
            },
          },
        ],
        StackDefinitions: [
          {
            TemplateBody: `{}`,
            StackName: sourceStackName,
          },
          {
            TemplateBody: `{}`,
            StackName: destinationStackName,
          },
        ],
      },
      CreateStackRefactorCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
      {
        StackRefactorId: '12345',
      },
      DescribeStackRefactorCommand,
    );
    if (!onCreateRefactorFailed) {
      expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
        {
          StackRefactorId: '12345',
        },
        ExecuteStackRefactorCommand,
      );
      expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
        {
          StackRefactorId: '12345',
        },
        DescribeStackRefactorCommand,
      );
      if (!onExecuteRefactorFailed) {
        expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
          {
            StackName: sourceStackName,
          },
          DescribeStacksCommand,
        );
        expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
          {
            StackName: destinationStackName,
          },
          DescribeStacksCommand,
        );
      }
    }
    return callIndex;
  }

  function assertRollbackRefactor(category: CATEGORY, callIndex: number, onCreateRefactorFailed = false, onExecuteRefactorFailed = false) {
    expect(mockCfnClientSendMock.mock.calls[callIndex]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: [],
        TemplateBody: JSON.stringify({}),
        Tags: [],
      },
      UpdateStackCommand,
    );
    callIndex = assertStackRefactorCommands(category, callIndex + 2, onCreateRefactorFailed, onExecuteRefactorFailed);
    expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
      },
      DescribeStacksCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[++callIndex]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
        Capabilities: ['CAPABILITY_NAMED_IAM'],
        Parameters: [],
        TemplateBody: JSON.stringify({}),
        Tags: [],
      },
      UpdateStackCommand,
    );
  }

  const waitForPromisesAndFakeTimers = async () => {
    do {
      jest.runAllTimers();
      await new Promise(jest.requireActual('timers').setImmediate);
    } while (jest.getTimerCount() > 0);
  };
});
