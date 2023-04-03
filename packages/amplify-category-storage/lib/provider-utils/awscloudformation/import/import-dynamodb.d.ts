import { $TSContext, ServiceSelection } from 'amplify-cli-core';
import { DynamoDBEnvSpecificResourceParameters, DynamoDBMetaConfiguration, DynamoDBResourceParameters, ImportDynamoDBHeadlessParameters, ProviderUtils } from './types';
export declare const importDynamoDB: (context: $TSContext, serviceSelection: ServiceSelection, previousResourceParameters: DynamoDBResourceParameters | undefined, providerPluginInstance?: ProviderUtils, printSuccessMessage?: boolean) => Promise<{
    envSpecificParameters: DynamoDBEnvSpecificResourceParameters;
} | undefined>;
export declare const importedDynamoDBEnvInit: (context: $TSContext, resourceName: string, resource: DynamoDBMetaConfiguration, resourceParameters: DynamoDBResourceParameters, providerName: string, providerUtils: ProviderUtils, currentEnvSpecificParameters: DynamoDBEnvSpecificResourceParameters, isInHeadlessMode: boolean, headlessParams: ImportDynamoDBHeadlessParameters) => Promise<{
    doServiceWalkthrough?: boolean;
    succeeded?: boolean;
    envSpecificParameters?: DynamoDBEnvSpecificResourceParameters;
}>;
export declare const ensureHeadlessParameters: (resourceParameters: DynamoDBResourceParameters, headlessParams: ImportDynamoDBHeadlessParameters) => DynamoDBEnvSpecificResourceParameters;
//# sourceMappingURL=import-dynamodb.d.ts.map