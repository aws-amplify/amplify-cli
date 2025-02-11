import CfnOutputResolver from './cfn-output-resolver';
import { CFNTemplate } from '../types';

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
        ],
      ),
    ).toEqual(expectedTemplate);
  });
});
