import {
  getAppSyncServiceExtraDirectives,
} from '@aws-amplify/graphql-transformer-core';
import {
  $TSContext,
} from 'amplify-cli-core';
import { print } from 'graphql';
import { getTransformerFactoryV1, getTransformerFactoryV2 } from './transformer-factory';
import { getTransformerVersion } from './transformer-version';

/**
 * Return the set of directive definitions for the project, includes both appsync and amplify supported directives.
 * This will return the relevant set determined by whether or not the customer is using GQL transformer v1 or 2 in their project.
 */
export async function getDirectiveDefinitions(context: $TSContext, resourceDir: string): Promise<string> {
  const transformerVersion = await getTransformerVersion(context);
  const transformList = transformerVersion === 2
    ? await getTransformerFactoryV2(resourceDir)({ addSearchableTransformer: true, authConfig: {} })
    : await getTransformerFactoryV1(context, resourceDir)(true);

  const transformDirectives = transformList
    .map(transformPluginInst => [transformPluginInst.directive, ...transformPluginInst.typeDefinitions].map(node => print(node)).join('\n'))
    .join('\n');

  return [getAppSyncServiceExtraDirectives(), transformDirectives].join('\n');
}
