import { $TSAny, $TSContext } from 'amplify-cli-core';
import { AmplifyUIBuilder, AmplifyBackend } from 'aws-sdk';
import { getAppId, getEnvName } from '../commands/utils/environmentHelpers';

const CLIENT_INFO_NOT_SET = `Please ensure 'setClientInfo' has been called.`;
class AwsAmplifyClients {
  #amplifyUiBuilder: AmplifyUIBuilder | undefined;

  #amplifyBackend: AmplifyBackend | undefined;

  get amplifyUiBuilder(): AmplifyUIBuilder {
    if (!this.#amplifyUiBuilder) {
      throw new Error(CLIENT_INFO_NOT_SET);
    }
    return this.#amplifyUiBuilder;
  }

  get amplifyBackend(): AmplifyBackend {
    if (!this.#amplifyBackend) {
      throw new Error(CLIENT_INFO_NOT_SET);
    }
    return this.#amplifyBackend;
  }

  flushAll(): void {
    this.#amplifyUiBuilder = undefined;
    this.#amplifyBackend = undefined;
  }

  /**
   * Used to configure the AWS Amplify clients.
   */
  async setClientInfo(context: $TSContext, environmentName?: string, appId?: string): Promise<void> {
    const resolvedEnvName = getEnvName(context, environmentName);
    const resolvedAppId = await getAppId(context, appId);
    await this.buildClients(context, resolvedEnvName, resolvedAppId);
  }

  /*
  * Builds the clients
  */
  private async buildClients(context: $TSContext, environmentName: string, appId: string): Promise<void> {
    const awsConfigInfo = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
      context,
      environmentName,
      appId,
    ])) as $TSAny;

    this.buildAmplifyUiBuilderClient(awsConfigInfo);
    this.buildAmplifyBackendClient(awsConfigInfo);
  }

  /**
   * Builds the Amplify UIBuilder Client
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildAmplifyUiBuilderClient(awsConfigInfo: any): void {
    const awsConfig = { ...awsConfigInfo };
    if (process.env.UI_BUILDER_ENDPOINT) {
      awsConfig.endpoint = process.env.UI_BUILDER_ENDPOINT;
    }

    if (process.env.UI_BUILDER_REGION) {
      awsConfig.region = process.env.UI_BUILDER_REGION;
    }

    this.#amplifyUiBuilder = new AmplifyUIBuilder(awsConfig);
  }

  /**
   * Builds the Amplify Backend Client
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private buildAmplifyBackendClient(awsConfigInfo: any): void {
    const awsConfig = { ...awsConfigInfo };
    if (process.env.AMPLIFY_BACKEND_ENDPOINT) {
      awsConfig.endpoint = process.env.AMPLIFY_BACKEND_ENDPOINT;
    }

    if (process.env.AMPLIFY_BACKEND_REGION) {
      awsConfig.region = process.env.AMPLIFY_BACKEND_REGION;
    }

    this.#amplifyBackend = new AmplifyBackend(awsConfig);
  }
}

const clientFactory = new AwsAmplifyClients();

export default clientFactory;
