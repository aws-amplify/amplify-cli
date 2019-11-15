function normalizeInputParams(context) {
  const inputParams = {};
  Object.keys(context.parameters.options).forEach(key => {
    const normalizedKey = normalizeKey(key);
    const normalizedValue = normalizeValue(normalizedKey, context.parameters.options[key]);
    inputParams[normalizedKey] = normalizedValue;
  });
  transform(inputParams);
  return inputParams;
}

function normalizeKey(key) {
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
}

function normalizeValue(key, value) {
  let normalizedValue = value;
  try {
    normalizedValue = JSON.parse(value);
  } catch (e) {
    // do nothing, allow plain string as input parameter.
  }
  return normalizedValue;
}

function transform(inputParams) {
  inputParams.amplify = inputParams.amplify || {};
  inputParams.providers = inputParams.providers || {};
  inputParams.frontend = inputParams.frontend || {};

  inputParams.amplify.providers = Object.keys(inputParams.providers);
  inputParams.amplify.frontend = inputParams.frontend.type || inputParams.frontend.frontend;

  if (inputParams.amplify.frontend) {
    delete inputParams.frontend.type;
    delete inputParams.frontend.frontend;
    inputParams[inputParams.amplify.frontend] = inputParams.frontend;
  }
  if (inputParams.amplify.providers.length > 0) {
    inputParams.amplify.providers.forEach(provider => {
      inputParams[provider] = inputParams.providers[provider];
    });
  }
  delete inputParams.frontend;
  delete inputParams.providers;
}

function normalizeProviderName(name, providerPluginList) {
  if (!providerPluginList || providerPluginList.length < 1) {
    return undefined;
  }
  name = providerPluginList.includes(name) ? name : undefined;
  return name;
}

function normalizeFrontendHandlerName(name, frontendPluginList) {
  if (!frontendPluginList || frontendPluginList.length < 1) {
    return undefined;
  }
  name = frontendPluginList.includes(name) ? name : undefined;
  return name;
}

module.exports = {
  normalizeInputParams,
  normalizeProviderName,
  normalizeFrontendHandlerName,
};
