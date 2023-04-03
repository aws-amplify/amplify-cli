export function externalAuthEnable(context: any, externalCategory: any, resourceName: any, requirements: any): Promise<any>;
export function migrateAuthResource(context: any, resourceName: any): Promise<boolean>;
export function checkRequirements(requirements: any, context: any, category: any, targetResourceName: any): Promise<{
    errors: string[];
    authEnabled?: undefined;
} | {
    authEnabled: boolean;
    errors?: undefined;
}>;
export function add(context: any, skipNextSteps?: boolean): Promise<any>;
import { migrate } from "./provider-utils/awscloudformation";
export function initEnv(context: any): Promise<void>;
declare function authConsole(context: any): Promise<any>;
export function getPermissionPolicies(context: any, resourceOpsMapping: any): Promise<{
    permissionPolicies: any[];
    resourceAttributes: any[];
}>;
export function executeAmplifyCommand(context: any): Promise<void>;
export function executeAmplifyHeadlessCommand(context: any, headlessPayload: string): Promise<void>;
export function handleAmplifyEvent(context: any, args: any): Promise<void>;
export function prePushAuthHook(context: any): Promise<void>;
import { uploadFiles } from "./provider-utils/awscloudformation/utils/trigger-file-uploader";
export const category: "auth";
export function importAuth(context: any): Promise<any>;
export function isSMSWorkflowEnabled(context: any, resourceName: any): Promise<boolean>;
import { AuthParameters } from "./provider-utils/awscloudformation/import/types";
import { getFrontendConfig } from "./provider-utils/awscloudformation/utils/amplify-meta-updaters";
import { generateAuthStackTemplate } from "./provider-utils/awscloudformation/utils/generate-auth-stack-template";
import { AmplifyAuthTransform } from "./provider-utils/awscloudformation/auth-stack-builder";
import { AmplifyUserPoolGroupTransform } from "./provider-utils/awscloudformation/auth-stack-builder";
export function transformCategoryStack(context: any, resource: any): Promise<void>;
declare function authPushYes(context: Object): Promise<void>;
import { getAuthTriggerStackCfnParameters } from "./provider-utils/awscloudformation/utils/get-auth-trigger-stack-cfn-parameters";
export { migrate, authConsole as console, uploadFiles, AuthParameters, getFrontendConfig, generateAuthStackTemplate, AmplifyAuthTransform, AmplifyUserPoolGroupTransform, authPushYes as authPluginAPIPush, getAuthTriggerStackCfnParameters };
//# sourceMappingURL=index.d.ts.map