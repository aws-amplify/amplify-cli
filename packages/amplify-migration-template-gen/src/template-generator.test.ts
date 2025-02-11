import { TemplateGenerator } from './template-generator';
import {
  CloudFormationClient,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  DescribeStackResourcesCommand,
  DescribeStackResourcesOutput,
  DescribeStacksCommand,
  ExecuteStackRefactorCommand,
  StackRefactorExecutionStatus,
  StackRefactorStatus,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import fs from 'node:fs/promises';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CATEGORY } from './types';

jest.useFakeTimers();

const mockCfnClientSendMock = jest.fn();
const mockGenerateGen1PreProcessTemplate = jest.fn();
const mockGenerateGen2ResourceRemovalTemplate = jest.fn();
const mockGenerateStackRefactorTemplates = jest.fn();
const mockReadMeInitialize = jest.fn();
const mockReadMeRenderStep1 = jest.fn();
const mockReadMeRenderStep2 = jest.fn();
const mockReadMeRenderStep3 = jest.fn();
const mockReadMeRenderStep4 = jest.fn();

const NUM_CATEGORIES_TO_REFACTOR = 2;
const GEN1_ROOT_STACK_NAME = 'amplify-gen1-dev-12345';
const GEN2_ROOT_STACK_NAME = 'amplify-gen2-test-sandbox-12345';
const ACCOUNT_ID = 'TEST_ACCOUNT_ID';
const GEN1_S3_BUCKET_LOGICAL_ID = 'S3Bucket';
const GEN2_S3_BUCKET_LOGICAL_ID = 'Gen2S3Bucket';
const STUB_CFN_CLIENT = new CloudFormationClient();
const STUB_SSM_CLIENT = new SSMClient();
const STUB_COGNITO_IDP_CLIENT = new CognitoIdentityProviderClient();
const APP_ID = 'd123456';
const ENV_NAME = 'test';

const mockDescribeGen1StackResources: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'auth',
      PhysicalResourceId: `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${GEN1_ROOT_STACK_NAME}-auth/12345`,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'storage',
      PhysicalResourceId: `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${GEN1_ROOT_STACK_NAME}-storage/12345`,
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
      PhysicalResourceId: `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${GEN2_ROOT_STACK_NAME}-auth/12345`,
      Timestamp: new Date(),
    },
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'storage',
      PhysicalResourceId: `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${GEN2_ROOT_STACK_NAME}-storage/12345`,
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

const mockDescribeGen2StackResourcesWithStorageMissing: DescribeStackResourcesOutput = {
  StackResources: [
    {
      ResourceType: 'AWS::CloudFormation::Stack',
      ResourceStatus: 'CREATE_COMPLETE',
      LogicalResourceId: 'auth',
      PhysicalResourceId: `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${GEN2_ROOT_STACK_NAME}-auth/12345`,
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
          region: () => 'us-east-1',
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
      renderStep2: mockReadMeRenderStep2,
      renderStep3: mockReadMeRenderStep3,
      renderStep4: mockReadMeRenderStep4,
    };
  };
});
jest.mock('./category-template-generator', () => {
  return function () {
    return {
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
    };
  };
});

describe('TemplateGenerator', () => {
  beforeEach(() => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
        });
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

  it('should generate a template', async () => {
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
    await expect(() => generator.generate()).rejects.toEqual(new Error('No corresponding category found in Gen2 for storage category'));
  });

  it('should throw exception when update stack fails', async () => {
    // Arrange
    const errorMessage = 'Malformed template';
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
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
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        throw new Error('No updates are to be performed');
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
        });
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
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_IN_PROGRESS' }],
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
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
        });
      }
      if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      }
      if (command instanceof DescribeStackRefactorCommand) {
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
    const numCFNOperationsBeforeGen2StackUpdate = 4;
    assertRollbackRefactor('auth', numCFNOperationsBeforeGen2StackUpdate + 1, true);
    expect(mockReadMeRenderStep2).not.toHaveBeenCalled();
  });

  it('should rollback gen2 stack when execute stack refactor fails', async () => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
        });
      }
      if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      }
      if (command instanceof DescribeStackRefactorCommand) {
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
    const numCFNOperationsBeforeGen2StackUpdate = 4;
    assertRollbackRefactor('auth', numCFNOperationsBeforeGen2StackUpdate + 1);
    expect(mockReadMeRenderStep2).not.toHaveBeenCalled();
  });

  it('should fail after all poll attempts have exhausted during create stack refactor', async () => {
    // Arrange
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      if (command instanceof UpdateStackCommand) {
        return Promise.resolve({});
      }
      if (command instanceof DescribeStacksCommand) {
        return Promise.resolve({
          Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
        });
      }
      if (command instanceof CreateStackRefactorCommand) {
        return Promise.resolve({
          StackRefactorId: '12345',
        });
      }
      if (command instanceof DescribeStackRefactorCommand) {
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
      expect(mockReadMeRenderStep2).not.toHaveBeenCalled();
    });
    await waitForPromisesAndFakeTimers();
    return;
  });
});

function successfulTemplateGenerationAssertions() {
  expect(fs.mkdir).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR + 1);
  expect(mockGenerateGen1PreProcessTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockGenerateGen2ResourceRemovalTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockGenerateStackRefactorTemplates).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockReadMeInitialize).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockReadMeRenderStep2).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
}

function assertCFNCalls(skipUpdate = false) {
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
      StackName: getStackId(GEN1_ROOT_STACK_NAME, 'auth'),
    },
    DescribeStackResourcesCommand,
  );

  let updateStackCallIndex = callIndex;
  const updateStackCallIndexInterval = skipUpdate ? 1 : 2;
  expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
    {
      StackName: getStackId(GEN1_ROOT_STACK_NAME, 'auth'),
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
        StackName: getStackId(GEN1_ROOT_STACK_NAME, 'auth'),
      },
      DescribeStacksCommand,
    );
  }
  updateStackCallIndex += updateStackCallIndexInterval;
  expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
    {
      StackName: getStackId(GEN2_ROOT_STACK_NAME, 'auth'),
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
        StackName: getStackId(GEN2_ROOT_STACK_NAME, 'auth'),
      },
      DescribeStacksCommand,
    );
  }
  updateStackCallIndex = assertStackRefactorCommands('auth', updateStackCallIndex + (skipUpdate ? 1 : 2));
  updateStackCallIndex++;
  expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
    {
      StackName: getStackId(GEN1_ROOT_STACK_NAME, 'storage'),
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
        StackName: getStackId(GEN1_ROOT_STACK_NAME, 'storage'),
      },
      DescribeStacksCommand,
    );
  }

  updateStackCallIndex += updateStackCallIndexInterval;
  expect(mockCfnClientSendMock.mock.calls[updateStackCallIndex]).toBeACloudFormationCommand(
    {
      StackName: getStackId(GEN2_ROOT_STACK_NAME, 'storage'),
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
        StackName: getStackId(GEN2_ROOT_STACK_NAME, 'storage'),
      },
      DescribeStacksCommand,
    );
  }
  assertStackRefactorCommands('storage', updateStackCallIndex + (skipUpdate ? 1 : 2));
}

function assertStackRefactorCommands(category: CATEGORY, callIndex: number, onCreateRefactorFailed = false) {
  expect(mockCfnClientSendMock.mock.calls[callIndex]).toBeACloudFormationCommand(
    {
      ResourceMappings: [
        {
          Source: {
            LogicalResourceId: 'ResourceA',
            StackName: getStackId(GEN1_ROOT_STACK_NAME, category),
          },
          Destination: {
            LogicalResourceId: 'ResourceB',
            StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
          },
        },
      ],
      StackDefinitions: [
        {
          TemplateBody: `{}`,
          StackName: getStackId(GEN1_ROOT_STACK_NAME, category),
        },
        {
          TemplateBody: `{}`,
          StackName: getStackId(GEN2_ROOT_STACK_NAME, category),
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
  }
  return callIndex;
}

function assertRollbackRefactor(category: CATEGORY, callIndex: number, onCreateRefactorFailed = false) {
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
  callIndex = assertStackRefactorCommands(category, callIndex + 2, onCreateRefactorFailed);
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

const getStackId = (stackName: string, category: 'auth' | 'storage') =>
  `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${stackName}-${category}/12345`;
