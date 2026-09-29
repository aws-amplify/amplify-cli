import { $TSAny, $TSContext } from '..';

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
  static async transformGraphQLSchema(context: $TSContext, options: $TSAny): Promise<$TSAny | undefined> {
    return context.amplify.invokePluginMethod(context, API_CATEGORY_NAME, undefined, 'transformGraphQLSchema', [context, options]);
  }
}
