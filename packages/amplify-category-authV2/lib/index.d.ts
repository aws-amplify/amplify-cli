export function externalAuthEnable(context: any, externalCategory: any, resourceName: any, requirements: any): Promise<any>;
export function checkRequirements(
  requirements: any,
  context: any,
  category: any,
  targetResourceName: any,
): Promise<
  | {
      errors: string[];
      authEnabled?: undefined;
    }
  | {
      authEnabled: boolean;
      errors?: undefined;
    }
>;
export function add(context: any): Promise<any>;
import { migrate } from './provider-utils/awscloudformation';
export function initEnv(context: any): Promise<void>;
export function console(context: any): Promise<any>;
export function getPermissionPolicies(
  context: any,
  resourceOpsMapping: any,
): Promise<{
  permissionPolicies: any[];
  resourceAttributes: any[];
}>;
export function executeAmplifyCommand(context: any): Promise<void>;
export function executeAmplifyHeadlessCommand(context: any, headlessPayload: string): Promise<void>;
export function handleAmplifyEvent(context: any, args: any): Promise<void>;
export function prePushAuthHook(context: any): Promise<void>;
import { uploadFiles } from './provider-utils/awscloudformation/utils/trigger-file-uploader';
export const category: 'auth';
export function importAuth(context: any): Promise<any>;
export function isSMSWorkflowEnabled(context: any, resourceName: any): Promise<boolean>;
export { migrate, uploadFiles };
//# sourceMappingURL=index.d.ts.map
