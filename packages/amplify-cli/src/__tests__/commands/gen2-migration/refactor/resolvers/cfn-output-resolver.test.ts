import CfnOutputResolver from '../../../../../commands/gen2-migration/refactor/resolvers/cfn-output-resolver';
import { CFNTemplate } from '../../../../../commands/gen2-migration/refactor/types';

describe('CFNOutputResolver', () => {
  const template: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Test template',
    Parameters: {
      AuthenticatedRole: {
        Type: 'String',
      },
    },
    Outputs: {
      MyS3BucketOutputRef: {
        Description: 'S3 bucket',
        Value: { Ref: 'MyS3Bucket' },
      },
      AnotherOutput: {
        Description: 'Another output',
        Value: 'another value',
      },
      MyUserPoolOutputRef: {
        Description: 'User pool',
        Value: { Ref: 'MyUserPool' },
      },
      MyUserPoolClientOutputRef: {
        Description: 'User pool',
        Value: { Ref: 'MyUserPoolClient' },
      },
      LambdaRole: {
        Description: 'Lambda execution role',
        Value: { Ref: 'TestLambdaRole' },
      },
      CreatedSNSRole: {
        Description: 'role arn',
        Value: {
          'Fn::GetAtt': ['SNSRole', 'Arn'],
        },
      },
      HostedUIDomain: {
        Description: 'HostedUIDomain',
        Value: {
          'Fn::If': [
            'ShouldNotCreateEnvResources',
            'HostedUIDomainLogicalId',
            {
              'Fn::Join': [
                '-',
                [
                  {
                    Ref: 'hostedUIDomainName',
                  },
                  {
                    Ref: 'env',
                  },
                ],
              ],
            },
          ],
        },
      },
      snsTopicArn: {
        Description: 'SnsTopicArn',
        Value: {
          Ref: 'snstopic',
        },
      },
      KinesisStreamArn: {
        Description: 'Kinesis Stream Arn',
        Value: {
          'Fn::GetAtt': ['MyKinesisStream', 'Arn'],
        },
      },
    },
    Resources: {
      MyS3Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          UpdateReplacePolicy: 'Delete',
          DeletionPolicy: 'Delete',
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
                Resource: { 'Fn::GetAtt': ['MyS3Bucket', 'Arn'] },
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
      MyUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'MyUserPool',
          SmsConfiguration: {
            ExternalId: 'testsns_role_external_id',
            SnsCallerArn: {
              'Fn::GetAtt': ['SNSRole', 'Arn'],
            },
          },
        },
      },
      HostedUICustomResourcePolicy: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyName: 'HostedUICustomResourcePolicy',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'cognito-idp:DescribeUserPool',
                Resource: { 'Fn::GetAtt': ['MyUserPool', 'Arn'] },
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
      MyUserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          ClientName: 'MyUserPoolClient',
          UserPoolId: { Ref: 'MyUserPool' },
        },
      },
      TestLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: 'TestLambda',
          Handler: 'index.handler',
          Role: { 'Fn::GetAtt': ['TestLambdaRole', 'Arn'] },
          Code: {
            ZipFile: 'exports.handler = function() {}',
          },
          Runtime: 'nodejs14.x',
        },
      },
      TestLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'TestLambdaRole',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {},
              },
            ],
          },
        },
      },
      SNSRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'cognito-idp.amazonaws.com',
                },
                Action: ['sts:AssumeRole'],
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': 'role_external_id',
                  },
                },
              },
            ],
          },
        },
      },
      sqsqueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: {
            'Fn::Join': ['', ['sqs-queue-amplifyCodegen-', 'dev']],
          },
        },
      },
      snsSubscription: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Endpoint: {
            'Fn::GetAtt': ['sqsqueue', 'Arn'],
          },
          Protocol: 'sqs',
          TopicArn: { Ref: 'snsTopic' },
        },
      },
      snsTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'snsTopic',
        },
      },
      CustomS3AutoDeleteObjectsCustomResourceProviderHandler: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: 'CustomS3AutoDeleteObjectsCustomResourceProviderHandler',
          Handler: 'index.handler',
          Code: {
            ZipFile: 'exports.handler = function() {}',
          },
          Runtime: 'nodejs14.x',
        },
      },
      CustomS3AutoDeleteObjects: {
        Type: 'Custom::S3AutoDeleteObjects',
        Properties: {
          ServiceToken: {
            'Fn::GetAtt': ['CustomS3AutoDeleteObjectsCustomResourceProviderHandler', 'Arn'],
          },
          BucketName: {
            Ref: 'MyS3Bucket',
          },
        },
      },
      MyKinesisStream: {
        Type: 'AWS::Kinesis::Stream',
        Properties: {
          Name: 'MyKinesisStream',
          ShardCount: 1,
        },
      },
      KinesisStreamPolicy: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyName: 'KinesisStreamPolicy',
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'kinesis:PutRecord',
                Resource: { 'Fn::GetAtt': ['MyKinesisStream', 'Arn'] },
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
    },
  };
  const expectedTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Test template',
    Parameters: {
      AuthenticatedRole: {
        Type: 'String',
      },
    },
    Outputs: {
      MyS3BucketOutputRef: {
        Description: 'S3 bucket',
        Value: 'test-bucket',
      },
      AnotherOutput: {
        Description: 'Another output',
        Value: 'another value',
      },
      MyUserPoolOutputRef: {
        Description: 'User pool',
        Value: 'test-userpoolid',
      },
      MyUserPoolClientOutputRef: {
        Description: 'User pool',
        Value: 'test-userpoolclientid',
      },
      LambdaRole: {
        Description: 'Lambda execution role',
        Value: 'arn:aws:iam::12345:role/lambda-exec-role',
      },
      CreatedSNSRole: {
        Description: 'role arn',
        Value: 'arn:aws:iam::12345:role/sns12345-dev',
      },
      HostedUIDomain: {
        Description: 'HostedUIDomain',
        Value: 'my-hosted-UI-domain',
      },
      snsTopicArn: {
        Description: 'SnsTopicArn',
        Value: 'arn:aws:sns:us-east-1:12345:snsTopic',
      },
      KinesisStreamArn: {
        Description: 'Kinesis Stream Arn',
        Value: 'arn:aws:kinesis:us-east-1:12345:stream/MyKinesisStream',
      },
    },
    Resources: {
      MyS3Bucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          UpdateReplacePolicy: 'Delete',
          DeletionPolicy: 'Delete',
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
                Resource: 'arn:aws:s3:::test-bucket',
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
      MyUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'MyUserPool',
          SmsConfiguration: {
            ExternalId: 'testsns_role_external_id',
            SnsCallerArn: 'arn:aws:iam::12345:role/sns12345-dev',
          },
        },
      },
      HostedUICustomResourcePolicy: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyName: 'HostedUICustomResourcePolicy',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'cognito-idp:DescribeUserPool',
                Resource: 'arn:aws:cognito-idp:us-east-1:12345:userpool/test-userpoolid',
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
      MyUserPoolClient: {
        Type: 'AWS::Cognito::UserPoolClient',
        Properties: {
          ClientName: 'MyUserPoolClient',
          UserPoolId: 'test-userpoolid',
        },
      },
      TestLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: 'TestLambda',
          Handler: 'index.handler',
          Role: 'arn:aws:iam::12345:role/lambda-exec-role',
          Code: {
            ZipFile: 'exports.handler = function() {}',
          },
          Runtime: 'nodejs14.x',
        },
      },
      TestLambdaRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'TestLambdaRole',
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {},
              },
            ],
          },
        },
      },
      SNSRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'cognito-idp.amazonaws.com',
                },
                Action: ['sts:AssumeRole'],
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': 'role_external_id',
                  },
                },
              },
            ],
          },
        },
      },
      sqsqueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: {
            'Fn::Join': ['', ['sqs-queue-amplifyCodegen-', 'dev']],
          },
        },
      },
      snsSubscription: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Endpoint: 'arn:aws:sqs:us-east-1:12345:physicalIdSqs',
          Protocol: 'sqs',
          TopicArn: { Ref: 'snsTopic' },
        },
      },
      snsTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          TopicName: 'snsTopic',
        },
      },
      CustomS3AutoDeleteObjectsCustomResourceProviderHandler: {
        Type: 'AWS::Lambda::Function',
        Properties: {
          FunctionName: 'CustomS3AutoDeleteObjectsCustomResourceProviderHandler',
          Handler: 'index.handler',
          Code: {
            ZipFile: 'exports.handler = function() {}',
          },
          Runtime: 'nodejs14.x',
        },
      },
      CustomS3AutoDeleteObjects: {
        Type: 'Custom::S3AutoDeleteObjects',
        Properties: {
          ServiceToken: 'arn:aws:lambda:us-east-1:12345:function:mycustomS3AutoDeleteObjectsLambdaFunction',
          BucketName: 'test-bucket',
        },
      },
      MyKinesisStream: {
        Type: 'AWS::Kinesis::Stream',
        Properties: {
          Name: 'MyKinesisStream',
          ShardCount: 1,
        },
      },
      KinesisStreamPolicy: {
        Type: 'AWS::IAM::Policy',
        Properties: {
          PolicyName: 'KinesisStreamPolicy',
          PolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Action: 'kinesis:PutRecord',
                Resource: 'arn:aws:kinesis:us-east-1:12345:stream/MyKinesisStream',
              },
            ],
          },
          Roles: [{ Ref: 'AuthenticatedRole' }],
        },
      },
    },
  };

  it('should resolve output references', () => {
    expect(
      new CfnOutputResolver(template, 'us-east-1', '12345').resolve(
        ['MyS3Bucket', 'MyUserPool', 'MyUserPoolClient'],
        [
          {
            OutputKey: 'MyS3BucketOutputRef',
            OutputValue: 'test-bucket',
          },
          {
            OutputKey: 'AnotherOutput',
            OutputValue: 'another value',
          },
          {
            OutputKey: 'MyUserPoolOutputRef',
            OutputValue: 'test-userpoolid',
          },
          {
            OutputKey: 'MyUserPoolClientOutputRef',
            OutputValue: 'test-userpoolclientid',
          },
          {
            OutputKey: 'LambdaRole',
            OutputValue: 'arn:aws:iam::12345:role/lambda-exec-role',
          },
          {
            OutputKey: 'CreatedSNSRole',
            OutputValue: 'arn:aws:iam::12345:role/sns12345-dev',
          },
          {
            OutputKey: 'HostedUIDomain',
            OutputValue: 'my-hosted-UI-domain',
          },
          {
            OutputKey: 'snsTopicArn',
            OutputValue: 'arn:aws:sns:us-east-1:12345:snsTopic',
          },
          {
            OutputKey: 'KinesisStreamArn',
            OutputValue: 'arn:aws:kinesis:us-east-1:12345:stream/MyKinesisStream',
          },
        ],
        [
          {
            StackName: 'amplify-amplifycodegen-dev',
            StackId: 'arn:aws:cloudformation:us-west-2:123456789:stack/amplify-amplifycodegen-dev',
            LogicalResourceId: 'sqsqueue',
            PhysicalResourceId: 'physicalIdSqs',
            ResourceType: 'AWS::SQS::Queue',
            Timestamp: new Date('2025-04-02T22:27:41.603000+00:00'),
            ResourceStatus: 'CREATE_COMPLETE',
          },
          {
            StackName: 'amplify-amplifycodegen-dev',
            StackId: 'arn:aws:cloudformation:us-west-2:123456789:stack/amplify-amplifycodegen-dev',
            LogicalResourceId: 'snsSubscription',
            PhysicalResourceId: 'physicalIdSns',
            ResourceType: 'AWS::SNS::Subscription',
            Timestamp: new Date('2025-04-02T22:27:41.603000+00:00'),
            ResourceStatus: 'CREATE_COMPLETE',
          },
          {
            StackName: 'amplify-amplifycodegen-dev',
            StackId: 'arn:aws:cloudformation:us-west-2:123456789:stack/amplify-amplifycodegen-dev',
            LogicalResourceId: 'CustomS3AutoDeleteObjectsCustomResourceProviderHandler',
            PhysicalResourceId: 'mycustomS3AutoDeleteObjectsLambdaFunction',
            ResourceType: 'AWS::Lambda::Function',
            Timestamp: new Date('2025-04-02T22:27:41.603000+00:00'),
            ResourceStatus: 'CREATE_COMPLETE',
          },
        ],
      ),
    ).toEqual(expectedTemplate);
  });
});
