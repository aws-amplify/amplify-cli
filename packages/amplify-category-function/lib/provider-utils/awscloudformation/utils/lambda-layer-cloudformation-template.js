"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLayerCfnObj = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const cloudform_types_1 = require("cloudform-types");
const lambda_1 = __importDefault(require("cloudform-types/types/lambda"));
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const layerCloudState_1 = require("./layerCloudState");
const layerConfiguration_1 = require("./layerConfiguration");
const layerHelpers_1 = require("./layerHelpers");
const layerParams_1 = require("./layerParams");
const packageLayer_1 = require("./packageLayer");
function generateLayerCfnObj(isNewVersion, parameters, versionList = []) {
    const multiEnvLayer = (0, layerHelpers_1.isMultiEnvLayer)(parameters.layerName);
    const resourceName = parameters.layerName;
    const layerName = multiEnvLayer ? cloudform_types_1.Fn.Sub(`${parameters.layerName}-` + '${env}', { env: cloudform_types_1.Fn.Ref('env') }) : parameters.layerName;
    const hasRuntimes = parameters.runtimes.length > 0;
    let logicalName;
    if (isNewVersion) {
        const [shortId] = (0, uuid_1.v4)().split('-');
        logicalName = `${"LambdaLayerVersion"}${shortId}`;
        const layerCloudState = layerCloudState_1.LayerCloudState.getInstance(parameters.layerName);
        layerCloudState.latestVersionLogicalId = logicalName;
        versionList.unshift({ LogicalName: logicalName, legacyLayer: false });
    }
    else {
        logicalName = lodash_1.default.first(versionList).LogicalName;
    }
    const outputObj = {
        Outputs: {
            Arn: {
                Value: cloudform_types_1.Fn.Ref(logicalName),
            },
        },
    };
    const cfnObj = getLayerCfnObjBase(hasRuntimes);
    const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    const layerVersionsToBeRemoved = (0, layerConfiguration_1.getLayerVersionsToBeRemovedByCfn)(resourceName, envName);
    const skipLayerVersionSet = new Set(layerVersionsToBeRemoved);
    for (const layerVersion of versionList.filter((r) => !skipLayerVersionSet.has(r.Version))) {
        let shortId;
        if (!layerVersion.legacyLayer) {
            cfnObj.Resources[layerVersion.LogicalName] = constructLayerVersionCfnObject(layerName, layerVersion, resourceName, hasRuntimes);
            shortId = layerVersion.LogicalName.replace("LambdaLayerVersion", '');
        }
        const permissionObjects = constructLayerVersionPermissionObjects(layerVersion, parameters, shortId, envName);
        permissionObjects.forEach((permission) => (cfnObj.Resources[permission.name] = permission.policy));
    }
    return { ...cfnObj, ...outputObj };
}
exports.generateLayerCfnObj = generateLayerCfnObj;
function getLayerCfnObjBase(hasRuntimes) {
    const cfnBase = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Lambda layer resource stack creation using Amplify CLI',
        Parameters: {
            env: {
                Type: 'String',
            },
            deploymentBucketName: {
                Type: 'String',
            },
            s3Key: {
                Type: 'String',
            },
            description: {
                Type: 'String',
                Default: '',
            },
            runtimes: undefined,
        },
        Resources: {},
    };
    if (hasRuntimes) {
        cfnBase.Parameters.runtimes = {
            Type: 'List<String>',
        };
    }
    return cfnBase;
}
function constructLayerVersionCfnObject(layerName, layerVersion, resourceName, hasRuntimes) {
    const description = layerVersion.CreatedDate ? layerVersion.Description : cloudform_types_1.Fn.Ref('description');
    let compatibleRuntimes;
    if (hasRuntimes) {
        compatibleRuntimes = { CompatibleRuntimes: layerVersion.CompatibleRuntimes || cloudform_types_1.Fn.Ref('runtimes') };
    }
    const newLayerVersion = new lambda_1.default.LayerVersion({
        ...compatibleRuntimes,
        Content: {
            S3Bucket: cloudform_types_1.Fn.Ref('deploymentBucketName'),
            S3Key: layerVersion.CreatedDate
                ?
                    `amplify-builds/${(0, packageLayer_1.createLayerZipFilename)(resourceName, layerVersion.LogicalName)}`
                : cloudform_types_1.Fn.Ref('s3Key'),
        },
        Description: description,
        LayerName: layerName,
    });
    newLayerVersion.deletionPolicy(cloudform_types_1.DeletionPolicy.Delete);
    lodash_1.default.assign(newLayerVersion, { UpdateReplacePolicy: cloudform_types_1.DeletionPolicy.Retain });
    return newLayerVersion;
}
function constructLayerVersionPermissionObjects(layerVersion, layerParameters, shortId, envName) {
    let permissions;
    if (layerVersion.Version) {
        permissions = (0, layerConfiguration_1.getLayerVersionPermissionsToBeUpdatedInCfn)(layerParameters.layerName, envName, layerVersion.Version);
    }
    permissions || (permissions = Array.isArray(layerVersion.permissions) && layerVersion.permissions.length > 0 ? layerVersion.permissions : layerParameters.permissions);
    const layerVersionPermissionBase = {
        Action: 'lambda:GetLayerVersion',
        LayerVersionArn: getLayerVersionArn(layerVersion),
    };
    if (permissions.filter((p) => p.type === layerParams_1.PermissionEnum.Public).length > 0) {
        return [
            {
                name: getPublicLayerVersionPermissionName(layerVersion, shortId),
                policy: new lambda_1.default.LayerVersionPermission({
                    ...layerVersionPermissionBase,
                    Principal: '*',
                }),
            },
        ];
    }
    const layerVersionPermissions = [];
    permissions.forEach((permission) => {
        switch (permission.type) {
            case layerParams_1.PermissionEnum.Private:
                layerVersionPermissions.push({
                    name: getPrivateLayerVersionPermissionName(layerVersion, shortId),
                    policy: new lambda_1.default.LayerVersionPermission({
                        ...layerVersionPermissionBase,
                        Principal: cloudform_types_1.Refs.AccountId,
                    }),
                });
                break;
            case layerParams_1.PermissionEnum.AwsAccounts:
                permission.accounts.forEach((accountId) => layerVersionPermissions.push({
                    name: getAccountLayerVersionPermissionName(layerVersion, shortId, accountId),
                    policy: new lambda_1.default.LayerVersionPermission({
                        ...layerVersionPermissionBase,
                        Principal: accountId,
                    }),
                }));
                break;
            case layerParams_1.PermissionEnum.AwsOrg:
                permission.orgs.forEach((orgId) => layerVersionPermissions.push({
                    name: getOrgLayerVersionPermissionName(layerVersion, shortId, orgId),
                    policy: new lambda_1.default.LayerVersionPermission({
                        ...layerVersionPermissionBase,
                        OrganizationId: orgId,
                        Principal: '*',
                    }),
                }));
                break;
            default:
                throw new Error(`Invalid permission type ${permission.type}`);
        }
    });
    return layerVersionPermissions;
}
function getPublicLayerVersionPermissionName(layerVersion, shortId) {
    return `${"LambdaLayerPermission"}${layerParams_1.PermissionEnum.Public}${layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId}`;
}
function getPrivateLayerVersionPermissionName(layerVersion, shortId) {
    return `${"LambdaLayerPermission"}${layerParams_1.PermissionEnum.Private}${layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId}`;
}
function getAccountLayerVersionPermissionName(layerVersion, shortId, accountId) {
    return `${"LambdaLayerPermission"}${layerParams_1.PermissionEnum.AwsAccounts}${accountId}${layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId}`;
}
function getOrgLayerVersionPermissionName(layerVersion, shortId, orgId) {
    return `${"LambdaLayerPermission"}${layerParams_1.PermissionEnum.AwsOrg}${orgId.replace('-', '')}${layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId}`;
}
function getLayerVersionArn(layerVersionMeta) {
    return (layerVersionMeta === null || layerVersionMeta === void 0 ? void 0 : layerVersionMeta.LayerVersionArn) || cloudform_types_1.Fn.Ref(layerVersionMeta.LogicalName);
}
//# sourceMappingURL=lambda-layer-cloudformation-template.js.map