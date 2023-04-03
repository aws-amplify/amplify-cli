import { $TSContext, ServiceSelection } from 'amplify-cli-core';
import { ImportS3HeadlessParameters, ProviderUtils, S3BackendConfiguration, S3EnvSpecificResourceParameters, S3ImportAnswers, S3ImportParameters, S3MetaConfiguration, S3ResourceParameters } from './types';
export declare const importS3: (context: $TSContext, serviceSelection: ServiceSelection, previousResourceParameters: S3ResourceParameters | undefined, providerPluginInstance?: ProviderUtils, printSuccessMessage?: boolean) => Promise<{
    envSpecificParameters: S3EnvSpecificResourceParameters;
} | undefined>;
export declare const updateStateFiles: (context: $TSContext, questionParameters: S3ImportParameters, answers: S3ImportAnswers, updateEnvSpecificParameters: boolean) => Promise<{
    backendConfiguration: S3BackendConfiguration;
    resourceParameters: S3ResourceParameters;
    metaConfiguration: S3MetaConfiguration;
    envSpecificParameters: S3EnvSpecificResourceParameters;
}>;
export declare const importedS3EnvInit: (context: $TSContext, resourceName: string, resource: S3MetaConfiguration, resourceParameters: S3ResourceParameters, providerName: string, providerUtils: ProviderUtils, currentEnvSpecificParameters: S3EnvSpecificResourceParameters, isInHeadlessMode: boolean, headlessParams: ImportS3HeadlessParameters) => Promise<{
    doServiceWalkthrough?: boolean;
    succeeded?: boolean;
    envSpecificParameters?: S3EnvSpecificResourceParameters;
}>;
export declare const ensureHeadlessParameters: (headlessParams: ImportS3HeadlessParameters) => S3EnvSpecificResourceParameters;
//# sourceMappingURL=import-s3.d.ts.map