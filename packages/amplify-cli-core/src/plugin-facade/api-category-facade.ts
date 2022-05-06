import { DeploymentResources as DeploymentResourcesV2 } from '@aws-amplify/graphql-transformer-core';
import { DeploymentResources as DeploymentResourcesV1 } from 'graphql-transformer-core';
// eslint-disable-next-line import/no-cycle
import {
  $TSAny,
  $TSContext,
} from '..';

/**
 * Facade for the API Category, to facilitate typed requests against some of the plugin methods exposed.
 */
export class ApiCategoryFacade {
  /**
   * Get the transformer version used in this project.
   */
  static async getTransformerVersion(context: $TSContext): Promise<number> {
    return context.amplify.invokePluginMethod(context, 'api', undefined, 'getTransformerVersion', [context]);
  }

  /**
   * Return the supported transformer directives.
   */
  static async getDirectiveDefinitions(context: $TSContext, resourceDir: string): Promise<string> {
    return context.amplify.invokePluginMethod(context, 'api', undefined, 'getDirectiveDefinitions', [context, resourceDir]);
  }

  /**
   * Perform the schema transformation, this is primarily a side-effecting
   * call, which will generate new local resources.
   */
  static async transformGraphQLSchema(
    context: $TSContext,
    options: $TSAny,
  ): Promise<DeploymentResourcesV2 | DeploymentResourcesV1 | undefined> {
    return context.amplify.invokePluginMethod(context, 'api', undefined, 'getTransformerFactory', [context, options]);
  }

  /**
   * Create the resource manager for GQL deployments.
   * Models GSI adds/removes/updates for use in correct
   * iterative deploys.
   */
  static async createGraphQLResourceManager(
    context: $TSContext,
    gqlResource: $TSAny,
    StackId: string,
    rebuildAllTables: boolean,
  ): Promise<$TSAny> {
    return context.amplify.invokePluginMethod(context, 'api', undefined, 'createGraphQLResourceManager', [context, gqlResource, StackId, rebuildAllTables]);
  }

  /**
   * Return the transformer docs link based on the transformer version, used in mock.
   */
  static async getGraphQLTransformerFunctionDocLink(context: $TSContext): Promise<string> {
    const transformerVersion = await ApiCategoryFacade.getTransformerVersion(context);
    return context.amplify.invokePluginMethod(context, 'api', undefined, 'getGraphQLTransformerFunctionDocLink', [transformerVersion]);
  }
}
