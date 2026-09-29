/* eslint-disable no-param-reassign */
import { $TSAny, $TSContext, $TSObject, JSONUtilities } from '@aws-amplify/amplify-cli-core';

/**
 * Normalizes the input parameters
 */
export const normalizeInputParams = (context: $TSContext): $TSObject => {
  const inputParams = {};
  Object.keys(context.parameters.options ?? {}).forEach((key) => {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeValue(context.parameters.options?.[key] as string);
    inputParams[normalizedKey] = normalizedValue;
  });
  transform(inputParams);
  return inputParams;
};

const normalizeKey = (key: string): string => {
  if (['y', 'yes'].includes(key)) {
    key = 'yes';
  }
  if (['a', 'amplify', 'amplify-config', 'amplifyConfig'].includes(key)) {
    key = 'amplify';
  }
  if (['p', 'provider', 'providers', 'providers-config', 'providersConfig'].includes(key)) {
    key = 'providers';
  }
  if (['f', 'frontend', 'frontend-config', 'frontendConfig'].includes(key)) {
    key = 'frontend';
  }
  return key;
};

const normalizeValue = (value: string): string => {
  let normalizedValue = value;
  try {
    normalizedValue = JSONUtilities.parse(value);
  } catch (e) {
    // do nothing, allow plain string as input parameter.
  }
  return normalizedValue;
};

const transform = (inputParams: $TSAny): void => {
  const headlessAmplify = !!inputParams.amplify;
  inputParams.amplify = inputParams.amplify || {};
  inputParams.providers = inputParams.providers || {};
  inputParams.frontend = inputParams.frontend || {};

  inputParams.amplify.providers = Object.keys(inputParams.providers);
  inputParams.amplify.frontend = inputParams.frontend.type || inputParams.frontend.frontend;
  inputParams.amplify.headless = headlessAmplify;

  if (inputParams.amplify.frontend) {
    delete inputParams.frontend.type;
    delete inputParams.frontend.frontend;
    inputParams[inputParams.amplify.frontend] = inputParams.frontend;
  }
  if (inputParams.amplify.providers.length > 0) {
    inputParams.amplify.providers.forEach((provider) => {
      inputParams[provider] = inputParams.providers[provider];
    });
  }
  delete inputParams.frontend;
  delete inputParams.providers;
};

/**
 * check if parameter is a valid provider
 */
export const normalizeProviderName = (name: string, providerPluginList?: string[]): string | undefined => {
  if (!providerPluginList || providerPluginList.length < 1) {
    return undefined;
  }
  return providerPluginList.includes(name) ? name : undefined;
};

/**
 * check if parameter is a valid frontend
 */
export const normalizeFrontendHandlerName = (name: string, frontendPluginList?: string[]): string | undefined => {
  if (!frontendPluginList || frontendPluginList.length < 1) {
    return undefined;
  }
  return frontendPluginList.includes(name) ? name : undefined;
};
