import { $TSContext } from 'amplify-cli-core';
import { BuiltResourceType } from './export-types/BuiltResourceType';
import { prePushAuthTransform } from './auth-transform';
const apiCategory = 'api';
const functionCategory = 'function';
const authCategory = 'auth';

const authServiceCognito = 'Cognito';
const authServiceCognitoUserPoolGroups = 'Cognito-UserPool-Groups';

const apiServiceAppsync = 'AppSync';
const apiServiceElasticContainer = 'ElasticContainer';

const functionServiceLambda = 'Lambda';
const functionServiceLayer = 'LambdaLayer';

export async function buildAndGenerateCfn(context: $TSContext, resources: BuiltResourceType[]) {
  if (resources.some(resource => resource.service === authServiceCognito || resource.service === authServiceCognitoUserPoolGroups)) {
    await prePushAuthTransform(context, resources);
  }
}
