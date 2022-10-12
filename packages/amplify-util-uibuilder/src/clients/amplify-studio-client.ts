import { $TSContext, CloudformationProviderFacade } from 'amplify-cli-core';
import type { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import type {
  CreateComponentData, Component, Theme, Form,
} from 'aws-sdk/clients/amplifyuibuilder';
import { AmplifyUIBuilder, AmplifyBackend } from 'aws-sdk';
import { printer } from 'amplify-prompts';
import { getAppId, getEnvName } from '../commands/utils/environmentHelpers';
import { getTransformerVersion } from '../commands/utils/featureFlags';

/**
 * studio client metadata
 */
export type StudioMetadata = {
  autoGenerateForms: boolean;
  autoGenerateViews: boolean;
};

/**
 * Builds the Amplify Backend Client
 */
const buildAmplifyBackendClient = (awsConfigInfo: ServiceConfigurationOptions): AmplifyBackend => {
  const awsConfig = { ...awsConfigInfo };
  if (process.env.AMPLIFY_BACKEND_ENDPOINT) {
    awsConfig.endpoint = process.env.AMPLIFY_BACKEND_ENDPOINT;
  }

  if (process.env.AMPLIFY_BACKEND_REGION) {
    awsConfig.region = process.env.AMPLIFY_BACKEND_REGION;
  }

  return new AmplifyBackend(awsConfig);
};

/**
 * Builds the Amplify UIBuilder Client
 */
const buildAmplifyUiBuilderClient = (awsConfigInfo: ServiceConfigurationOptions): AmplifyUIBuilder => {
  const awsConfig = { ...awsConfigInfo };
  if (process.env.UI_BUILDER_ENDPOINT) {
    awsConfig.endpoint = process.env.UI_BUILDER_ENDPOINT;
  }

  if (process.env.UI_BUILDER_REGION) {
    awsConfig.region = process.env.UI_BUILDER_REGION;
  }

  return new AmplifyUIBuilder(awsConfig);
};

/**
 * used for Amplify Studio related clients
 */
export default class AmplifyStudioClient {
  #amplifyUiBuilder: AmplifyUIBuilder;
  #amplifyBackend: AmplifyBackend;
  #appId: string;
  #envName: string;
  metadata: StudioMetadata;
  isSupportedGraphQL = false;
  /**
   * Used to configure the AWS Amplify clients.
   */
  static async setClientInfo(context: $TSContext, envName?: string, appId?: string): Promise<AmplifyStudioClient> {
    const resolvedEnvName = getEnvName(context, envName);
    const resolvedAppId = getAppId(context, appId);
    const awsConfigInfo = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
      context,
      resolvedEnvName,
      resolvedAppId,
    ])) as ServiceConfigurationOptions;

    const client = new AmplifyStudioClient(awsConfigInfo, resolvedAppId, resolvedEnvName);

    if ((await getTransformerVersion(context)) === 2) {
      await client.loadMetadata();
      client.isSupportedGraphQL = true;
    } else {
      client.isSupportedGraphQL = false;
    }

    return client;
  }

  /*
   * Builds the clients
   */
  constructor(awsConfigInfo: ServiceConfigurationOptions, appId: string, envName: string) {
    this.#amplifyUiBuilder = buildAmplifyUiBuilderClient(awsConfigInfo);
    this.#amplifyBackend = buildAmplifyBackendClient(awsConfigInfo);
    this.#appId = appId;
    this.#envName = envName;
    this.metadata = {
      autoGenerateForms: false,
      autoGenerateViews: false,
    };
  }

  /**
   * loads metadata from appId/envName
   */
  loadMetadata = async (envName?: string, appId?: string): Promise<void> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      const response = await this.#amplifyUiBuilder
        .getMetadata({
          appId: resolvedAppId,
          environmentName,
        })
        .promise();
      this.metadata = {
        autoGenerateForms: response.features?.autoGenerateForms === 'true',
        autoGenerateViews: response.features?.autoGenerateViews === 'true',
      };
    } catch (e) {
      printer.debug(e.toString());
      throw e;
    }
  };

  /**
   * listComponents from Studio
   */
  listComponents = async (envName?: string, appId?: string): Promise<{ entities: Component[] }> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      let nextToken: string | undefined;
      const uiBuilderComponents: Component[] = [];
      do {
        const response = await this.#amplifyUiBuilder
          .exportComponents({
            appId: resolvedAppId,
            environmentName,
            nextToken,
          })
          .promise();
        uiBuilderComponents.push(...response.entities);
        nextToken = response.nextToken;
      } while (nextToken);
      printer.debug(JSON.stringify(uiBuilderComponents, null, 2));
      return { entities: uiBuilderComponents };
    } catch (e) {
      printer.debug(e);
      throw e;
    }
  };

  /**
   * Returns all the UI Builder themes from the app
   */
  listThemes = async (envName?: string, appId?: string): Promise<{ entities: Theme[] }> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;

    try {
      let nextToken: string | undefined;
      const uiBuilderThemes: Theme[] = [];
      do {
        const response = await this.#amplifyUiBuilder
          .exportThemes({
            appId: resolvedAppId,
            environmentName,
            nextToken,
          })
          .promise();
        uiBuilderThemes.push(...response.entities);
        nextToken = response.nextToken;
      } while (nextToken);
      printer.debug(JSON.stringify(uiBuilderThemes, null, 2));
      return { entities: uiBuilderThemes };
    } catch (e) {
      printer.debug(e);
      throw e;
    }
  };

  listForms = async (envName?: string, appId?: string): Promise<{ entities: Form[] }> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      let nextToken: string | undefined;
      const uibuilderForms: Form[] = [];
      do {
        const response = await this.#amplifyUiBuilder
          .exportForms({
            appId: resolvedAppId,
            environmentName,
            nextToken,
          })
          .promise();
        uibuilderForms.push(...response.entities);
        nextToken = response.nextToken;
      } while (nextToken);
      printer.debug(JSON.stringify(uibuilderForms, null, 2));
      return { entities: uibuilderForms };
    } catch (e) {
      printer.debug(e);
      throw e;
    }
  };

  createComponent = async (component: CreateComponentData, envName?: string, appId?: string): Promise<Component | undefined> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      const response = await this.#amplifyUiBuilder
        .createComponent({
          appId: resolvedAppId,
          environmentName,
          componentToCreate: component,
        })
        .promise();
      return response.entity;
    } catch (err) {
      printer.debug(err.toString());
      throw err;
    }
  };

  getModels = async (resourceName: string, envName?: string, appId?: string): Promise<string | undefined> => {
    try {
      const environmentName = envName || this.#envName;
      const resolvedAppId = appId || this.#appId;
      const { Models } = await this.#amplifyBackend
        .getBackendAPIModels({
          AppId: resolvedAppId,
          BackendEnvironmentName: environmentName,
          ResourceName: resourceName,
        })
        .promise();
      return Models;
    } catch (e) {
      printer.debug(e);
      throw new Error(`Models not found in AmplifyBackend:GetBackendAPIModels response: ${e.message}`);
    }
  };

 isAmplifyApp = async (context: $TSContext): Promise<boolean> => {
   const { isAdminApp } = await CloudformationProviderFacade.isAmplifyAdminApp(context, this.#appId);
   return isAdminApp;
 }
}
