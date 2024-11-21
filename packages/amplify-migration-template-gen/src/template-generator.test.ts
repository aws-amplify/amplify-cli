import { TemplateGenerator } from './template-generator';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStackResourcesOutput,
  DescribeStacksCommand,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import fs from 'node:fs/promises';

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
const MOCK_CFN_CLIENT = new CloudFormationClient();

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
        logicalIdMapping: {},
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
      return Promise.resolve({});
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a template', async () => {
    // Act
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
    await generator.generate();

    // Assert
    successfulTemplateGenerationAssertions();
    assertCFNCalls();
  });

  it('should fail to generate when no applicable categories are found', async () => {
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
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
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
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
      return Promise.resolve({});
    });

    // Act
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
    await generator.generate();

    // Assert
    successfulTemplateGenerationAssertions();
    assertCFNCalls(true);
  });

  it('should fail after all poll attempts have exhausted', async () => {
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
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
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
});

function successfulTemplateGenerationAssertions() {
  expect(fs.mkdir).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR + 1);
  expect(mockGenerateGen1PreProcessTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockGenerateGen2ResourceRemovalTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockGenerateStackRefactorTemplates).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockReadMeInitialize).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockReadMeRenderStep1).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
  expect(mockReadMeRenderStep2).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
}

function assertCFNCalls(skipUpdate = false) {
  expect(mockCfnClientSendMock.mock.calls[0]).toBeACloudFormationCommand(
    {
      StackName: GEN1_ROOT_STACK_NAME,
    },
    DescribeStackResourcesCommand,
  );
  expect(mockCfnClientSendMock.mock.calls[1]).toBeACloudFormationCommand(
    {
      StackName: GEN2_ROOT_STACK_NAME,
    },
    DescribeStackResourcesCommand,
  );

  // If updates are skipped, there are no describe stack calls
  if (!skipUpdate) {
    expect(mockCfnClientSendMock.mock.calls[3]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN1_ROOT_STACK_NAME, 'auth'),
      },
      DescribeStacksCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[5]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, 'auth'),
      },
      DescribeStacksCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[7]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN1_ROOT_STACK_NAME, 'storage'),
      },
      DescribeStacksCommand,
    );
    expect(mockCfnClientSendMock.mock.calls[9]).toBeACloudFormationCommand(
      {
        StackName: getStackId(GEN2_ROOT_STACK_NAME, 'storage'),
      },
      DescribeStacksCommand,
    );
  }

  let updateStackCallIndex = 2;
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

  updateStackCallIndex += updateStackCallIndexInterval;
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
}

const waitForPromisesAndFakeTimers = async () => {
  do {
    jest.runAllTimers();
    await new Promise(jest.requireActual('timers').setImmediate);
  } while (jest.getTimerCount() > 0);
};

const getStackId = (stackName: string, category: 'auth' | 'storage') =>
  `arn:aws:cloudformation:us-east-1:${ACCOUNT_ID}:stack/${stackName}-${category}/12345`;
