import { $TSContext } from 'amplify-cli-core';
import { BuiltParams, BuiltResourceType } from './export-types/BuiltResourceType';
import { ResourceType } from './export-types/ResourceType';
import { transformGraphQLSchema } from './graphql-transformer/transform-graphql-schema';
import { legacyLayerMigration, prePushLambdaLayerPrompt } from './lambdaLayerInvocations';
import { updateStackForAPIMigration } from './push-resources';

const apiCategory = 'api';
const functionCategory = 'function';
const authCategory = 'auth';

const authServiceCognito = 'Cognito';

const apiServiceAppsync = 'AppSync';
const apiServiceElasticContainer = 'ElasticContainer';

const functionServiceLambda = 'Lambda';
const functionServiceLayer = 'LambdaLayer';

export async function buildGetPaths(context: $TSContext, resources: ResourceType[]): Promise<BuiltResourceType[]> {
  await prePushLambdaLayerPrompt(context, resources);
  return await Promise.all(
    resources.map(async resource => {
      const buildParams = await buildByCategory(context, resource);
      return {
        ...resource,
        buildParams,
      };
    }),
  );
}

async function buildByCategory(context: $TSContext, resource: ResourceType): Promise<BuiltParams[]> {
  switch (resource.category) {
    case apiCategory:
      return await buildByApiService(context, resource);
    case functionCategory:
      return await buildByFunctionService(context, resource);
    case authCategory:
      return await buildByAuth(context, resource);
    default:
      break;
  }
}

async function buildByAuth(context: $TSContext, resource: ResourceType): Promise<BuiltParams[]> {
  if (resource.category === authCategory && resource.service === authServiceCognito) {
  }
  return [];
}

async function buildByApiService(context: $TSContext, resource: ResourceType): Promise<BuiltParams[]> {
  const {
    parameters: { options },
  } = context;
  switch (resource.service) {
    case apiServiceAppsync:
      await transformGraphQLSchema(context, {
        handleMigration: (opts: any) => updateStackForAPIMigration(context, 'api', undefined, opts),
        minify: options['minify'],
      });
      break;
    case apiServiceElasticContainer:
      return [await buildAndPackage(context, resource)];
  }
  return [];
}

async function buildByFunctionService(context: $TSContext, resource: ResourceType): Promise<BuiltParams[]> {
  switch (resource.service) {
    case functionServiceLambda:
      break;
    case functionServiceLayer:
      await legacyLayerMigration(context, resource.resourceName);
      break;
    default:
      break;
  }
  return [await buildAndPackage(context, resource)];
}

async function buildAndPackage(context: $TSContext, resource: ResourceType): Promise<BuiltParams> {
  await context.amplify.invokePluginMethod(context, functionCategory, undefined, 'buildResource', [context, resource]);
  return await context.amplify.invokePluginMethod(context, functionCategory, undefined, 'packageResource', [context, resource, true]);
}
