import _ from 'lodash';
import { stateManager } from 'amplify-cli-core';

export function updateBackendConfigAfterResourceAdd(category, resourceName, options) {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  if (!backendConfig[category]) {
    backendConfig[category] = {};
  }

  if (!backendConfig[category][resourceName]) {
    backendConfig[category][resourceName] = {};
  }

  backendConfig[category][resourceName] = options;

  stateManager.setBackendConfig(undefined, backendConfig);
}

export function updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value) {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  _.set(backendConfig, [category, resourceName, attribute], value);

  stateManager.setBackendConfig(undefined, backendConfig);
}

export function updateBackendConfigAfterResourceRemove(category, resourceName) {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  if (backendConfig[category] && backendConfig[category][resourceName] !== undefined) {
    delete backendConfig[category][resourceName];
  }

  stateManager.setBackendConfig(undefined, backendConfig);
}
