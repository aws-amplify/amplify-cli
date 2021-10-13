import { stateManager } from 'amplify-cli-core';
import { DocumentNode } from 'graphql/language';
import { visit } from 'graphql';
import { collectDirectivesByTypeNames } from '../utils';
import { listContainsOnlySetString } from './utils';
import * as fs from 'fs-extra';


export function graphQLUsingSQL(apiName: string): boolean {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  const env = stateManager.getLocalEnvInfo().envName;
  if (teamProviderInfo && teamProviderInfo[env]) {
    const apiCategory = teamProviderInfo[env]?.categories?.api;
    if (apiCategory && apiCategory[apiName] && apiCategory[apiName]?.rdsClusterIdentifier) {
      return true;
    }
  }
  return false;
}


export function detectCustomResolvers(schema: DocumentNode): boolean {
  let customResolversUsed = false;
  visit(schema, {
    ObjectTypeDefinition: {
      enter(node) {
        if (node.name.value === 'Mutation' || node.name.value === 'Query' || node.name.value === 'Subscription') {
          customResolversUsed = true;
        }
      }
    }
  });
  return customResolversUsed;
}


export function detectOverriddenResolvers(apiName: string): boolean {
  const files = fs.readdirSync(`amplify/backend/api/${apiName}/resolvers/`);
  return !!(files && files.length);
}


export async function detectUnsupportedDirectives(schema: string): Promise<Array<string>> {
  const supportedDirectives: Set<string> = new Set<string>(['connection', 'key', 'searchable', 'auth', 'model', 'function',
    'predictions', 'aws_api_key', 'aws_iam', 'aws_oidc', 'aws_cognito_user_pools', 'aws_auth', 'aws_subscribe']);
  const directiveMap: any = collectDirectivesByTypeNames(schema).types;
  let unsupportedDirSet: Set<string> = new Set<string>();
  for(let type of Object.keys(directiveMap)) {
    for(let dirName of listContainsOnlySetString(directiveMap[type], supportedDirectives)) {
      unsupportedDirSet.add(dirName);
    }
  }

  return Array.from(unsupportedDirSet);
}
