import { FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import { DocumentNode } from 'graphql/language';
import { visit } from 'graphql';
import { collectDirectives, collectDirectivesByTypeNames } from '@aws-amplify/graphql-transformer-core';
import { listContainsOnlySetString } from './utils';
import * as fs from 'fs-extra';
import * as path from 'path';

export function graphQLUsingSQL(apiName: string): boolean {
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  const env = stateManager.getLocalEnvInfo().envName;
  if (teamProviderInfo?.[env]?.categories?.api?.[apiName]?.rdsClusterIdentifier) {
    return true;
  }
  return false;
}

export function detectCustomRootTypes(schema: DocumentNode): boolean {
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
  const resolversDir = path.join(pathManager.getResourceDirectoryPath(undefined, 'api', apiName), 'resolvers');
  if (!fs.existsSync(resolversDir)) {
    return false;
  }
  const vtlFiles = fs.readdirSync(resolversDir).filter(file => file.endsWith('.vtl'));
  return !!vtlFiles.length;
}

export async function detectPassthroughDirectives(schema: string): Promise<Array<string>> {
  const supportedDirectives = new Set<string>([
    'connection',
    'key',
    'searchable',
    'auth',
    'model',
    'function',
    'predictions',
    'aws_subscribe',
  ]);
  const directiveMap: any = collectDirectivesByTypeNames(schema).types;
  let passthroughDirectiveSet = new Set<string>();
  for (let type of Object.keys(directiveMap)) {
    for (let dirName of listContainsOnlySetString(directiveMap[type], supportedDirectives)) {
      passthroughDirectiveSet.add(dirName);
    }
  }

  return Array.from(passthroughDirectiveSet);
}

export function detectDeprecatedConnectionUsage(schema: string): boolean {
  const directives = collectDirectives(schema);
  const deprecatedConnectionArgs = ['name', 'keyField', 'sortField', 'limit'];
  const connectionDirectives = directives.filter(directive => directive.name.value === 'connection');
  for (const connDir of connectionDirectives) {
    if (connDir.arguments?.some(arg => deprecatedConnectionArgs.includes(arg.name.value))) {
      return true;
    }
  }
  return false;
}

export function isImprovedPluralizationEnabled() {
  return FeatureFlags.getBoolean('graphqltransformer.improvepluralization');
}

export function isTransformerV2Enabled() {
  return FeatureFlags.getNumber('graphqltransformer.transformerversion') === 2;
}
