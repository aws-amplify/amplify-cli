import { CfnApiKey, CfnDataSource, CfnFunctionConfiguration, CfnGraphQLApi, CfnGraphQLSchema, CfnResolver } from '@aws-cdk/aws-appsync';
import { CfnTable } from '@aws-cdk/aws-dynamodb';
import { CfnPolicy, CfnRole } from '@aws-cdk/aws-iam';
import { CfnEventSourceMapping, CfnFunction } from '@aws-cdk/aws-lambda';
import { CfnResource, Construct } from '@aws-cdk/core';
import { ConstructResourceMeta } from './types';
import {
  AppsyncApiStack,
  AppSyncServiceResourceStack,
  AppsyncStackCommon,
  FunctionDirectiveStack,
  HttpsDirectiveStack,
  ModelDirectiveStack,
  OpenSearchDirectiveStack,
  PredictionsDirectiveStack,
} from './amplify-api-resource-stack-types';

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
    if (id === 'Resource') {
      return {
        resourceName,
        resourceType: resource.cfnResourceType,
        nestedStack: {
          stackName: nestedStackName!,
          stackType: stacksTypes[nestedStackName!] ?? stacksTypes['MODELS'],
        },
      };
    } else {
      return {
        resourceName: `${resourceName}`,
        resourceType: resource.cfnResourceType,
        nestedStack: {
          stackName: nestedStackName!,
          stackType: stacksTypes[nestedStackName!] ?? stacksTypes['MODELS'],
        },
      };
    }
  } else {
    // root stack
    const resourceName = constructPathArr.filter(path => path !== rootStackNameInConstruct).join('');
    if (id === 'Resource') {
      return {
        resourceName,
        resourceType: resource.cfnResourceType,
        rootStack: {
          stackName: constructPathArr[0],
          stackType: stacksTypes.API,
        },
      };
    } else {
      return {
        resourceName: `${resourceName}${id}`,
        resourceType: resource.cfnResourceType,
        rootStack: {
          stackName: constructPathArr[0],
          stackType: stacksTypes.API,
        },
      };
    }
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

// export const convertToAppsyncResourceObj = (amplifyApiObj) => {
//     // let amplifyTypedObject : AppSyncServiceResourceStack = {};
//     // amplifyTypedObject = amplifyApiObj
//     // amplifyTypedObject.api = amplifyApiObj.api;
//     // // convert model type
//     // amplifyTypedObject.models = amplifyApiObj.models;
//     // // convert function stack type
//     // amplifyTypedObject.function = amplifyApiObj.function.FunctionDirectiveStack;
//     // // convert http stack type
//     // amplifyTypedObject.http = amplifyApiObj.http.HttpDirectiveStack;
//     // // covert predictions stack
//     // amplifyTypedObject.predictions = amplifyApiObj.predictions.PredictionsDirectiveStack;
//     // // covert predictions stack
//     // amplifyTypedObject.opensearch = amplifyApiObj.opensearch.SearchableStack;

// }
