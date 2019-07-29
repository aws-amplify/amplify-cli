import { isArray, isPlainObject } from 'lodash';
import * as Topo from '@hapi/topo';
import { isString } from 'util';
import { parseValue } from './field-parser';
import {
  AWSCloudFormationParameterDefinition,
  AWSCloudFormationParametersBlock,
  CloudFormationParseContext
} from './types';
export function parseStacks(stacks, rootKey) {
  const rootStack = stacks[rootKey];
  const pendingStacks = [];
  const resources = {};
}

function processStack(cfn, parameters, exports = {}, stackName = 'rootStack') {
  const processedParams = processParams(parameters, cfn.Parameters || {}, stackName);
  const processedConditions = processConditions(processedParams, cfn.Conditions || {}, exports);

  // Object.keys(cfn.resources).forEach(resourceName => {
  //   const resource = cfn.resources[resourceName];

  // });
  // return result;
}

// function dynamoDBResourceHandler(resource, parameters) {
//   const tableName = resource.Properties.TableName.
// }

// function graphQLAPIResourceHandler(resource, parameter) {
//   return {
//     name: 'GraphQLAPI',
//     authenticationType: resource.Properties.AuthenticationType,
//   }
// }

// function graphQLAPIKeyResourceHandler(resource, parameters) {
//   return 'SomeRandomAPIKey';
// }

// function graphQLSchemaResourceHandler(resource, parameters) {
//   return resource.Properties.DefinitionS3Location['Fn::Sub'][0];
// }

// function subStackResourceHandler(resource, parameters) {

// }

// function appSyncDataSourceResourceHandler(resource, parameters) {

// }

// function appSyncResolverHandler(resource, parameters) {

// }
export function processParams(
  inputParameters: object,
  parameterBlock: AWSCloudFormationParametersBlock,
  stackName: string
): {} {
  if (!stackName) {
    throw new Error(`Missing stack name`);
  }

  const DEFAULT_PARAMS = {
    'AWS::Region': 'us-east-1-fake',
    'AWS::AccountId': '12345678910',
    'AWS::StackId': 'fake-stackId',
    'AWS::StackName': stackName
  };
  Object.keys(inputParameters).forEach(param => {
    if (!(param in parameterBlock)) {
      throw new Error(`Parameter ${param} not in Cloudformation parameter block`);
    }
  });
  const processedParameters = {};
  Object.keys(parameterBlock).map(param => {
    if (param in inputParameters) {
      processedParameters[param] = inputParameters[param];
    } else {
      const defaultValue = parameterBlock[param].Default;
      if (!defaultValue) {
        throw new Error(`Missing value for parameter ${param} in stack ${stackName}`);
      }
      processedParameters[param] = defaultValue;
    }
  });
  return { ...DEFAULT_PARAMS, ...processedParameters };
}

export function processConditions(params: object, inputConditions: object, exports: object = {}) {
  // XXX: topological Sort conditions for dependencies
  const conditions = {};
  const cfnContext: CloudFormationParseContext = {
    params,
    conditions,
    resources: {},
    exports
  };

  const conditionOrder = new Topo();
  Object.keys(inputConditions).forEach((conditionName) => {
    const dependsOnConditions = walkCfnConditions(inputConditions[conditionName]);
    conditionOrder.add(conditionName, { after: dependsOnConditions, group: conditionName})
  })
  console.log(conditionOrder.nodes);

  const processedConditions = conditionOrder.nodes.reduce((prevValues, currentValue) => {
    const node = inputConditions[currentValue];
    prevValues[currentValue] = parseValue(node, cfnContext);
    return prevValues;
  }, conditions);
  return processedConditions;
}

function processResources(parameters, conditions, inputResources) {}
function processOutput(parameters, conditions, resources, output) {}

export function sortConditionsTopologically(conditions: object) {
  const conditionDepMap = {};
  Object.keys(conditions).forEach(condition => {});
}

export function walkCfnConditions(node) {
  if (isString(node)) {
    return [];
  }
  const opKey = Object.keys(node)[0];
  const opValue = node[opKey];
  switch (opKey) {
    case 'Condition':
      return [opValue];
    case 'Fn::Not':
      return walkCfnConditions(opValue[0])
    case 'Fn::If':
      return [...walkCfnConditions(opValue[0]), ...walkCfnConditions(opValue[1])];
    case 'Fn::And':
    case 'Fn::Or':
      return opValue.reduce((prevValues, value) => {
        const conditions = walkCfnConditions(value);
        return [...prevValues, ...conditions];
      }, []);
    case 'Fn::Equals':
      return [...walkCfnConditions(opValue[0]), ...walkCfnConditions(opValue[1])];
    default:
      return [];
  }
}

function test() {
  const cfn = {
    Parameters: {
      param1: {
        Type: 'String',
        Default: 'Default Param1'
      },
      bar: {
        Type: 'String',
        Default: 'bar'
      }
    },
    Conditions: {}
  };
  const params = {
    bar: 'Not default',
    notPresent: 'asdf'
  };
  const result = processStack(cfn, params);
}

// test();
