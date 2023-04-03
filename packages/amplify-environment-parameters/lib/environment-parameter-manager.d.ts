import { IAmplifyResource } from 'amplify-cli-core';
import { ResourceParameterManager } from './resource-parameter-manager';
export declare const ensureEnvParamManager: (envName?: string) => Promise<{
    instance: IEnvironmentParameterManager;
}>;
export declare const getEnvParamManager: (envName?: string) => IEnvironmentParameterManager;
export declare const saveAll: (serviceUploadHandler?: ServiceUploadHandler) => Promise<void>;
export type IEnvironmentParameterManager = {
    cloneEnvParamsToNewEnvParamManager: (destManager: IEnvironmentParameterManager) => Promise<void>;
    downloadParameters: (downloadHandler: ServiceDownloadHandler) => Promise<void>;
    getMissingParameters: (resourceFilterList?: IAmplifyResource[]) => Promise<{
        categoryName: string;
        resourceName: string;
        parameterName: string;
    }[]>;
    getResourceParamManager: (category: string, resource: string) => ResourceParameterManager;
    hasResourceParamManager: (category: string, resource: string) => boolean;
    init: () => Promise<void>;
    removeResourceParamManager: (category: string, resource: string) => void;
    save: (serviceUploadHandler?: ServiceUploadHandler) => Promise<void>;
    verifyExpectedEnvParameters: (resourceFilterList?: IAmplifyResource[]) => Promise<void>;
};
export type ServiceUploadHandler = (key: string, value: string | number | boolean) => Promise<void>;
export type ServiceDownloadHandler = (parameters: string[]) => Promise<Record<string, string | number | boolean>>;
//# sourceMappingURL=environment-parameter-manager.d.ts.map