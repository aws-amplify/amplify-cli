import { $TSContext, ServiceSelection } from 'amplify-cli-core';
import { EnvSpecificResourceParameters, ImportAuthHeadlessParameters, MetaConfiguration, ProviderUtils, ResourceParameters } from './types';
import { ICognitoUserPoolService, IIdentityPoolService } from 'amplify-util-import';
export declare const importResource: (
  context: $TSContext,
  serviceSelection: ServiceSelection,
  previousResourceParameters: ResourceParameters | undefined,
  providerPluginInstance?: ProviderUtils | undefined,
  printSuccessMessage?: boolean,
) => Promise<
  | {
      envSpecificParameters: EnvSpecificResourceParameters;
    }
  | undefined
>;
export declare const importedAuthEnvInit: (
  context: $TSContext,
  resourceName: string,
  resource: MetaConfiguration,
  resourceParameters: ResourceParameters,
  providerName: string,
  providerUtils: ProviderUtils,
  currentEnvSpecificParameters: EnvSpecificResourceParameters,
  isInHeadlessMode: boolean,
  headlessParams: ImportAuthHeadlessParameters,
) => Promise<{
  doServiceWalkthrough?: boolean;
  succeeded?: boolean;
  envSpecificParameters?: EnvSpecificResourceParameters;
}>;
export declare const headlessImport: (
  context: $TSContext,
  cognito: ICognitoUserPoolService,
  identity: IIdentityPoolService,
  providerName: string,
  resourceName: string,
  resourceParameters: ResourceParameters,
  headlessParams: ImportAuthHeadlessParameters,
) => Promise<{
  succeeded: boolean;
  envSpecificParameters: EnvSpecificResourceParameters;
}>;
//# sourceMappingURL=index.d.ts.map
