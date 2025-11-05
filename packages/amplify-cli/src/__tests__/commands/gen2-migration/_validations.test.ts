import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_validations';
import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, DescribeChangeSetOutput } from '@aws-sdk/client-cloudformation';

jest.mock('@aws-sdk/client-cloudformation');
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getMeta: jest.fn(),
  },
}));

describe('AmplifyGen2MigrationValidations', () => {
  let mockContext: $TSContext;
  let validations: AmplifyGen2MigrationValidations;

  beforeEach(() => {
    mockContext = {} as $TSContext;
    validations = new AmplifyGen2MigrationValidations(mockContext);
  });

  describe('validateStatefulResources', () => {
    it('should pass when no changes exist', async () => {
      const changeSet: DescribeChangeSetOutput = {};
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should pass when changes exist but no stateful resources are removed', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'MyBucket',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should throw when stateful resource is removed', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'MyTable',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: 'Stateful resources scheduled for deletion: MyTable (AWS::DynamoDB::Table).',
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    });

    it('should throw when stateful resources are removed', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'Bucket1',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::Cognito::UserPool',
              LogicalResourceId: 'UserPool1',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: 'Stateful resources scheduled for deletion: Bucket1 (AWS::S3::Bucket), UserPool1 (AWS::Cognito::UserPool).',
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    });

    it('should pass when non-stateful resource is removed', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::Lambda::Function',
              LogicalResourceId: 'MyFunction',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should pass with realistic changeset containing mixed add and remove operations on stateless resources', async () => {
      const changeSet: DescribeChangeSetOutput = {
        StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/MyStack/1a2345b6-0000-00a0-a123-00abc0abc000',
        Status: 'CREATE_COMPLETE',
        ChangeSetName: 'SampleChangeSet-addremove',
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::AutoScaling::AutoScalingGroup',
              LogicalResourceId: 'AutoScalingGroup',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::AutoScaling::LaunchConfiguration',
              LogicalResourceId: 'LaunchConfig',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::EC2::Instance',
              PhysicalResourceId: 'i-1abc23d4',
              LogicalResourceId: 'MyEC2Instance',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should throw with realistic changeset containing remove operations on stateful resources', async () => {
      const changeSet: DescribeChangeSetOutput = {
        StackId: 'arn:aws:cloudformation:us-east-1:123456789012:stack/MyStack/1a2345b6-0000-00a0-a123-00abc0abc000',
        Status: 'CREATE_COMPLETE',
        ChangeSetName: 'SampleChangeSet-removeVolume',
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::AutoScaling::AutoScalingGroup',
              LogicalResourceId: 'AutoScalingGroup',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::AutoScaling::LaunchConfiguration',
              LogicalResourceId: 'LaunchConfig',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::EC2::Volume',
              PhysicalResourceId: 'vol-1abc23d4',
              LogicalResourceId: 'MyEBSVolume',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: 'Stateful resources scheduled for deletion: MyEBSVolume (AWS::EC2::Volume).',
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    });

    it('should throw when removing three stateful resources', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::RDS::DBInstance',
              LogicalResourceId: 'Database',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'UsersTable',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::Kinesis::Stream',
              LogicalResourceId: 'EventStream',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message:
          'Stateful resources scheduled for deletion: Database (AWS::RDS::DBInstance), UsersTable (AWS::DynamoDB::Table), EventStream (AWS::Kinesis::Stream).',
        resolution: 'Review the migration plan and ensure data is backed up before proceeding.',
      });
    });

    it('should pass with remove operations on stateless and add on stateful', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'NewBucket',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'NewTable',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::Lambda::Function',
              LogicalResourceId: 'OldFunction',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::EC2::Instance',
              LogicalResourceId: 'OldInstance',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should pass when modifying stateful resources', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'MyTable',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should pass with mixed modify and add operations on stateful resources', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'ExistingBucket',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Add',
              ResourceType: 'AWS::RDS::DBInstance',
              LogicalResourceId: 'NewDatabase',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should throw when removing stateful resource with mixed modify operations', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Modify',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'ModifiedTable',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::S3::Bucket',
              LogicalResourceId: 'DeletedBucket',
            },
          },
        ],
      };
      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: 'Stateful resources scheduled for deletion: DeletedBucket (AWS::S3::Bucket).',
      });
    });
  });

  describe('validateStatefulResources - nested stacks', () => {
    let mockSend: jest.Mock;

    beforeEach(() => {
      mockSend = jest.fn();
      (CloudFormationClient as jest.Mock).mockImplementation(() => ({
        send: mockSend,
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw when nested stack contains stateful resources', async () => {
      mockSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::DynamoDB::Table',
            PhysicalResourceId: 'MyTable',
            LogicalResourceId: 'Table',
          },
        ],
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'AuthStack',
              PhysicalResourceId: 'auth-stack',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message:
          'Stateful resources scheduled for deletion: AuthStack (AWS::CloudFormation::Stack) containing: Table (AWS::DynamoDB::Table).',
      });
    });

    it('should pass when nested stack contains only stateless resources', async () => {
      mockSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::Lambda::Function',
            PhysicalResourceId: 'MyFunction',
            LogicalResourceId: 'Function',
          },
        ],
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'LambdaStack',
              PhysicalResourceId: 'lambda-stack',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should handle multiple levels of nested stacks', async () => {
      mockSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::CloudFormation::Stack',
            PhysicalResourceId: 'storage-nested-stack',
            LogicalResourceId: 'StorageNestedStack',
          },
        ],
      });

      mockSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::S3::Bucket',
            PhysicalResourceId: 'my-bucket',
            LogicalResourceId: 'Bucket',
          },
        ],
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'StorageStack',
              PhysicalResourceId: 'storage-stack',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
      });
    });

    it('should pass when nested stack is missing PhysicalResourceId', async () => {
      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'IncompleteStack',
              PhysicalResourceId: undefined,
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should handle mixed direct and nested stateful resources', async () => {
      mockSend.mockResolvedValueOnce({
        StackResources: [
          {
            ResourceType: 'AWS::Cognito::UserPool',
            PhysicalResourceId: 'user-pool',
            LogicalResourceId: 'UserPool',
          },
        ],
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::DynamoDB::Table',
              LogicalResourceId: 'DirectTable',
            },
          },
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::CloudFormation::Stack',
              LogicalResourceId: 'AuthStack',
              PhysicalResourceId: 'auth-stack',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: expect.stringContaining('DirectTable'),
      });
    });
  });

  describe('validateDeploymentStatus', () => {
    let mockSend: jest.Mock;

    beforeEach(() => {
      mockSend = jest.fn();
      (CloudFormationClient as jest.Mock).mockImplementation(() => ({
        send: mockSend,
      }));
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw StackNotFoundError when stackName is missing', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {},
        },
      });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackNotFoundError',
        message: 'Root stack not found',
        resolution: 'Ensure the project is initialized and deployed.',
      });
    });

    it('should throw StackNotFoundError when stack not found in CloudFormation', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({ Stacks: [] });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackNotFoundError',
        message: 'Stack test-stack not found in CloudFormation',
        resolution: 'Ensure the project is deployed.',
      });
    });

    it('should pass when stack status is UPDATE_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'UPDATE_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).resolves.not.toThrow();
    });

    it('should pass when stack status is CREATE_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'CREATE_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).resolves.not.toThrow();
    });

    it('should throw StackStateError when status is UPDATE_IN_PROGRESS', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'UPDATE_IN_PROGRESS' }],
      });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackStateError',
        message: 'Root stack status is UPDATE_IN_PROGRESS, expected UPDATE_COMPLETE or CREATE_COMPLETE',
        resolution: 'Complete the deployment before proceeding.',
      });
    });

    it('should throw StackStateError when status is ROLLBACK_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getMeta').mockReturnValue({
        providers: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({
        Stacks: [{ StackStatus: 'ROLLBACK_COMPLETE' }],
      });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackStateError',
        message: 'Root stack status is ROLLBACK_COMPLETE, expected UPDATE_COMPLETE or CREATE_COMPLETE',
        resolution: 'Complete the deployment before proceeding.',
      });
    });
  });
});
