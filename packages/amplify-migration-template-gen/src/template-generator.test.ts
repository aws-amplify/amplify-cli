import { TemplateGenerator } from './template-generator';
import { CloudFormationClient, DescribeStackResourcesCommand, DescribeStackResourcesOutput } from '@aws-sdk/client-cloudformation';
import fs from 'node:fs/promises';

const mockCfnClientSendMock = jest.fn();
const mockGenerateGen1PreProcessTemplate = jest.fn();
const mockGenerateGen2ResourceRemovalTemplate = jest.fn();
const mockGenerateStackRefactorTemplates = jest.fn();
const mockReadMeInitialize = jest.fn();
const mockReadMeRenderStep1 = jest.fn();
const mockReadMeRenderStep2 = jest.fn();
const mockReadMeRenderStep3 = jest.fn();

const NUM_CATEGORIES_TO_REFACTOR = 2;
const GEN1_ROOT_STACK_NAME = 'amplify-gen1-dev-12345';
const GEN2_ROOT_STACK_NAME = 'amplify-gen2-test-sandbox-12345';
const ACCOUNT_ID = 'TEST_ACCOUNT_ID';
const GEN1_S3_BUCKET_LOGICAL_ID = 'S3Bucket';
const GEN2_S3_BUCKET_LOGICAL_ID = 'Gen2S3Bucket';
const MOCK_CFN_CLIENT = new CloudFormationClient();

jest.mock('node:fs/promises');
jest.mock('./migration-readme-generator', () => {
  return function () {
    return {
      initialize: mockReadMeInitialize,
      renderStep1: mockReadMeRenderStep1,
      renderStep2: mockReadMeRenderStep2,
      renderStep3: mockReadMeRenderStep3,
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

describe('TemplateGenerator', () => {
  beforeEach(() => {
    mockCfnClientSendMock.mockImplementation((command) => {
      if (command instanceof DescribeStackResourcesCommand) {
        return Promise.resolve(
          command.input.StackName === GEN1_ROOT_STACK_NAME ? mockDescribeGen1StackResources : mockDescribeGen2StackResources,
        );
      }
      return Promise.resolve({});
    });
  });

  it('should generate a template', async () => {
    const generator = new TemplateGenerator(GEN1_ROOT_STACK_NAME, GEN2_ROOT_STACK_NAME, ACCOUNT_ID, MOCK_CFN_CLIENT);
    await generator.generate();
    expect(fs.mkdir).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR + 1);
    expect(mockGenerateGen1PreProcessTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockGenerateGen2ResourceRemovalTemplate).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockGenerateStackRefactorTemplates).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockReadMeInitialize).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockReadMeRenderStep1).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockReadMeRenderStep2).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
    expect(mockReadMeRenderStep3).toBeCalledTimes(NUM_CATEGORIES_TO_REFACTOR);
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
});
