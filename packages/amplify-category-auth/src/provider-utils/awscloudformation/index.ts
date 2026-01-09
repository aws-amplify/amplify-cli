/* eslint-disable @typescript-eslint/no-explicit-any */
import inquirer from 'inquirer';
import _ from 'lodash';
import { stateManager, open, $TSContext, $TSObject, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { getAuthResourceName } from '../../utils/getAuthResourceName';
import { copyCfnTemplate, saveResourceParameters } from './utils/synthesize-resources';
import { ENV_SPECIFIC_PARAMS, AmplifyAdmin, UserPool, IdentityPool, BothPools, privateKeys } from './constants';
import { getAddAuthHandler, getUpdateAuthHandler } from './handlers/resource-handlers';
import { getSupportedServices } from '../supported-services';
import { importResource, importedAuthEnvInit } from './import';
import { AuthContext } from '../../context';
import { getOAuthObjectFromCognito } from './utils/get-oauth-secrets-from-cognito';

export { importResource } from './import';

const serviceQuestions = async (
  context: any,
  defaultValuesFilename: any,
  stringMapsFilename: any,
  serviceWalkthroughFilename: any,
  serviceMetadata: any,
): Promise<any> => {
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = await import(serviceWalkthroughSrc);
  return serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, serviceMetadata);
};

export const addResource = async (context: AuthContext, service: string): Promise<string> => {
  const serviceMetadata = getSupportedServices()[service];
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getAddAuthHandler(context)(
    await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata),
  );
};

export const updateResource = async (context: AuthContext, { service }: { service: any }): Promise<any> => {
  const serviceMetadata = getSupportedServices()[service];
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename } = serviceMetadata;
  return getUpdateAuthHandler(context)(
    await serviceQuestions(context, defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, serviceMetadata),
  );
};

export const updateConfigOnEnvInit = async (context: $TSContext, category: any, service: string): Promise<any> => {
  const serviceMetadata = getSupportedServices().Cognito;
  const { defaultValuesFilename, stringMapsFilename, serviceWalkthroughFilename, provider } = serviceMetadata;

  const providerPlugin = context.amplify.getPluginInstance(context, provider);
  await ensureEnvParamManager();
  // previously selected answers
  const resourceParams = providerPlugin.loadResourceParameters(context, 'auth', service);
  // ask only env specific questions
  let currentEnvSpecificValues = context.amplify.loadEnvResourceParameters(context, category, service);

  const resource = _.get(context.exeInfo, ['amplifyMeta', category, service]);

  // Imported auth resource behavior is different from Amplify managed resources, as
  // they are immutable and all parameters and values are derived from the currently
  // cloud deployed values.
  if (resource && resource.serviceType === 'imported') {
    let envSpecificParametersResult;
    const { doServiceWalkthrough, succeeded, resourceCleanupRequired, envSpecificParameters } = await importedAuthEnvInit(
      context,
      service,
      resource,
      resourceParams,
      provider,
      providerPlugin,
      currentEnvSpecificValues,
      isInHeadlessMode(context),
      isInHeadlessMode(context) ? getHeadlessParams(context) : {},
    );

    // No need for headless check as this will never be true for headless
    if (doServiceWalkthrough === true) {
      const importResult = await importResource(
        context,
        {
          providerName: provider,
          // this coercion was done to avoid making `provider` on the ServiceSelection type nullable, a larger, potentially breaking change.
          // Once ServiceSelection is refactored, this should be removed, and provider should be set to undefined without type coercion.
          provider: undefined as unknown as string, // We don't have the resolved directory of the provider we pass in an instance
          service: 'Cognito',
        },
        resourceParams,
        providerPlugin,
        false,
      );

      if (importResult) {
        envSpecificParametersResult = importResult.envSpecificParameters;
      } else {
        throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
      }
    } else if (succeeded) {
      if (resourceCleanupRequired) {
        // returning undefined as auth resource cleanup required
        return {};
      }
      envSpecificParametersResult = envSpecificParameters;
    } else {
      throw new Error('There was an error importing the previously configured auth configuration to the new environment.');
    }

    // If the imported resource was synced up to the cloud before, copy over the timestamp since frontend generation
    // and other pieces of the CLI could rely on the presence of a value, if no timestamp was found for the same
    // resource, then do nothing as push will assign one.
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const meta = stateManager.getMeta(undefined, {
        throwIfNotExist: false,
      });

      const cloudTimestamp = _.get(currentMeta, [category, service, 'lastPushTimeStamp'], undefined);

      if (cloudTimestamp) {
        resource.lastPushTimeStamp = cloudTimestamp;
      } else {
        resource.lastPushTimeStamp = new Date();
      }

      _.setWith(meta, [category, service, 'lastPushTimeStamp'], cloudTimestamp);
      stateManager.setMeta(undefined, meta);
    }

    return envSpecificParametersResult;
  }

  const { hostedUIProviderMeta } = resourceParams;

  if (hostedUIProviderMeta) {
    currentEnvSpecificValues = getOAuthProviderKeys(currentEnvSpecificValues, resourceParams);
    const authParamsFromCognito = await getOAuthObjectFromCognito(context, resourceParams.userPoolName);
    // fill in the OAuthProvider Keys from userpool if missing from currentEnvValues
    if (authParamsFromCognito) {
      currentEnvSpecificValues = {
        ...getOAuthProviderKeys({ hostedUIProviderCreds: JSON.stringify(authParamsFromCognito) }, resourceParams),
        ...currentEnvSpecificValues,
      };
    }
  }

  // legacy headless mode (only supports init)
  if (isInHeadlessMode(context)) {
    const envParams: $TSObject = {};
    let mergedValues: $TSObject | undefined;
    if (resourceParams.thirdPartyAuth || hostedUIProviderMeta) {
      const authParams = getHeadlessParams(context);
      const projectType = context.amplify.getProjectConfig().frontend;
      mergedValues = { ...resourceParams, ...authParams, ...currentEnvSpecificValues };
      const requiredParams = getRequiredParamsForHeadlessInit(projectType, resourceParams);
      const missingParams: any[] = [];
      requiredParams.forEach((param: any) => {
        if (Object.keys(mergedValues ?? {}).includes(param)) {
          envParams[param] = mergedValues?.[param];
        } else {
          missingParams.push(param);
        }
      });

      if (missingParams.length) {
        throw new AmplifyError('InputValidationError', {
          message: `auth headless is missing the following inputParameters ${missingParams.join(', ')}`,
          link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
        });
      }
    }
    if (hostedUIProviderMeta) {
      parseCredsForHeadless(mergedValues, envParams);
    }
    return envParams;
  }

  const isPullingOrEnv =
    context.input.command === 'pull' ||
    (context.input.command === 'env' && context.input.subCommands && !context.input.subCommands.includes('add'));
  // don't ask for env_specific params when checking out env or pulling
  serviceMetadata.inputs = serviceMetadata.inputs.filter(
    (input: any) =>
      ENV_SPECIFIC_PARAMS.includes(input.key) && !Object.keys(currentEnvSpecificValues).includes(input.key) && !isPullingOrEnv,
  );

  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  const { serviceWalkthrough } = await import(serviceWalkthroughSrc);

  // interactive mode
  const result = await serviceWalkthrough(context, defaultValuesFilename, stringMapsFilename, serviceMetadata, resourceParams);
  let envParams: { [key: string]: any } = {};

  if (resourceParams.hostedUIProviderMeta) {
    envParams = formatCredentialsForEnvParams(currentEnvSpecificValues, result, resourceParams);
  }

  ENV_SPECIFIC_PARAMS.forEach((paramName) => {
    if (paramName in result && paramName !== 'hostedUIProviderCreds' && privateKeys.indexOf(paramName) === -1) {
      envParams[paramName] = result[paramName];
    }
  });

  return envParams;
};

export const migrate = async (context: $TSContext): Promise<void> => {
  const category = 'auth';
  const { amplify } = context;
  const existingAuth = context.migrationInfo.amplifyMeta.auth || {};
  if (!(Object.keys(existingAuth).length > 0)) {
    return;
  }
  const { provider, cfnFilename, defaultValuesFilename } = getSupportedServices().Cognito;
  const defaultValuesSrc = `${__dirname}/assets/${defaultValuesFilename}`;

  const { roles } = await import(defaultValuesSrc);

  const providerInstance = amplify.getPluginInstance(context, provider);
  const resourceName = await getAuthResourceName(context);
  const props = providerInstance.loadResourceParameters(context, 'auth', resourceName);
  // Roles have changed to ref. Removing old hard-coded role ref
  Object.keys(roles).forEach((key) => {
    delete props[key];
  });
  await copyCfnTemplate(context, category, props, cfnFilename);
  saveResourceParameters(context, provider, category, resourceName, { ...roles, ...props }, ENV_SPECIFIC_PARAMS);
};

const isInHeadlessMode = (context: $TSContext): any => context.exeInfo.inputParams.yes;

const getHeadlessParams = (context: $TSContext): any => {
  const { inputParams } = context.exeInfo;
  try {
    // If the input given is a string validate it using JSON parse
    const { categories = {} } = typeof inputParams === 'string' ? JSON.parse(inputParams) : inputParams;
    return categories.auth || {};
  } catch (err) {
    throw new Error(`Failed to parse auth headless parameters: ${err}`);
  }
};

/* eslint-disable no-param-reassign */
const getOAuthProviderKeys = (currentEnvSpecificValues: any, resourceParams: any): any => {
  const oAuthProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map((h: any) => h.ProviderName);
  const { hostedUIProviderCreds = '[]' } = currentEnvSpecificValues;
  const configuredProviders = JSON.parse(hostedUIProviderCreds).map((h: any) => h.ProviderName);
  const deltaProviders = _.intersection(oAuthProviders, configuredProviders);
  deltaProviders.forEach((provider: any) => {
    const lowerCaseProvider = provider.toLowerCase();
    if (provider === 'SignInWithApple') {
      currentEnvSpecificValues[`${lowerCaseProvider}ClientIdUserPool`] = configuredProviders[`${lowerCaseProvider}ClientIdUserPool`];
      currentEnvSpecificValues[`${lowerCaseProvider}TeamIdUserPool`] = configuredProviders[`${lowerCaseProvider}TeamIdUserPool`];
      currentEnvSpecificValues[`${lowerCaseProvider}KeyIdUserPool`] = configuredProviders[`${lowerCaseProvider}KeyIdUserPool`];
      currentEnvSpecificValues[`${lowerCaseProvider}PrivateKeyUserPool`] = configuredProviders[`${lowerCaseProvider}PrivateKeyUserPool`];
    } else {
      currentEnvSpecificValues[`${lowerCaseProvider}AppIdUserPool`] = configuredProviders[`${lowerCaseProvider}AppIdUserPool`];
      currentEnvSpecificValues[`${lowerCaseProvider}AppSecretUserPool`] = configuredProviders[`${lowerCaseProvider}AppSecretUserPool`];
    }
  });
  return currentEnvSpecificValues;
};
/* eslint-enable no-param-reassign */

const formatCredentialsForEnvParams = (currentEnvSpecificValues: any, result: any, resourceParams: any): any => {
  const partialParams: { [key: string]: any } = {};
  if (currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = [];
    const inputResult = JSON.parse(result.hostedUIProviderCreds);
    const previousResult = JSON.parse(currentEnvSpecificValues.hostedUIProviderCreds);
    if (resourceParams.hostedUIProviderMeta) {
      const currentProviders = JSON.parse(resourceParams.hostedUIProviderMeta).map((h: any) => h.ProviderName);
      currentProviders.forEach((currentProvider: any) => {
        const previousProvider = previousResult.find((provider: any) => provider.ProviderName === currentProvider);
        const resultProvider = inputResult.find((provider: any) => provider.ProviderName === currentProvider);
        partialParams.hostedUIProviderCreds.push(Object.assign(resultProvider, previousProvider));
      });
      partialParams.hostedUIProviderCreds = JSON.stringify(partialParams.hostedUIProviderCreds);
    }
  } else if (currentEnvSpecificValues.hostedUIProviderCreds && !result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = currentEnvSpecificValues.hostedUIProviderCreds;
  } else if (!currentEnvSpecificValues.hostedUIProviderCreds && result.hostedUIProviderCreds) {
    partialParams.hostedUIProviderCreds = result.hostedUIProviderCreds;
  }
  return partialParams;
};

/* eslint-disable no-param-reassign */
const parseCredsForHeadless = (mergedValues: any, envParams: any): any => {
  const oAuthProviders = JSON.parse(mergedValues.hostedUIProviderMeta).map((h: any) => h.ProviderName);
  envParams.hostedUIProviderCreds = JSON.stringify(
    oAuthProviders.map((provider: any) => {
      const lowerCaseProvider = provider.toLowerCase();
      if (provider === 'SignInWithApple') {
        return {
          ProviderName: provider,
          client_id: mergedValues[`${lowerCaseProvider}ClientIdUserPool`],
          team_id: mergedValues[`${lowerCaseProvider}TeamIdUserPool`],
          key_id: mergedValues[`${lowerCaseProvider}KeyIdUserPool`],
          private_key: mergedValues[`${lowerCaseProvider}PrivateKeyUserPool`],
        };
      }
      return {
        ProviderName: provider,
        client_id: mergedValues[`${lowerCaseProvider}AppIdUserPool`],
        client_secret: mergedValues[`${lowerCaseProvider}AppSecretUserPool`],
      };
    }),
  );
  oAuthProviders.forEach((provider: any) => {
    const lowerCaseProvider = provider.toLowerCase();
    if (provider === 'SignInWithApple') {
      delete envParams[`${lowerCaseProvider}ClientIdUserPool`];
      delete envParams[`${lowerCaseProvider}TeamIdUserPool`];
      delete envParams[`${lowerCaseProvider}KeyIdUserPool`];
      delete envParams[`${lowerCaseProvider}PrivateKeyUserPool`];
    } else {
      delete envParams[`${lowerCaseProvider}AppIdUserPool`];
      delete envParams[`${lowerCaseProvider}AppSecretUserPool`];
    }
  });
};
/* eslint-enable no-param-reassign */

const getRequiredParamsForHeadlessInit = (projectType: any, previousValues: any): any => {
  const requiredParams: string[] = [];

  if (previousValues.thirdPartyAuth) {
    const authProviders = previousValues.authProviders ?? [];
    if (authProviders.includes('accounts.google.com')) {
      requiredParams.push('googleClientId');
      if (projectType === 'ios') {
        requiredParams.push('googleIos');
      }
      if (projectType === 'android') {
        requiredParams.push('googleAndroid');
      }
    }
    if (authProviders.includes('graph.facebook.com')) {
      requiredParams.push('facebookAppId');
    }
    if (authProviders.includes('www.amazon.com')) {
      requiredParams.push('amazonAppId');
    }
    // eslint-disable-next-line spellcheck/spell-checker
    if (authProviders.includes('appleid.apple.com')) {
      requiredParams.push('appleAppId');
    }
  }

  if (previousValues.hostedUIProviderMeta) {
    const oAuthProviders = JSON.parse(previousValues.hostedUIProviderMeta).map((hostedUIProvider: any) => hostedUIProvider.ProviderName);
    if (oAuthProviders && oAuthProviders.length > 0) {
      oAuthProviders.forEach((provider: any) => {
        const lowerCaseProvider = provider.toLowerCase();
        // Everything but SIWA is required because the private key isn't returned by Cognito
        // so we can't initialize SIWA in a new environment programmatically.
        // User will have to reconfigure SIWA through Admin UI or CLI.
        if (provider !== 'SignInWithApple') {
          requiredParams.push(`${lowerCaseProvider}AppIdUserPool`);
          requiredParams.push(`${lowerCaseProvider}AppSecretUserPool`);
        }
      });
    }
  }
  return requiredParams;
};

export const console = async (context: $TSContext, amplifyMeta: any): Promise<any> => {
  const cognitoOutput = getCognitoOutput(amplifyMeta);
  if (cognitoOutput) {
    const { AmplifyAppId, Region } = amplifyMeta.providers.awscloudformation;
    if (cognitoOutput.UserPoolId && cognitoOutput.IdentityPoolId) {
      let choices = [UserPool, IdentityPool, BothPools];
      let isAdminApp = false;
      let region;
      if (AmplifyAppId) {
        const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
        const res = await providerPlugin.isAmplifyAdminApp(AmplifyAppId);
        isAdminApp = res.isAdminApp;
        region = res.region;
      }

      if (isAdminApp) {
        if (region !== Region) {
          context.print.warning(`Region mismatch: Amplify service returned '${region}', but found '${Region}' in amplify-meta.json.`);
        }
        if (!AmplifyAppId) {
          throw new Error('Missing AmplifyAppId in amplify-meta.json');
        }
        choices = [AmplifyAdmin, ...choices];
      }

      const answer = await inquirer.prompt({
        name: 'selection',
        type: 'list',
        message: 'Which console',
        choices,
        default: isAdminApp ? AmplifyAdmin : BothPools,
      });

      switch (answer.selection) {
        case AmplifyAdmin:
          await openAdminUI(context, AmplifyAppId, Region);
          break;
        case UserPool:
          await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
          break;
        case IdentityPool:
          await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
          break;
        case BothPools:
        default:
          await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
          await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
          break;
      }
    } else if (cognitoOutput.UserPoolId) {
      await openUserPoolConsole(context, Region, cognitoOutput.UserPoolId);
    } else {
      await openIdentityPoolConsole(context, Region, cognitoOutput.IdentityPoolId);
    }
    context.print.info('');
  } else {
    context.print.error('Amazon Cognito resources have NOT been created for your project.');
  }
};

const getCognitoOutput = (amplifyMeta: any): any => {
  let cognitoOutput;
  const categoryMeta = amplifyMeta.auth;
  const services = Object.keys(categoryMeta);
  for (let i = 0; i < services.length; i += 1) {
    const serviceMeta = categoryMeta[services[i]];
    if (serviceMeta.service === 'Cognito' && serviceMeta.output && (serviceMeta.output.UserPoolId || serviceMeta.output.IdentityPoolId)) {
      cognitoOutput = serviceMeta.output;
      break;
    }
  }
  return cognitoOutput;
};

const openAdminUI = async (context: $TSContext, appId: string, region: string): Promise<any> => {
  const { envName } = context.amplify.getEnvInfo();
  const providerPlugin = await import(context.amplify.getProviderPlugins(context).awscloudformation);
  const baseUrl = providerPlugin.adminBackendMap[region].amplifyAdminUrl;
  const adminUrl = `${baseUrl}/admin/${appId}/${envName}/auth`;
  await open(adminUrl, { wait: false });
  context.print.success(adminUrl);
};

const openUserPoolConsole = async (context: $TSContext, region: string, userPoolId: string): Promise<void> => {
  const userPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/v2/idp/user-pools/${userPoolId}/users?region=${region}`;
  await open(userPoolConsoleUrl, { wait: false });
  context.print.info('User Pool console:');
  context.print.success(userPoolConsoleUrl);
};

const openIdentityPoolConsole = async (context: $TSContext, region: string, identityPoolId: string): Promise<void> => {
  const identityPoolConsoleUrl = `https://${region}.console.aws.amazon.com/cognito/pool/?region=${region}&id=${identityPoolId}`;
  await open(identityPoolConsoleUrl, { wait: false });
  context.print.info('Identity Pool console:');
  context.print.success(identityPoolConsoleUrl);
};

export const getPermissionPolicies = (context: $TSContext, service: string, resourceName: string, crudOptions: any): any => {
  const { serviceWalkthroughFilename } = getSupportedServices()[service];
  const serviceWalkthroughSrc = `${__dirname}/service-walkthroughs/${serviceWalkthroughFilename}`;
  /* eslint-disable */
  const { getIAMPolicies } = require(serviceWalkthroughSrc);
  /* eslint-enable */

  if (!getPermissionPolicies) {
    context.print.info(`No policies found for ${resourceName}`);
    return undefined;
  }

  return getIAMPolicies(context, resourceName, crudOptions);
};
