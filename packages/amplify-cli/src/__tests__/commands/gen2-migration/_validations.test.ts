import { AmplifyGen2MigrationValidations } from '../../../commands/gen2-migration/_validations';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CloudFormation } from 'aws-sdk';

describe('AmplifyGen2MigrationValidations', () => {
  let mockContext: $TSContext;
  let validations: AmplifyGen2MigrationValidations;

  beforeEach(() => {
    mockContext = {} as $TSContext;
    validations = new AmplifyGen2MigrationValidations(mockContext);
  });

  describe('validateStatefulResources', () => {
    it('should pass when no changes exist', async () => {
      const changeSet: CloudFormation.DescribeChangeSetOutput = {};
      await expect(validations.validateStatefulResources(changeSet)).resolves.not.toThrow();
    });

    it('should pass when changes exist but no stateful resources are removed', async () => {
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
      const changeSet: CloudFormation.DescribeChangeSetOutput = {
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
  });
});
