import {
  ResourceTuple,
  stateManager,
  AmplifyError,
} from 'amplify-cli-core';
import Ajv from 'ajv';
import { ParameterMap } from './parameter-map';
import parameterMapSchema from './schemas/ParameterMap.schema.json';

/**
 * Interface for controller that maps parameters to resources that depend on those parameters
 */
export type IParameterMapController = {
  save: () => Promise<void>,
  addParameter: (name: string, usedBy: ResourceTuple[]) => IParameterMapController,
  addAllParameters: (parameterMap: ParameterMap) => IParameterMapController,
  removeParameter: (name: string) => IParameterMapController,
  removeAllParameters: () => IParameterMapController,
  getParameters: () => Readonly<ParameterMap>,
}

let backendConfigParametersControllerInstance: IParameterMapController;

/**
 * Get a singleton instance of an IParameterMapController that uses the `backend-config.json` file to store the mapping
 */
export const getBackendConfigParametersControllerSingleton = (): IParameterMapController => {
  if (backendConfigParametersControllerInstance === undefined) {
    backendConfigParametersControllerInstance = new BackendConfigParameterMapController(backendConfigParameterMapSupplier());
  }
  return backendConfigParametersControllerInstance;
};

class BackendConfigParameterMapController implements IParameterMapController {
  constructor(private parameterMap: ParameterMap) {}

  async save(): Promise<void> {
    if (Object.keys(this.parameterMap).length === 0) {
      return;
    }
    const backendConfig = stateManager.getBackendConfig(undefined, undefined, true);
    backendConfig.parameters = this.parameterMap;
    stateManager.setBackendConfig(undefined, backendConfig);
  }

  addParameter(name: string, usedBy: ResourceTuple[]): IParameterMapController {
    this.parameterMap[name] = {
      usedBy,
    };
    return this;
  }

  addAllParameters(parameterMap: ParameterMap): IParameterMapController {
    Object.entries(parameterMap).forEach(([parameterName, parameterConfig]) => {
      this.parameterMap[parameterName] = parameterConfig;
    });
    return this;
  }

  removeParameter(name: string): IParameterMapController {
    delete this.parameterMap[name];
    return this;
  }

  removeAllParameters(): IParameterMapController {
    this.parameterMap = {};
    return this;
  }

  getParameters(): Readonly<ParameterMap> {
    return this.parameterMap;
  }
}

const backendConfigParameterMapSupplier = (): ParameterMap => {
  const uncheckedParamMap = stateManager.getBackendConfig()?.parameters || {};
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
  return uncheckedParamMap as ParameterMap;
};
