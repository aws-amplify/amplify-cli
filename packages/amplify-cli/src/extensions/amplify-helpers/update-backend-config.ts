import { $TSAny, $TSObject, stateManager } from 'amplify-cli-core';
import _ from 'lodash';

export function updateBackendConfigAfterResourceAdd(category: string, resourceName: string, options: $TSObject) {
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

export function updateBackendConfigAfterResourceUpdate(category: string, resourceName: string, attribute: string, value: $TSAny) {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  _.set(backendConfig, [category, resourceName, attribute], value);

  stateManager.setBackendConfig(undefined, backendConfig);
}

export function updateBackendConfigAfterResourceRemove(category: string, resourceName: string) {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
    default: {},
  });

  if (backendConfig[category] && backendConfig[category][resourceName] !== undefined) {
    delete backendConfig[category][resourceName];
  }

  stateManager.setBackendConfig(undefined, backendConfig);
}
