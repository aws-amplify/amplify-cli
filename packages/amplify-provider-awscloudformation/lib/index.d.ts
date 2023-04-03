import { SSM } from './aws-utils/aws-ssm';
import { $TSContext } from 'amplify-cli-core';
export { resolveAppId } from './utils/resolve-appId';
export { storeCurrentCloudBackend } from './utils/upload-current-cloud-backend';
export { loadConfigurationForEnv } from './configuration-manager';
export { getLocationSupportedRegion, getLocationRegionMapping } from './aws-utils/aws-location';
export declare const cfnRootStackFileName = "root-cloudformation-stack.json";
export { storeRootStackTemplate } from './initializer';
export { transformResourceWithOverrides } from './override-manager';
export { rootStackFileName } from './push-resources';
import { LocationService } from './aws-utils/aws-location-service';
export { deleteEnvironmentParametersFromService } from './utils/ssm-utils/delete-ssm-parameters';
export { getEnvParametersUploadHandler, getEnvParametersDownloadHandler } from './utils/ssm-utils/env-parameter-ssm-helpers';
export declare function getConfiguredSSMClient(context: any): Promise<SSM>;
export declare function getConfiguredLocationServiceClient(context: $TSContext, options?: Record<string, unknown>): Promise<LocationService>;
//# sourceMappingURL=index.d.ts.map