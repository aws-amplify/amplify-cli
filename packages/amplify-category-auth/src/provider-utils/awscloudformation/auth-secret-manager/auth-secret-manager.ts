import { $TSContext, stateManager } from 'amplify-cli-core';
import aws from 'aws-sdk';
import { getFullyQualifiedSecretName, oAuthObjSecretKey } from './secret-name';

/**
 * Manages the state of OAuth secrets in AWS ParameterStore
 */
export class OAuthSecretsStateManager {
  private static instance: OAuthSecretsStateManager;

  static getInstance = async (context: $TSContext): Promise<OAuthSecretsStateManager> => {
    if (!OAuthSecretsStateManager.instance) {
      OAuthSecretsStateManager.instance = new OAuthSecretsStateManager(await getSSMClient(context));
    }
    return OAuthSecretsStateManager.instance;
  };

  private constructor(private readonly ssmClient: aws.SSM) {
  }

  /**
   * Set OAuth secret in parameter
   */
  setOAuthSecrets = async (hostedUISecretObj: string, resourceName: string): Promise<void> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oAuthObjSecretKey, resourceName, envName);
    const secretValue = hostedUISecretObj;
    await this.ssmClient
      .putParameter({
        Name: secretName,
        Value: secretValue,
        Type: 'SecureString',
        Overwrite: true,
      }).promise();
  }

  /**
   * checks if the specified OAuth secrets exists in parameter store
   */
  hasOAuthSecrets = async (resourceName: string): Promise<boolean> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oAuthObjSecretKey, resourceName, envName);
    try {
      await this.ssmClient
        .getParameter({
          Name: secretName,
          WithDecryption: true,
        })
        .promise();
    } catch (err) {
      return false;
    }
    return true;
  }

  /**
   * get the specified OAuth secrets from parameter store
   */
  getOAuthSecrets = async (resourceName: string): Promise<string | undefined> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oAuthObjSecretKey, resourceName, envName);
    const parameter = await this.ssmClient
      .getParameter({
        Name: secretName,
        WithDecryption: true,
      })
      .promise();
    return parameter.Parameter?.Value;
  }

  /**
   * remove the specified OAuth secrets from parameter store
   */
  removeOAuthSecrets = async (resourceName: string): Promise<void> => {
    const { envName } = stateManager.getLocalEnvInfo();
    const secretName = getFullyQualifiedSecretName(oAuthObjSecretKey, resourceName, envName);
    try {
      await this.ssmClient
        .deleteParameter({
          Name: secretName,
        })
        .promise();
    } catch (err) {
      // parameter doesn't exist status code
      if (err.statusCode !== 400) {
        throw err;
      }
    }
  };
}

const getSSMClient = async (context: $TSContext): Promise<aws.SSM> => {
  const { client } = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', [
    context,
  ]);
  return client as aws.SSM;
};
