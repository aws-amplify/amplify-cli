import { stateManager } from 'amplify-cli-core';
import { DocumentNode } from 'graphql/language';
import { visit } from 'graphql';
import { collectDirectives, collectDirectivesByTypeNames } from '@aws-amplify/graphql-transformer-core';
import { listContainsOnlySetString } from './utils';
import * as fs from 'fs-extra';

export function graphQLUsingSQL(apiName: string): boolean {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  const env = stateManager.getLocalEnvInfo().envName;
  if (teamProviderInfo?.[env]?.categories?.api?.[apiName]?.rdsClusterIdentifier) {
    return true;
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
      },
    },
  });
  return customResolversUsed;
}

export function detectOverriddenResolvers(apiName: string): boolean {
  const files = fs.readdirSync(`amplify/backend/api/${apiName}/resolvers/`);
  return !!files.length;
}

export async function detectUnsupportedDirectives(schema: string): Promise<Array<string>> {
  const supportedDirectives = new Set<string>([
    'connection',
    'key',
    'searchable',
    'auth',
    'model',
    'function',
    'predictions',
    'aws_api_key',
    'aws_iam',
    'aws_oidc',
    'aws_cognito_user_pools',
    'aws_auth',
    'aws_subscribe',
  ]);
  const directiveMap: any = collectDirectivesByTypeNames(schema).types;
  let unsupportedDirSet = new Set<string>();
  for (let type of Object.keys(directiveMap)) {
    for (let dirName of listContainsOnlySetString(directiveMap[type], supportedDirectives)) {
      unsupportedDirSet.add(dirName);
    }
  }

  // check for old parameterization of @connection
  const directives = collectDirectives(schema);
  const deprecatedConnectionArgs = ['name', 'keyField', 'sortField', 'limit'];
  const connectionDirectives = directives.filter(directive => directive.name.value === 'connection');
  for (const connDir of connectionDirectives) {
    if (connDir.arguments?.map(arg => deprecatedConnectionArgs.includes(arg.name.value))) {
      unsupportedDirSet.add('Deprecated parameterization of @connection');
    }
  }

  return Array.from(unsupportedDirSet);
}
