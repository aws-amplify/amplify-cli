import CfnDependencyResolver from '../../../../../commands/gen2-migration/refactor/resolvers/cfn-dependency-resolver';
import { CFNTemplate } from '../../../../../commands/gen2-migration/refactor/types';

describe('CFNDependencyResolver', () => {
  const template: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Test template',
    Parameters: {
      BucketName: {
        Type: 'String',
        Description: 'Bucket name',
      },
    },
    Outputs: {
      BucketName: {
        Description: 'Bucket name',
        Value: { Ref: 'BucketName' },
      },
    },
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {},
      },
      Topic: {
        Type: 'AWS::S3::Topic',
        Properties: {
          DisplayName: 'MyTopic',
        },
        DependsOn: ['MyBucket'],
      },
      MyUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'MyUserPool',
        },
        DependsOn: ['MyBucket', 'Topic'],
      },
    },
  };
  const expectedTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Test template',
    Parameters: {
      BucketName: {
        Type: 'String',
        Description: 'Bucket name',
      },
    },
    Outputs: {
      BucketName: {
        Description: 'Bucket name',
        Value: { Ref: 'BucketName' },
      },
    },
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {},
      },
      Topic: {
        Type: 'AWS::S3::Topic',
        Properties: {
          DisplayName: 'MyTopic',
        },
        DependsOn: [],
      },
      MyUserPool: {
        Type: 'AWS::Cognito::UserPool',
        Properties: {
          UserPoolName: 'MyUserPool',
        },
        DependsOn: ['MyBucket'],
      },
    },
  };
  it('should resolve dependencies', () => {
    const dependencies = new CfnDependencyResolver(template).resolve(['MyBucket', 'MyUserPool']);
    expect(dependencies).toEqual(expectedTemplate);
  });
});
