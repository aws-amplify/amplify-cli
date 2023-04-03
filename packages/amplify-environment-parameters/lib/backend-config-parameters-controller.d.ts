import { ResourceTuple } from 'amplify-cli-core';
import { BackendParameters } from './backend-parameters';
export type IBackendParametersController = {
    save: () => Promise<void>;
    addParameter: (name: string, usedBy: ResourceTuple[]) => IBackendParametersController;
    addAllParameters: (parameterMap: BackendParameters) => IBackendParametersController;
    removeParameter: (name: string) => IBackendParametersController;
    removeAllParameters: () => IBackendParametersController;
    getParameters: () => Readonly<BackendParameters>;
};
export declare const getParametersControllerInstance: () => IBackendParametersController;
//# sourceMappingURL=backend-config-parameters-controller.d.ts.map