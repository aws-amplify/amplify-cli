import {
  getAppSyncServiceExtraDirectives,
} from '@aws-amplify/graphql-transformer-core';
import {
  $TSContext,
} from 'amplify-cli-core';
import { print } from 'graphql';
import { getTransformerFactory } from './transformer-factory';
import { getTransformerVersion } from './transformer-version';

/**
 * Return the set of directive definitions for the project, includes both appsync and amplify supported directives.
 * This will return the relevant set determined by whether or not the customer is using GQL transformer v1 or 2 in their project.
 */
export const getDirectiveDefinitions = async (context: $TSContext, resourceDir: string): Promise<string> => {
  const transformerVersion = await getTransformerVersion(context);
  const transformer = await getTransformerFactory(context, resourceDir);
  const transformList = transformerVersion === 2
    ? await transformer({ addSearchableTransformer: true, authConfig: {} })
    : await transformer(true);

  const transformDirectives = transformList
    .map(transformPluginInst => [transformPluginInst.directive, ...transformPluginInst.typeDefinitions].map(node => print(node)).join('\n'))
    .join('\n');

  return [getAppSyncServiceExtraDirectives(), transformDirectives].join('\n');
};
