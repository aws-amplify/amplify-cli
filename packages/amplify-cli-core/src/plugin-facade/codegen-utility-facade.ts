import _ from 'lodash';
// eslint-disable-next-line import/no-cycle
import { $TSContext } from '..';

const CODEGEN_PLUGIN_NAME = 'codegen';

/**
 * Facade for the Codegen Utility, to facilitate typed requests against some of the plugin methods exposed.
 */
export class CodegenUtilityFacade {
  /**
   * Invoke the codegen model generation process, will generate output values for datastore.
   */
  static async generateModels(context: $TSContext): Promise<void> {
    return context.amplify.invokePluginMethod(context, CODEGEN_PLUGIN_NAME, undefined, 'generateModels', [context]);
  }

  /**
   * Invoke the codegen model generation process, will generate the model introspection schema in the provided outputDir location.
   */
  static async generateModelIntrospection(context: $TSContext, outputDir: string): Promise<void> {
    // generateModelIntrospection expects --output-dir option to be set
    _.set(context, ['parameters', 'options', 'output-dir'], outputDir);

    return context.amplify.invokePluginMethod(context, CODEGEN_PLUGIN_NAME, undefined, 'generateModelIntrospection', [context]);
  }
}
