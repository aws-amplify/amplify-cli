import { CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from '@aws-cdk/aws-appsync';
import { CfnTable } from '@aws-cdk/aws-dynamodb';
import { CfnPolicy, CfnRole } from '@aws-cdk/aws-iam';
import { CfnEventSourceMapping, CfnFunction } from '@aws-cdk/aws-lambda';
import { CfnResource, Construct } from '@aws-cdk/core';
import { ConstructResourceMeta } from './types';
import {
  AppSyncServiceResourceStack,
  AppsyncStackCommon,
  FunctionDirectiveStack,
  HttpsDirectiveStack,
  ModelDirectiveStack,
  OpenSearchDirectiveStack,
} from './amplify-api-resource-stack-types';
import _ from 'lodash';

export const stacksTypes: Record<string, string> = {
  API: 'api',
  MODELS: 'models',
  HttpDirectiveStack: 'http',
  FunctionDirectiveStack: 'function',
  PredictionsDirectiveStack: 'predictions',
  SearchableStack: 'openSearch',
};

const rootStackNameInConstruct = 'transformer-root-stack';

/**
 * Test Cases
// ['rootStack' , 'Name*'] id = resource
// ['rootStack' , 'scope'] id = Name
// ['rootStack' , 'NestedStack' , 'Name*'] id  = resource
// ['rootStack' , 'NestedStack'] id = Name
 */

export const getStackMeta = (constructPathArr: string[], id: string, nestedStackArr: string[], node: Construct): ConstructResourceMeta => {
  const resource = node as CfnResource;
  if (nestedStackArr.find(val => val === constructPathArr[1])) {
    const nestedStackName = nestedStackArr.find(val => val === constructPathArr[1]);
    const resourceName = constructPathArr.filter(path => path !== nestedStackName && path !== rootStackNameInConstruct).join('');
    return {
      resourceName,
      resourceType: resource.cfnResourceType,
      nestedStack: {
        stackName: nestedStackName!,
        stackType: stacksTypes[nestedStackName!] ?? stacksTypes['MODELS'],
      },
    };
  } else {
    // root stack
    const resourceName = constructPathArr.filter(path => path !== rootStackNameInConstruct).join('');
    return {
      resourceName: id === 'Resource' ? resourceName : `${resourceName}${id}`,
      resourceType: resource.cfnResourceType,
      rootStack: {
        stackName: constructPathArr[0],
        stackType: stacksTypes.API,
      },
    };
  }
};

export const cast = (resource: CfnResource) => {
  if (resource.cfnResourceType === 'AWS::DynamoDB::Table') {
    return resource as CfnTable;
  } else if (resource.cfnResourceType === 'AWS::AppSync::GraphQLApi') {
    return resource as CfnGraphQLApi;
  } else if (resource.cfnResourceType === 'AWS::AppSync::ApiKey') {
    return resource as CfnApiKey;
  } else if (resource.cfnResourceType === 'AWS::AppSync::GraphQLSchema') {
    return resource as CfnGraphQLSchema;
  } else if (resource.cfnResourceType === 'AWS::AppSync::DataSource') {
    return resource as CfnDataSource;
  } else if (resource.cfnResourceType === 'AWS::IAM::Role') {
    return resource as CfnRole;
  } else if (resource.cfnResourceType === 'AWS::IAM::Policy') {
    return resource as CfnPolicy;
  } else if (resource.cfnResourceType === 'AWS::AppSync::Resolver') {
    return resource as CfnResolver;
  } else if (resource.cfnResourceType === 'AWS::AppSync::FunctionConfiguration') {
    return resource as CfnFunctionConfiguration;
  } else if (resource.cfnResourceType === 'AWS::Lambda::Function') {
    return resource as CfnFunction;
  } else if (resource.cfnResourceType === 'AWS::Lambda::EventSourceMapping') {
    return resource as CfnEventSourceMapping;
  } else if (resource.cfnResourceType === 'AWS::Elasticsearch::Domain') {
    return resource;
  } else {
    return undefined;
  }
};

export const convertToAppsyncResourceObj = (amplifyObj: any) => {
  let appsyncResourceObject: AppSyncServiceResourceStack = {};
  Object.keys(amplifyObj).forEach(keys => {
    if (keys === 'api') {
      appsyncResourceObject.api = amplifyObj.api;
    } else if (keys === 'models' && !_.isEmpty(amplifyObj[keys])) {
      // require filter using keyName
      appsyncResourceObject.models = {};
      Object.keys(amplifyObj.models).forEach(key => {
        appsyncResourceObject.models![key] = generateModelDirectiveObject(amplifyObj.models[key]);
      });
    } else if (keys === 'function' && !_.isEmpty(amplifyObj[keys])) {
      appsyncResourceObject.function = {};
      const functionStackObj = amplifyObj.function.FunctionDirectiveStack;
      appsyncResourceObject.function = generateFunctionDirectiveObject(functionStackObj);
    } else if (keys === 'http' && !_.isEmpty(amplifyObj[keys])) {
      appsyncResourceObject.http = {};
      const httpStackObj = amplifyObj.http.HttpDirectiveStack;
      appsyncResourceObject.http = generateHttpDirectiveObject(httpStackObj);
    } else if (keys === 'openSearch' && !_.isEmpty(amplifyObj[keys])) {
      appsyncResourceObject.opensearch = {};
      const openSearchStackObj = amplifyObj.openSearch.SearchableStack;
      appsyncResourceObject.opensearch = generateOpenSearchDirectiveObject(openSearchStackObj);
    } else if (keys === 'predictons' && !_.isEmpty(amplifyObj[keys])) {
      appsyncResourceObject.predictions = {};
      appsyncResourceObject.predictions = amplifyObj.PredictionsDirectiveStack;
    }
  });
  return appsyncResourceObject;
};

const generateFunctionDirectiveObject = (functionStackObj: any) => {
  let functionObj: Partial<FunctionDirectiveStack & AppsyncStackCommon> = {};
  Object.keys(functionStackObj).forEach(key => {
    if (key.includes('resolver')) {
      functionObj.resolvers = functionStackObj.resolvers;
    } else if (key.includes('appsyncFunctions')) {
      functionObj.appsyncFunctions = functionStackObj.appsyncFunctions;
    } else if (functionStackObj[key].cfnResourceType.includes('DataSource')) {
      if (!functionObj.lambdaDataSource) {
        functionObj.lambdaDataSource = {};
      }
      const name = key.substring(0, key.indexOf('LambdaDataSource'));
      functionObj.lambdaDataSource[name] = functionStackObj[key];
    } else if (functionStackObj[key].cfnResourceType.includes('Role')) {
      if (!functionObj.lambdaDataSourceRole) {
        functionObj.lambdaDataSourceRole = {};
      }
      const name = key.substring(0, key.indexOf('LambdaDataSourceServiceRole'));
      functionObj.lambdaDataSourceRole[name] = functionStackObj[key];
    } else if (functionStackObj[key].cfnResourceType.includes('Policy')) {
      if (!functionObj.lambdaDataSourceServiceRoleDefaultPolicy) {
        functionObj.lambdaDataSourceServiceRoleDefaultPolicy = {};
      }
      const name = key.substring(0, key.indexOf('LambdaDataSourceServiceRoleDefaultPolicy'));
      functionObj.lambdaDataSourceServiceRoleDefaultPolicy[name] = functionStackObj[key];
    }
  });
  return functionObj;
};

const generateHttpDirectiveObject = (httpStackObj: any) => {
  let httpObj: Partial<HttpsDirectiveStack & AppsyncStackCommon> = {};
  Object.keys(httpStackObj).forEach(key => {
    if (key.includes('resolver')) {
      httpObj.resolvers = httpStackObj.resolvers;
    } else if (key.includes('appsyncFunctions')) {
      httpObj.appsyncFunctions = httpStackObj.appsyncFunctions;
    } else if (httpStackObj[key].cfnResourceType.includes('DataSource')) {
      if (!httpObj.httpsDataSource) {
        httpObj.httpsDataSource = {};
      }
      const name = key.substring(0, key.indexOf('DataSource'));
      httpObj.httpsDataSource[name] = httpStackObj[key];
    } else if (httpStackObj[key].cfnResourceType.includes('Role')) {
      if (!httpObj.httpDataSourceServiceRole) {
        httpObj.httpDataSourceServiceRole = {};
      }
      const name = key.substring(0, key.indexOf('DataSourceServiceRole'));
      httpObj.httpDataSourceServiceRole[name] = httpStackObj[key];
    }
  });
  return httpObj;
};

const generateOpenSearchDirectiveObject = (opensearchStackObj: any) => {
  let opensearchObj: OpenSearchDirectiveStack & AppsyncStackCommon = _.pick(
    opensearchStackObj,
    'openSearchDataSource',
    'openSearchAccessIAMRole',
    'OpenSearchAccessIAMRoleDefaultPolicy',
    'OpenSearchDomain',
    'OpenSearchStreamingLambdaIAMRole',
    'OpenSearchStreamingLambdaIAMRoleDefaultPolicy',
    'CloudwatchLogsAccess',
    'OpenSearchStreamingLambdaFunction',
    'resolvers',
    'appsyncFunctions',
  );

  Object.keys(opensearchStackObj).forEach(key => {
    if (key !== 'resolvers' && key !== 'appsyncFunctions' && opensearchStackObj[key].cfnResourceType.includes('EventSourceMapping')) {
      if (!opensearchObj.openSearchModelLambdaMapping) {
        opensearchObj.openSearchModelLambdaMapping = {};
      }
      // filter ModelName fromm logicalID
      const name = key.substring(0, key.indexOf('LambdaMapping'));
      const modeName = key.substring('Searchable'.length, name.length);
      opensearchObj.openSearchModelLambdaMapping[modeName] = opensearchStackObj[key];
    }
  });
  return opensearchObj;
};

const generateModelDirectiveObject = (modelStackObj: any) => {
  let modelObj: ModelDirectiveStack = _.pick(modelStackObj, 'appsyncFunctions', 'DynamoDBAccess', 'InvokdeLambdaFunction', 'resolvers');
  let strippedModelObj = _.omit(modelStackObj, 'appsyncFunctions', 'DynamoDBAccess', 'InvokdeLambdaFunction', 'resolvers');
  Object.keys(strippedModelObj).forEach(key => {
    if (strippedModelObj[key].cfnResourceType.includes('DataSource')) {
      modelObj.modelDatasource = modelStackObj[key];
    }
    if (strippedModelObj[key].cfnResourceType.includes('Role')) {
      modelObj.modelIamRole = modelStackObj[key];
    }
    if (strippedModelObj[key].cfnResourceType.includes('Policy')) {
      modelObj.modelIamRoleDefaultPolicy = modelStackObj[key];
    }
    if (strippedModelObj[key].cfnResourceType.includes('Table')) {
      modelObj.modelDDBTable = modelStackObj[key];
    }
  });
  return modelObj;
};
