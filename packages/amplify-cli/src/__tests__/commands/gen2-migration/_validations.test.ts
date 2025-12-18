import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_validations';
import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { CloudFormationClient, DescribeChangeSetOutput } from '@aws-sdk/client-cloudformation';
import { Logger } from '../../../commands/gen2-migration';

jest.mock('@aws-sdk/client-cloudformation');
jest.mock('bottleneck', () => {
  return jest.fn().mockImplementation(() => ({
    schedule: jest.fn((fn) => fn()),
  }));
});
jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...jest.requireActual('@aws-amplify/amplify-cli-core'),
  stateManager: {
    getTeamProviderInfo: jest.fn(),
  },
}));

describe('AmplifyGen2MigrationValidations', () => {
  let mockContext: $TSContext;
  let validations: AmplifyGen2MigrationValidations;

  beforeEach(() => {
    mockContext = {} as $TSContext;
    validations = new AmplifyGen2MigrationValidations(new Logger('mock', 'mock', 'mock'), 'mock', 'mock', mockContext);
  });

  describe('validateStatefulResources', () => {
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
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
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
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
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
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
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
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
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
        message: 'Decommission will delete stateful resources.',
      });
    });

    it('should throw when nested stack contains stateful resources', async () => {
      mockSend.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::DynamoDB::Table',
            PhysicalResourceId: 'MyTable',
            LogicalResourceId: 'Table',
          },
        ],
        NextToken: undefined,
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
        message: 'Decommission will delete stateful resources.',
      });
    });

    it('should pass when nested stack contains only stateless resources', async () => {
      mockSend.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::Lambda::Function',
            PhysicalResourceId: 'MyFunction',
            LogicalResourceId: 'Function',
          },
        ],
        NextToken: undefined,
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
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::CloudFormation::Stack',
            PhysicalResourceId: 'storage-nested-stack',
            LogicalResourceId: 'StorageNestedStack',
          },
        ],
        NextToken: undefined,
      });

      mockSend.mockResolvedValueOnce({
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::S3::Bucket',
            PhysicalResourceId: 'my-bucket',
            LogicalResourceId: 'Bucket',
          },
        ],
        NextToken: undefined,
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
        StackResourceSummaries: [
          {
            ResourceType: 'AWS::Cognito::UserPool',
            PhysicalResourceId: 'user-pool',
            LogicalResourceId: 'UserPool',
          },
        ],
        NextToken: undefined,
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
        message: 'Decommission will delete stateful resources.',
      });
    });

    it('should pass when deployment bucket is removed with excludeDeploymentBucket=true', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            DeploymentBucketName: 'amplify-deployment-bucket-12345',
          },
        },
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::S3::Bucket',
              PhysicalResourceId: 'amplify-deployment-bucket-12345',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet, true)).resolves.not.toThrow();
    });

    it('should throw when non-deployment S3 bucket is removed even with excludeDeploymentBucket=true', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            DeploymentBucketName: 'amplify-deployment-bucket-12345',
          },
        },
      });

      const changeSet: DescribeChangeSetOutput = {
        Changes: [
          {
            Type: 'Resource',
            ResourceChange: {
              Action: 'Remove',
              ResourceType: 'AWS::S3::Bucket',
              PhysicalResourceId: 'user-data-bucket',
            },
          },
        ],
      };

      await expect(validations.validateStatefulResources(changeSet, true)).rejects.toMatchObject({
        name: 'DestructiveMigrationError',
        message: 'Decommission will delete stateful resources.',
        resolution: 'Review the resources above and ensure data is backed up before proceeding.',
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

    it('should throw StackNotFoundError when stack not found in CloudFormation', async () => {
      mockSend.mockResolvedValue({ Stacks: [] });

      await expect(validations.validateDeploymentStatus()).rejects.toMatchObject({
        name: 'StackNotFoundError',
        message: 'Stack mock not found in CloudFormation',
        resolution: 'Ensure the project is deployed.',
      });
    });

    it('should pass when stack status is UPDATE_COMPLETE', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
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
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
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
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
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
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
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

  describe('validateLockStatus', () => {
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

    it('should throw MigrationError when stack is not locked', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      mockSend.mockResolvedValue({ StackPolicyBody: undefined });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'MigrationError',
        message: 'Stack is not locked',
        resolution: 'Run the lock command before proceeding with migration.',
      });
    });

    it('should pass when stack has correct lock policy', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const expectedPolicy = {
        Statement: [
          {
            Effect: 'Deny',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(expectedPolicy),
      });

      await expect(validations.validateLockStatus()).resolves.not.toThrow();
    });

    it('should throw MigrationError when stack policy has wrong effect', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const wrongPolicy = {
        Statement: [
          {
            Effect: 'Allow',
            Action: 'Update:*',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(wrongPolicy),
      });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'MigrationError',
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    });

    it('should throw MigrationError when stack policy has different action', async () => {
      jest.spyOn(stateManager, 'getTeamProviderInfo').mockReturnValue({
        mock: {
          awscloudformation: {
            StackName: 'test-stack',
          },
        },
      });

      const wrongPolicy = {
        Statement: [
          {
            Effect: 'Deny',
            Action: 'Update:Delete',
            Principal: '*',
            Resource: '*',
          },
        ],
      };

      mockSend.mockResolvedValue({
        StackPolicyBody: JSON.stringify(wrongPolicy),
      });

      await expect(validations.validateLockStatus()).rejects.toMatchObject({
        name: 'MigrationError',
        message: 'Stack policy does not match expected lock policy',
        resolution: 'Run the lock command to set the correct stack policy.',
      });
    });
  });
});
