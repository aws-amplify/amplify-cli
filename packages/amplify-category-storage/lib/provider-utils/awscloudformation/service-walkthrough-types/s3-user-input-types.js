"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoleAccessDefaultValues = exports.defaultS3UserInputs = exports.S3TriggerPrefixTransform = exports.S3TriggerEventType = exports.S3PermissionType = exports.S3AccessType = exports.getUserAccessQuestions = exports.S3UserAccessRole = exports.S3TriggerFunctionType = exports.enumToHelp = void 0;
function enumToHelp(obj) {
    return `One of ${Object.values(obj)}`;
}
exports.enumToHelp = enumToHelp;
var S3TriggerFunctionType;
(function (S3TriggerFunctionType) {
    S3TriggerFunctionType["EXISTING_FUNCTION"] = "Choose an existing function from the project";
    S3TriggerFunctionType["NEW_FUNCTION"] = "Create a new function";
})(S3TriggerFunctionType = exports.S3TriggerFunctionType || (exports.S3TriggerFunctionType = {}));
var S3UserAccessRole;
(function (S3UserAccessRole) {
    S3UserAccessRole["AUTH"] = "Auth";
    S3UserAccessRole["GUEST"] = "Guest";
    S3UserAccessRole["GROUP"] = "Group";
})(S3UserAccessRole = exports.S3UserAccessRole || (exports.S3UserAccessRole = {}));
function getUserAccessQuestions(accessRole) {
    if (accessRole === S3UserAccessRole.AUTH) {
        return 'Authenticated';
    }
    else {
        return accessRole.toString();
    }
}
exports.getUserAccessQuestions = getUserAccessQuestions;
var S3AccessType;
(function (S3AccessType) {
    S3AccessType["AUTH_AND_GUEST"] = "authAndGuest";
    S3AccessType["AUTH_ONLY"] = "auth";
})(S3AccessType = exports.S3AccessType || (exports.S3AccessType = {}));
var S3PermissionType;
(function (S3PermissionType) {
    S3PermissionType["CREATE_AND_UPDATE"] = "CREATE_AND_UPDATE";
    S3PermissionType["READ"] = "READ";
    S3PermissionType["DELETE"] = "DELETE";
})(S3PermissionType = exports.S3PermissionType || (exports.S3PermissionType = {}));
var S3TriggerEventType;
(function (S3TriggerEventType) {
    S3TriggerEventType["OBJ_PUT_POST_COPY"] = "s3:ObjectCreated:*";
    S3TriggerEventType["OBJ_REMOVED"] = "s3:ObjectRemoved:*";
})(S3TriggerEventType = exports.S3TriggerEventType || (exports.S3TriggerEventType = {}));
var S3TriggerPrefixTransform;
(function (S3TriggerPrefixTransform) {
    S3TriggerPrefixTransform["NONE"] = "NONE";
    S3TriggerPrefixTransform["ATTACH_REGION"] = "ATTACH_REGION";
})(S3TriggerPrefixTransform = exports.S3TriggerPrefixTransform || (exports.S3TriggerPrefixTransform = {}));
function defaultS3UserInputs() {
    const defaultS3UserInputValues = {
        resourceName: undefined,
        bucketName: undefined,
        storageAccess: undefined,
        policyUUID: undefined,
        guestAccess: [],
        authAccess: [],
        triggerFunction: undefined,
        groupAccess: undefined,
        additionalTriggerFunctions: undefined,
    };
    return defaultS3UserInputValues;
}
exports.defaultS3UserInputs = defaultS3UserInputs;
function getRoleAccessDefaultValues(role, groupName, userInputs) {
    switch (role) {
        case S3UserAccessRole.AUTH:
            return userInputs.authAccess;
        case S3UserAccessRole.GUEST:
            return userInputs.guestAccess;
        case S3UserAccessRole.GROUP:
            if (userInputs.groupAccess && groupName && userInputs.groupAccess[groupName]) {
                return userInputs.groupAccess[groupName];
            }
            else {
                return [];
            }
    }
    throw new Error(`Unknown Role in User Input: "${role}" : No Access`);
}
exports.getRoleAccessDefaultValues = getRoleAccessDefaultValues;
//# sourceMappingURL=s3-user-input-types.js.map