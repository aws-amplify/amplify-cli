import { DeploymentResources as DeploymentResourcesV2 } from '@aws-amplify/graphql-transformer-core';
import { DeploymentResources as DeploymentResourcesV1 } from 'graphql-transformer-core';
// eslint-disable-next-line import/no-cycle
import {
  $TSAny,
  $TSContext,
  $TSObject,
} from '..';

const API_CATEGORY_NAME = 'api';

/**
 * Facade for the API Category, to facilitate typed requests against some of the plugin methods exposed.
 */
export class ApiCategoryFacade {
  /**
   * Get the transformer version used in this project.
   */
  static async getTransformerVersion(context: $TSContext): Promise<number> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'getTransformerVersion', [context]);
  }

  /**
   * Return the supported transformer directives.
   */
  static async getDirectiveDefinitions(context: $TSContext, resourceDir: string): Promise<string> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'getDirectiveDefinitions', [context, resourceDir]);
  }

  /**
   * Perform the actual transformation for a given project. This is predominantlyu a side-effecting call, but we
   * also return the deployment resources as well.
   */
  static async transformGraphQLSchema(
    context: $TSContext,
    options: $TSAny,
  ): Promise<DeploymentResourcesV2 | DeploymentResourcesV1 | undefined> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'transformGraphQLSchema', [context, options]);
  }

  /**
   * Add a new auth mode to the API.
   */
  static async addGraphQLAuthorizationMode(
    context: $TSContext,
    authType: string,
  ): Promise<void> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'addGraphQLAuthorizationMode', [
      context,
      { authType, printLeadText: true, authSettings: undefined },
    ]);
  }

  /**
   * Generates an ECS Stack and metadata for the given resource object.
   */
  static async generateContainersArtifacts(
    context: $TSContext,
    resource: $TSAny,
  ): Promise<$TSObject> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'generateContainersArtifacts', [context, resource]);
  }
}
