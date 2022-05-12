// eslint-disable-next-line import/no-cycle
import { $TSContext } from '..';

const PROVIDER_NAME = 'awscloudformation';

/**
 * Facade for the API Category, to facilitate typed requests against some of the plugin methods exposed.
 */
export class CloudformationProviderFacade {
  /**
   * Return the transformer factory, will return the relevant factory based on whether the project
   * is using v2 or v1 transformers.
   */
  static async isAmplifyAdminApp(
    context: $TSContext,
    appId: string,
  ): Promise<{ isAdminApp: boolean; region: string; userPoolID: string }> {
    const providerPlugin = await import(context.amplify.getProviderPlugins(context)[PROVIDER_NAME]);
    return providerPlugin.isAmplifyAdminApp(appId);
  }
}
