"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3PermissionFromHeadlessParams = exports.buildTriggerFunctionParams = exports.buildS3UserInputFromHeadlessUpdateStorageRequest = exports.buildS3UserInputFromHeadlessStorageRequest = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_headless_interface_1 = require("amplify-headless-interface");
const __1 = require("../..");
const s3_defaults_1 = require("./default-values/s3-defaults");
const s3_user_input_types_1 = require("./service-walkthrough-types/s3-user-input-types");
const uuid_1 = require("uuid");
function buildS3UserInputFromHeadlessStorageRequest(context, storageRequest) {
    var _a;
    const headlessS3Config = storageRequest.serviceConfiguration;
    const headlessS3Permissions = storageRequest.serviceConfiguration.permissions;
    const authPermissions = getS3PermissionFromHeadlessParams(headlessS3Permissions.auth);
    const guestPermissions = getS3PermissionFromHeadlessParams(headlessS3Permissions.guest);
    const storageAccess = getStorageAccessTypeFromPermissions(guestPermissions);
    const groupAccess = getGroupAccessTypeFromPermissions(headlessS3Permissions.groups);
    const [shortId] = (0, uuid_1.v4)().split('-');
    const defaultS3UserInput = (0, s3_defaults_1.getAllDefaults)(context.amplify.getProjectDetails(), shortId);
    const s3UserInput = {
        resourceName: headlessS3Config.resourceName ? headlessS3Config.resourceName : defaultS3UserInput.resourceName,
        bucketName: headlessS3Config.bucketName ? headlessS3Config.bucketName : defaultS3UserInput.bucketName,
        policyUUID: defaultS3UserInput.policyUUID,
        storageAccess: storageAccess,
        guestAccess: guestPermissions,
        authAccess: authPermissions,
        groupAccess: groupAccess,
    };
    if (((_a = headlessS3Config.lambdaTrigger) === null || _a === void 0 ? void 0 : _a.mode) === 'existing') {
        s3UserInput.triggerFunction = headlessS3Config.lambdaTrigger.name;
    }
    return s3UserInput;
}
exports.buildS3UserInputFromHeadlessStorageRequest = buildS3UserInputFromHeadlessStorageRequest;
async function buildS3UserInputFromHeadlessUpdateStorageRequest(context, storageRequest) {
    const { serviceModification: { permissions, resourceName, lambdaTrigger }, } = storageRequest;
    const s3UserInputs = await (0, __1.s3GetUserInput)(context, resourceName);
    if (permissions) {
        s3UserInputs.authAccess = getS3PermissionFromHeadlessParams(permissions.auth);
        s3UserInputs.guestAccess = getS3PermissionFromHeadlessParams(permissions.guest);
        s3UserInputs.storageAccess = getStorageAccessTypeFromPermissions(s3UserInputs.guestAccess);
    }
    if (lambdaTrigger) {
        if (lambdaTrigger.mode === 'existing') {
            s3UserInputs.triggerFunction = lambdaTrigger.name;
        }
    }
    return s3UserInputs;
}
exports.buildS3UserInputFromHeadlessUpdateStorageRequest = buildS3UserInputFromHeadlessUpdateStorageRequest;
function buildTriggerFunctionParams(triggerFunctionName) {
    const storageLambdaParams = {
        category: amplify_cli_core_1.AmplifyCategories.STORAGE,
        tag: 'triggerFunction',
        triggerFunction: triggerFunctionName,
        permissions: [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE, s3_user_input_types_1.S3PermissionType.READ, s3_user_input_types_1.S3PermissionType.DELETE],
        triggerEvents: [s3_user_input_types_1.S3TriggerEventType.OBJ_PUT_POST_COPY, s3_user_input_types_1.S3TriggerEventType.OBJ_REMOVED],
        triggerPrefix: [
            { prefix: 'protected/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
            { prefix: 'private/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
            { prefix: 'public/', prefixTransform: s3_user_input_types_1.S3TriggerPrefixTransform.ATTACH_REGION },
        ],
    };
    return storageLambdaParams;
}
exports.buildTriggerFunctionParams = buildTriggerFunctionParams;
function getS3PermissionFromHeadlessParams(headlessPermissionList) {
    if (headlessPermissionList && headlessPermissionList.length > 0) {
        return headlessPermissionList.map((headlessCrud) => {
            switch (headlessCrud) {
                case amplify_headless_interface_1.CrudOperation.CREATE_AND_UPDATE: {
                    return s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE;
                }
                case amplify_headless_interface_1.CrudOperation.DELETE: {
                    return s3_user_input_types_1.S3PermissionType.DELETE;
                }
                case amplify_headless_interface_1.CrudOperation.READ: {
                    return s3_user_input_types_1.S3PermissionType.READ;
                }
                default:
                    throw new Error(`Headless Access Permission ${headlessCrud} is not supported in S3 CLI`);
            }
        });
    }
    else {
        return [];
    }
}
exports.getS3PermissionFromHeadlessParams = getS3PermissionFromHeadlessParams;
function getStorageAccessTypeFromPermissions(guestPermissions) {
    return guestPermissions && guestPermissions.length > 0 ? s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST : s3_user_input_types_1.S3AccessType.AUTH_ONLY;
}
function getGroupAccessTypeFromPermissions(headlessPermissionGroups) {
    const groupAccessType = {};
    if (!headlessPermissionGroups) {
        return undefined;
    }
    else {
        const groupNames = Object.keys(headlessPermissionGroups);
        for (const groupName of groupNames) {
            groupAccessType[groupName] = getS3PermissionFromHeadlessParams(headlessPermissionGroups[groupName]);
        }
    }
    return groupAccessType;
}
//# sourceMappingURL=s3-headless-adapter.js.map