import { ApiKeyConfig } from '@aws-amplify/graphql-transformer-interfaces';
import { Template } from 'cloudform-types';
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

  /**
   * Hashes the project directory into a single value. The same project configuration
   * should return the same hash.
   */
  static async hashDirectory(context: $TSContext, directory: string): Promise<string> {
    const providerPlugin = await import(context.amplify.getProviderPlugins(context)[PROVIDER_NAME]);
    return providerPlugin.hashDirectory(directory);
  }

  /**
   * Get the pre-push template modifier, which accepts a template, and modifies in-place.
   */
  static async prePushCfnTemplateModifier(context: $TSContext, template: Template): Promise<(template: Template) => Promise<void>> {
    const providerPlugin = await import(context.amplify.getProviderPlugins(context)[PROVIDER_NAME]);
    return providerPlugin.prePushCfnTemplateModifier(template);
  }

  /**
   * Return the api key config.
   */
  static async getApiKeyConfig(context: $TSContext): Promise<ApiKeyConfig> {
    const providerPlugin = await import(context.amplify.getProviderPlugins(context)[PROVIDER_NAME]);
    return providerPlugin.getApiKeyConfig();
  }
}
