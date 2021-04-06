import { FunctionDependency } from 'amplify-function-plugin-interface';
import { consolidateDependsOnForLambda } from '../../../../provider-utils/awscloudformation/utils/consolidateDependsOn';
import { lambdaLayerSetting, resourceAccessSetting } from '../../../../provider-utils/awscloudformation/utils/constants';

test('check when lambdaLayer selected and resourceSetting present', async () => {
  const contextStub = {
    function: {
      i5732697ec2c4: {
        service: 'Lambda',
        dependsOn: [
          {
            category: 'auth',
            resourceName: 'i573239366e8a',
            attributes: ['UserPoolId'],
          },
        ],
      },
    },
  };
  const selectedSettings = [lambdaLayerSetting];
  const LambdaToUpdate = 'i5732697ec2c4';
  const currentDependsOn: FunctionDependency[] = [
    {
      category: 'function',
      resourceName: 'i5732692fb708',
      attributes: ['Arn'],
    },
    {
      category: 'function',
      resourceName: 'i5732f46becd3',
      attributes: ['Arn'],
    },
  ];
  expect(consolidateDependsOnForLambda(contextStub, currentDependsOn, LambdaToUpdate, selectedSettings)).toMatchSnapshot();
});

test('check when lambdaLayer removed and resourceSetting present', async () => {
  const contextStub = {
    function: {
      i5732692fb708: {
        service: 'LambdaLayer',
      },
      i5732f46becd3: {
        service: 'LambdaLayer',
      },
      i5732697ec2c4: {
        service: 'Lambda',
        dependsOn: [
          {
            category: 'auth',
            resourceName: 'i573239366e8a',
            attributes: ['UserPoolId'],
          },
          {
            category: 'function',
            resourceName: 'i5732692fb708',
            attributes: ['Arn'],
          },
          {
            category: 'function',
            resourceName: 'i5732f46becd3',
            attributes: ['Arn'],
          },
        ],
      },
    },
  };
  const selectedSettings = [lambdaLayerSetting];
  const LambdaToUpdate = 'i5732697ec2c4';
  const currentDependsOn: FunctionDependency[] = [
    {
      category: 'function',
      resourceName: 'i5732692fb708',
      attributes: ['Arn'],
    },
  ];
  const currentDependsOn1: FunctionDependency[] = [];
  expect(consolidateDependsOnForLambda(contextStub, currentDependsOn, LambdaToUpdate, selectedSettings)).toMatchSnapshot();
  expect(consolidateDependsOnForLambda(contextStub, currentDependsOn1, LambdaToUpdate, selectedSettings)).toMatchSnapshot();
});

test('check when lambdaLayer present and resourceSetting selected', async () => {
  const contextStub = {
    function: {
      i5732692fb708: {
        service: 'LambdaLayer',
      },
      i5732f46becd3: {
        service: 'LambdaLayer',
      },
      i5732697ec2c4: {
        service: 'Lambda',
        dependsOn: [
          {
            category: 'auth',
            resourceName: 'i573239366e8a',
            attributes: ['UserPoolId'],
          },
          {
            category: 'function',
            resourceName: 'i5732692fb708',
            attributes: ['Arn'],
          },
          {
            category: 'function',
            resourceName: 'i5732f46becd3',
            attributes: ['Arn'],
          },
        ],
      },
    },
  };
  const selectedSettings = [resourceAccessSetting];
  const LambdaToUpdate = 'i5732697ec2c4';
  const currentDependsOn: FunctionDependency[] = [
    {
      category: 'auth',
      resourceName: 'mockauth',
      attributes: ['mockUserPoolId'],
    },
    {
      category: 'api',
      resourceName: 'mockapi',
      attributes: ['mockArn'],
    },
  ];
  expect(consolidateDependsOnForLambda(contextStub, currentDependsOn, LambdaToUpdate, selectedSettings)).toMatchSnapshot();
});

test('check when lambdaLayer present and resourceSetting removed', async () => {
  const contextStub = {
    function: {
      i5732692fb708: {
        service: 'LambdaLayer',
      },
      i5732f46becd3: {
        service: 'LambdaLayer',
      },
      i5732697ec2c4: {
        service: 'Lambda',
        dependsOn: [
          {
            category: 'auth',
            resourceName: 'i573239366e8a',
            attributes: ['UserPoolId'],
          },
          {
            category: 'function',
            resourceName: 'i5732692fb708',
            attributes: ['Arn'],
          },
          {
            category: 'function',
            resourceName: 'i5732f46becd3',
            attributes: ['Arn'],
          },
        ],
      },
    },
  };
  const selectedSettings = [resourceAccessSetting];
  const LambdaToUpdate = 'i5732697ec2c4';
  const currentDependsOn: FunctionDependency[] = [];
  expect(consolidateDependsOnForLambda(contextStub, currentDependsOn, LambdaToUpdate, selectedSettings)).toMatchSnapshot();
});
