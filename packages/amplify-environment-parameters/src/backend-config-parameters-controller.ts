import {
  ResourceTuple,
  stateManager,
  AmplifyError,
} from 'amplify-cli-core';
import Ajv from 'ajv';
import { BackendParameters } from './backend-parameters';
import parameterMapSchema from './schemas/BackendParameters.schema.json';

/**
 * Interface for controller that maps parameters to resources that depend on those parameters
 */
export type IBackendParametersController = {
  save: () => Promise<void>,
  addParameter: (name: string, usedBy: ResourceTuple[]) => IBackendParametersController,
  addAllParameters: (parameterMap: BackendParameters) => IBackendParametersController,
  removeParameter: (name: string) => IBackendParametersController,
  removeAllParameters: () => IBackendParametersController,
  getParameters: () => Readonly<BackendParameters>,
}

let localBackendParametersController: IBackendParametersController;

/**
 * Get a singleton instance of an IParameterMapController
 *
 * The underlying instance is an instance of LocalBackendParametersController
 */
export const getParametersControllerInstance = (): IBackendParametersController => {
  if (localBackendParametersController === undefined) {
    localBackendParametersController = new LocalBackendParametersController(backendConfigParameterMapSupplier());
  }
  return localBackendParametersController;
};

/**
 * Implementation of IBackendParametersController that writes the parameter map to the `backend-config.json` file
 */
class LocalBackendParametersController implements IBackendParametersController {
  constructor(private parameterMap: BackendParameters) {}

  async save(): Promise<void> {
    // if there's no backend config file assume that the project has been deleted or something else has failed
    if (!stateManager.backendConfigFileExists()) {
      return;
    }
    const backendConfig = stateManager.getBackendConfig(undefined, undefined, true);
    if (Object.keys(this.parameterMap).length === 0) {
      delete backendConfig.parameters;
    } else {
      backendConfig.parameters = this.parameterMap;
    }
    stateManager.setBackendConfig(undefined, backendConfig);
  }

  addParameter(name: string, usedBy: ResourceTuple[]): IBackendParametersController {
    this.parameterMap[name] = {
      usedBy,
    };
    return this;
  }

  addAllParameters(parameterMap: BackendParameters): IBackendParametersController {
    Object.entries(parameterMap).forEach(([parameterName, parameterConfig]) => {
      this.parameterMap[parameterName] = parameterConfig;
    });
    return this;
  }

  removeParameter(name: string): IBackendParametersController {
    delete this.parameterMap[name];
    return this;
  }

  removeAllParameters(): IBackendParametersController {
    this.parameterMap = {};
    return this;
  }

  getParameters(): Readonly<BackendParameters> {
    return this.parameterMap;
  }
}

const backendConfigParameterMapSupplier = (): BackendParameters => {
  const uncheckedParamMap = stateManager.getBackendConfig(undefined, { throwIfNotExist: false }, true)?.parameters || {};
  const ajv = new Ajv();
  const validator = ajv.compile(parameterMapSchema);
  if (!validator(uncheckedParamMap)) {
    // throw new Error('test');
    throw new AmplifyError('BackendConfigValidationError', {
      message: `backend-config.json parameter config is invalid`,
      resolution: 'Correct the errors in the file and retry the command',
      details: validator.errors?.map(err => JSON.stringify(err, undefined, 2)).join('\n'),
    });
  }
  return uncheckedParamMap as BackendParameters;
};
