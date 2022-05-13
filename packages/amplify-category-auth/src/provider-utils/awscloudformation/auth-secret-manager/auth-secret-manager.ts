import { $TSContext, spinner, stateManager } from 'amplify-cli-core';
import aws from 'aws-sdk';
import { getFullyQualifiedSecretName, oauthObjSecretKey } from './secret-name';

/**
 * Manages the state of OAuth secrets in AWS ParameterStore
 */
export class OAuthSecretsStateManager {
  private static instance: OAuthSecretsStateManager;
  private oAuthSecretKey: string;

  static getInstance = async (context: $TSContext): Promise<OAuthSecretsStateManager> => {
    if (!OAuthSecretsStateManager.instance) {
      OAuthSecretsStateManager.instance = new OAuthSecretsStateManager(context, await getSSMClient(context));
    }
    return OAuthSecretsStateManager.instance;
  };

  private constructor(private readonly context: $TSContext, private readonly ssmClient: aws.SSM) {
  }

  /**
 * Set OAuth secret in parameter with
 * key :
 */
  setOAuthSecrets = async (hostedUISecretObj: string, resourceName: string): Promise<void> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oauthObjSecretKey, resourceName, envName);
    const secretValue = hostedUISecretObj;
    try {
      spinner.start();
      spinner.text = 'Setting OAuth Secrets into cloud';
      await this.ssmClient
        .putParameter({
          Name: secretName,
          Value: secretValue,
          Type: 'SecureString',
          Overwrite: true,
        }).promise();
    } finally {
      spinner.stop();
    }
  }

  /**
   * get the specified OAuth secrets from parameter store
   */
  getOAuthSecrets = async (resourceName: string): Promise<string | undefined> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oauthObjSecretKey, resourceName, envName);
    let secretValue;
    try {
      spinner.start();
      spinner.text = 'Sync OAuth Secrets';
      const parameter = await this.ssmClient
        .getParameter({
          Name: secretName,
          WithDecryption: true,
        })
        .promise();
      secretValue = parameter.Parameter?.Value;
    } catch (err) {
      return undefined;
    } finally {
      spinner.stop();
    }
    return secretValue;
  }
}

const getSSMClient = async (context: $TSContext): Promise<aws.SSM> => {
  try {
    spinner.start();
    spinner.text = 'Setting OAuth Secrets';

    const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', [
      context,
    ]);

    return client as aws.SSM;
  } finally {
    spinner.stop();
  }
};
