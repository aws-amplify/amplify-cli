import CFNConditionResolver from './cfn-condition-resolver';
import { CFNTemplate } from '../types';

describe('CFNConditionResolver', () => {
  const template: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'CFN template with conditions',
    Conditions: {
      MyCond: {
        'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'],
      },
      MyNotCond: {
        'Fn::Not': [{ Condition: 'MyCond' }],
      },
      MyOrCondition: {
        'Fn::Or': [{ 'Fn::Equals': ['prod', { Ref: 'EnvType' }] }, { Condition: 'MyCond' }],
      },
      MyAndCondition: {
        'Fn::And': [{ 'Fn::Equals': ['prod', { Ref: 'EnvType' }] }, { Condition: 'MyCond' }],
      },
    },
    Resources: {
      MyIfConditionResource: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: {
            'Fn::If': ['MyCond', 'my-bucket-prod', 'my-bucket-dev'],
          },
        },
      },
      MyOrConditionResource: {
        Type: 'AWS::S3::Bucket',
        Condition: 'MyOrCondition',
        Properties: {
          BucketName: 'my-bucket-prod1',
        },
      },
      MyAndConditionResource: {
        Type: 'AWS::S3::Bucket',
        Condition: 'MyAndCondition',
        Properties: {
          BucketName: 'my-bucket-prod2',
        },
      },
      MyNotConditionResource: {
        Type: 'AWS::S3::Bucket',
        Condition: 'MyNotCond',
        Properties: {
          BucketName: 'my-bucket-prod3',
        },
      },
    },
    Parameters: {
      EnvType: {
        Type: 'String',
        Default: 'dev',
      },
    },
    Outputs: {
      BucketName: {
        Value: { Ref: 'MyResource' },
        Description: 'Name of the S3 bucket',
      },
    },
  };
  const expectedResolvedTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'CFN template with conditions',
    Conditions: {
      MyCond: {
        'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'],
      },
      MyNotCond: {
        'Fn::Not': [{ Condition: 'MyCond' }],
      },
      MyOrCondition: {
        'Fn::Or': [{ 'Fn::Equals': ['prod', { Ref: 'EnvType' }] }, { Condition: 'MyCond' }],
      },
      MyAndCondition: {
        'Fn::And': [{ 'Fn::Equals': ['prod', { Ref: 'EnvType' }] }, { Condition: 'MyCond' }],
      },
    },
    Resources: {
      MyIfConditionResource: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'my-bucket-prod',
        },
      },
      MyOrConditionResource: {
        Type: 'AWS::S3::Bucket',
        Condition: 'MyOrCondition',
        Properties: {
          BucketName: 'my-bucket-prod1',
        },
      },
      MyAndConditionResource: {
        Type: 'AWS::S3::Bucket',
        Condition: 'MyAndCondition',
        Properties: {
          BucketName: 'my-bucket-prod2',
        },
      },
    },
    Parameters: {
      EnvType: {
        Type: 'String',
        Default: 'dev',
      },
    },
    Outputs: {
      BucketName: {
        Value: { Ref: 'MyResource' },
        Description: 'Name of the S3 bucket',
      },
    },
  };
  it('should resolve the conditions in the template', () => {
    const resolvedTemplate = new CFNConditionResolver(template).resolve([
      {
        ParameterKey: 'EnvType',
        ParameterValue: 'prod',
      },
    ]);
    expect(resolvedTemplate).toEqual(expectedResolvedTemplate);
  });
});
