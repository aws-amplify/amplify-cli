import { ICognitoUserPoolService, IIdentityPoolService } from '@aws-amplify/amplify-util-import';
import { $TSContext, ServiceSelection } from '@aws-amplify/amplify-cli-core';
import { EnvSpecificResourceParameters, ImportAuthHeadlessParameters, MetaConfiguration, ProviderUtils, ResourceParameters } from './types';
export declare const importResource: (context: $TSContext, serviceSelection: ServiceSelection, previousResourceParameters: ResourceParameters | undefined, providerPluginInstance?: ProviderUtils, printSuccessMessage?: boolean) => Promise<{
    envSpecificParameters: EnvSpecificResourceParameters;
} | undefined>;
export declare const importedAuthEnvInit: (context: $TSContext, resourceName: string, resource: MetaConfiguration, resourceParameters: ResourceParameters, providerName: string, providerUtils: ProviderUtils, currentEnvSpecificParameters: EnvSpecificResourceParameters, isInHeadlessMode: boolean, headlessParams: ImportAuthHeadlessParameters) => Promise<{
    doServiceWalkthrough?: boolean;
    succeeded?: boolean;
    resourceCleanupRequired?: boolean;
    envSpecificParameters?: EnvSpecificResourceParameters;
}>;
export declare const headlessImport: (context: $TSContext, cognito: ICognitoUserPoolService, identity: IIdentityPoolService, providerName: string, resourceName: string, resourceParameters: ResourceParameters, headlessParams: ImportAuthHeadlessParameters, currentEnvSpecificParameters: EnvSpecificResourceParameters) => Promise<{
    succeeded: boolean;
    resourceCleanupRequired?: boolean;
    envSpecificParameters?: EnvSpecificResourceParameters;
}>;
//# sourceMappingURL=index.d.ts.map