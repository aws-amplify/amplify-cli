import { $TSContext, CloudformationProviderFacade } from '@aws-amplify/amplify-cli-core';
import type { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import type { CreateComponentData, Component, Theme, Form, StartCodegenJobData } from 'aws-sdk/clients/amplifyuibuilder';
import { AmplifyUIBuilder, AmplifyBackend } from 'aws-sdk';
import { printer } from '@aws-amplify/amplify-prompts';
import { getAppId, getEnvName } from '../commands/utils/environmentHelpers';
import { getTransformerVersion } from '../commands/utils/featureFlags';
import { isDataStoreEnabled } from '@aws-amplify/amplify-category-api';

/**
 * studio client metadata
 */
export type StudioMetadata = {
  autoGenerateForms: boolean;
  autoGenerateViews: boolean;
  formFeatureFlags: {
    isRelationshipSupported: boolean;
    isNonModelSupported: boolean;
  };
  isGraphQLEnabled: boolean;
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
  isGraphQLSupported = false;
  isDataStoreEnabled = false;

  /**
   * static function meant to check if given appId is studio enabled
   */
  static isAmplifyApp = async (context: $TSContext, appId: string): Promise<boolean> => {
    try {
      const { isAdminApp } = await CloudformationProviderFacade.isAmplifyAdminApp(context, appId);
      return isAdminApp;
    } catch (err) {
      // return false is admin app failed check
      // this means we wont run codegen-ui
      printer.debug(`Failed admin app check: ${err.message}`);
      return false;
    }
  };

  /**
   * Used to configure the AWS Amplify clients.
   */
  static async setClientInfo(context: $TSContext, envName?: string, appId?: string): Promise<AmplifyStudioClient> {
    const resolvedEnvName = getEnvName(context, envName);
    const resolvedAppId = getAppId(context, appId);
    const [awsConfigInfo, dataStoreStatus] = await Promise.all([
      context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
        context,
        resolvedEnvName,
        resolvedAppId,
      ]) as ServiceConfigurationOptions,
      isDataStoreEnabled(context),
    ]);

    const client = new AmplifyStudioClient(awsConfigInfo, resolvedAppId, resolvedEnvName);

    if ((await getTransformerVersion()) === 2) {
      await client.loadMetadata();
      client.isGraphQLSupported = true;
    } else {
      client.isGraphQLSupported = false;
    }

    client.isDataStoreEnabled = dataStoreStatus;

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
      formFeatureFlags: {
        isRelationshipSupported: false,
        isNonModelSupported: false,
      },
      isGraphQLEnabled: false,
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
        formFeatureFlags: {
          isRelationshipSupported: response.features?.isRelationshipSupported === 'true',
          isNonModelSupported: response.features?.isNonModelSupported === 'true',
        },
        isGraphQLEnabled: response.features?.isGraphQLEnabled === 'true',
      };
    } catch (err) {
      throw new Error(`Failed to load metadata: ${err.message}`);
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
      return { entities: uiBuilderComponents };
    } catch (err) {
      throw new Error(`Failed to list components: ${err.message}`);
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
      return { entities: uiBuilderThemes };
    } catch (err) {
      throw new Error(`Failed to list themes: ${err.message}`);
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
      return { entities: uibuilderForms };
    } catch (err) {
      throw new Error(`Failed to list forms: ${err.message}`);
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
      throw new Error(`Failed to create component: ${err.message}`);
    }
  };

  deleteForm = async (formId: string, envName?: string, appId?: string): Promise<void> => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      await this.#amplifyUiBuilder.deleteForm({ id: formId, environmentName, appId: resolvedAppId }).promise();
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
    } catch (err) {
      throw new Error(`Models not found in AmplifyBackend:GetBackendAPIModels response: ${err.message}`);
    }
  };

  startCodegenJob = async (codegenJobToCreate: StartCodegenJobData, appId?: string, envName?: string) => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      const response = await this.#amplifyUiBuilder
        .startCodegenJob({
          appId: resolvedAppId,
          environmentName,
          codegenJobToCreate,
        })
        .promise();
      if (!response.entity || !response.entity.id) {
        throw new Error('Error starting codegen job');
      }
      return response.entity.id;
    } catch (err) {
      printer.debug('Failed to start job');
      printer.debug(err.stack);
      throw err;
    }
  };

  getCodegenJob = async (jobId: string, appId?: string, envName?: string) => {
    const environmentName = envName || this.#envName;
    const resolvedAppId = appId || this.#appId;
    try {
      const { job } = await this.#amplifyUiBuilder
        .getCodegenJob({
          id: jobId,
          appId: resolvedAppId,
          environmentName,
        })
        .promise();
      if (!job) {
        throw new Error('Error getting codegen job');
      }
      return job;
    } catch (err) {
      printer.debug(err.toString());
      throw err;
    }
  };
}
