import { createDefaultCustomPoliciesFile, generateCustomPoliciesInTemplate } from '../customPoliciesUtils';
import { printer } from 'amplify-prompts';
import { JSONUtilities } from '..';
import { pathManager, PathConstants, stateManager } from '../state-manager';
import path from 'path';
import { Template, Fn } from 'cloudform-types';

describe('Custom policies util test', () => {
  const testCategoryName = 'function';
  const testResourceName = 'functionTest';
  const expectedFilePath = path.join(
    __dirname,
    'testFiles',
    'custom-policies-test',
    testCategoryName,
    testResourceName,
    PathConstants.CustomPoliciesFilename,
  );
  jest.spyOn(pathManager, 'getCustomPoliciesPath').mockReturnValue(expectedFilePath);
  stateManager.getCustomPolicies = jest.fn();
  printer.warn = jest.fn();
  test('Write default custom policy file to the specified resource name', () => {
    createDefaultCustomPoliciesFile(testCategoryName, testResourceName);

    const data = JSONUtilities.readJson(expectedFilePath);

    expect(data).toMatchObject([
      {
        Action: [],
        Resource: [],
      },
    ]);
  });

  test('test generateCustomPoliciesInTemplate with lambda function with no effect', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: ['s3:access'],
        Resource: ['arn:aws:s3:::*'],
      },
    ]);
    const template = generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Version).toEqual('2012-10-17');
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Action).toEqual(['s3:access']);
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Resource).toEqual(['arn:aws:s3:::*']);
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Effect).toEqual('Allow');
  });

  test('test generateCustomPoliciesInTemplate with lambda function with Deny effect', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: ['s3:access'],
        Resource: ['arn:aws:s3:::*'],
        Effect: 'Deny',
      },
    ]);
    const template = generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Version).toEqual('2012-10-17');
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Action).toEqual(['s3:access']);
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Resource).toEqual(['arn:aws:s3:::*']);
    expect(template.Resources?.CustomLambdaExecutionPolicy.Properties?.PolicyDocument.Statement[0].Effect).toEqual('Deny');
  });

  test('test generateCustomPoliciesInTemplate with lambda function with Deny effect', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: ['s3:access'],
        Resource: ['arn:aws:s3:::*'],
      },
    ]);

    const apiTemplate = {
      Resources: {
        TaskDefinition: {
          Properties: {
            TaskRoleArn: {
              'Fn::GetAtt': ['mockRoleName'],
            },
          },
        },
      },
    } as unknown as Template;
    const template = generateCustomPoliciesInTemplate(apiTemplate, 'apiResourceName', 'ElasticContainer', 'api');
    expect(template.Resources?.CustomExecutionPolicyForContainer.Properties?.PolicyDocument.Version).toEqual('2012-10-17');
    expect(template.Resources?.CustomExecutionPolicyForContainer.Properties?.PolicyDocument.Statement[0].Action).toEqual(['s3:access']);
    expect(template.Resources?.CustomExecutionPolicyForContainer.Properties?.PolicyDocument.Statement[0].Resource).toEqual([
      'arn:aws:s3:::*',
    ]);
    expect(template.Resources?.CustomExecutionPolicyForContainer.Properties?.PolicyDocument.Statement[0].Effect).toEqual('Allow');
    expect(template.Resources?.CustomExecutionPolicyForContainer.Properties?.Roles).toEqual([Fn.Ref('mockRoleName')]);
  });

  test('test generateCustomPoliciesInTemplate with lambda function with bad policy', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: ['s3:access'],
        Resource: ['arbsd'],
      },
    ]);
    try {
      generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');
    } catch (ex) {
      expect(ex).toBeDefined();
      expect(ex.message).toContain('Invalid custom IAM policy for lambdaResourceName. Incorrect "Resource": arbsd');
    }
  });

  test('test generateCustomPoliciesInTemplate with lambda function with * in resource', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: ['s3:access'],
        Resource: ['*'],
      },
    ]);
    generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');
    expect(printer.warn).toBeCalledWith(
      `Warning: You've specified "*" as the "Resource" in lambdaResourceName's custom IAM policy.\n This will grant lambdaResourceName the ability to perform s3:access on ALL resources in this AWS Account.`,
    );
  });

  test('test generateCustomPoliciesInTemplate with lambda function default policy', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([
      {
        Action: [],
        Resource: [],
      },
    ]);
    const template = generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');

    expect(template.Resources?.CustomLambdaExecutionPolicy).toBeUndefined();
  });

  test('test generateCustomPoliciesInTemplate with lambda function with empty array', () => {
    (stateManager.getCustomPolicies as jest.Mock).mockReturnValueOnce([]);
    const template = generateCustomPoliciesInTemplate({}, 'lambdaResourceName', 'Lambda', 'function');

    expect(template.Resources?.CustomLambdaExecutionPolicy).toBeUndefined();
  });
});
