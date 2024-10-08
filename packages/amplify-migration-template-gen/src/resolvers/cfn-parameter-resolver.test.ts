import CfnParameterResolver from './cfn-parameter-resolver';
import { CFNTemplate } from '../types';

describe('CFNParameterResolver', () => {
  const template: CFNTemplate = {
    Description: 'This is a test template',
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
      Env: {
        Type: 'String',
        Default: 'dev',
      },
      // comma delimited parameter
      CommaDelimited: {
        Type: 'CommaDelimitedList',
        Default: 'a,b,c',
      },
      // List<number> parameter
      NumberList: {
        Type: 'List<Number>',
        Default: '1,2,3',
      },
      // NoEcho parameter
      NoEcho: {
        Type: 'String',
        Default: 'no-echo',
        NoEcho: true,
      },
    },
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'my-bucket',
          // use parameters
          Tags: [
            { Key: 'env', Value: { Ref: 'Env' } },
            { Key: 'comma', Value: { Ref: 'CommaDelimited' } },
            { Key: 'number', Value: { Ref: 'NumberList' } },
            { Key: 'no-echo', Value: { Ref: 'NoEcho' } },
          ],
        },
      },
    },
    Outputs: {
      MyBucketName: {
        Description: 'My bucket name',
        Value: {
          Ref: 'MyBucket',
        },
      },
    },
  };

  const expectedTemplate: CFNTemplate = {
    Description: 'This is a test template',
    AWSTemplateFormatVersion: '2010-09-09',
    Parameters: {
      Env: {
        Type: 'String',
        Default: 'dev',
      },
      CommaDelimited: {
        Type: 'CommaDelimitedList',
        Default: 'a,b,c',
      },
      NumberList: {
        Type: 'List<Number>',
        Default: '1,2,3',
      },
      NoEcho: {
        Type: 'String',
        Default: 'no-echo',
        NoEcho: true,
      },
    },
    Resources: {
      MyBucket: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: 'my-bucket',
          Tags: [
            { Key: 'env', Value: 'prod' },
            { Key: 'comma', Value: ['a', 'b', 'c', 'd'] },
            { Key: 'number', Value: ['1', '2', '3', '4'] },
            { Key: 'no-echo', Value: { Ref: 'NoEcho' } },
          ],
        },
      },
    },
    Outputs: {
      MyBucketName: {
        Description: 'My bucket name',
        Value: {
          Ref: 'MyBucket',
        },
      },
    },
  };

  it('should resolve parameters in template', () => {
    const resolvedTemplate = new CfnParameterResolver(template).resolve([
      { ParameterKey: 'Env', ParameterValue: 'prod' },
      { ParameterKey: 'CommaDelimited', ParameterValue: 'a,b,c,d' },
      { ParameterKey: 'NumberList', ParameterValue: '1,2,3,4' },
      { ParameterKey: 'NoEcho', ParameterValue: 'new-no-echo' },
    ]);
    expect(resolvedTemplate).toEqual(expectedTemplate);
  });

  it('should not resolve when no parameters are present', () => {
    const resolvedTemplate = new CfnParameterResolver(template).resolve([]);
    expect(resolvedTemplate).toEqual(template);
  });
});
