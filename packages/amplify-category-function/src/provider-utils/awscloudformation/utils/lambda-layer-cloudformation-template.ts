import { stateManager } from 'amplify-cli-core';
import { DeletionPolicy, Fn, IntrinsicFunction, Refs } from 'cloudform-types';
import Lambda from 'cloudform-types/types/lambda';
import _ from 'lodash';
import uuid from 'uuid';
import { LayerCfnLogicalNamePrefix } from './constants';
import { LayerCloudState } from './layerCloudState';
import { getLayerVersionPermissionsToBeUpdatedInCfn, getLayerVersionsToBeRemovedByCfn } from './layerConfiguration';
import { isMultiEnvLayer } from './layerHelpers';
import { LegacyPermissionEnum } from './layerMigrationUtils';
import { LayerParameters, LayerPermission, LayerVersionCfnMetadata, PermissionEnum } from './layerParams';
import { createLayerZipFilename } from './packageLayer';

/**
 * generates CloudFormation for Layer versions and Layer permissions
 * @param versionList is sorted descendingly
 */
export function generateLayerCfnObj(isNewVersion: boolean, parameters: LayerParameters, versionList: LayerVersionCfnMetadata[] = []) {
  const multiEnvLayer = isMultiEnvLayer(parameters.layerName);
  const resourceName = parameters.layerName;
  const layerName = multiEnvLayer ? Fn.Sub(`${parameters.layerName}-` + '${env}', { env: Fn.Ref('env') }) : parameters.layerName;
  let logicalName: string;

  if (isNewVersion) {
    const [shortId] = uuid().split('-');
    logicalName = `${LayerCfnLogicalNamePrefix.LambdaLayerVersion}${shortId}`;
    const layerCloudState = LayerCloudState.getInstance(parameters.layerName);
    layerCloudState.latestVersionLogicalId = logicalName; // Store in the given layer's layerCloudState instance so it can be used in zipfile name
    versionList.unshift({ LogicalName: logicalName, legacyLayer: false });
  } else {
    logicalName = _.first(versionList).LogicalName;
  }

  const outputObj = {
    Outputs: {
      Arn: {
        Value: Fn.Ref(logicalName),
      },
    },
  };
  const cfnObj = getLayerCfnObjBase();
  const { envName } = stateManager.getLocalEnvInfo();
  const layerVersionsToBeRemoved = getLayerVersionsToBeRemovedByCfn(resourceName, envName);
  const skipLayerVersionSet = new Set<number>(layerVersionsToBeRemoved);

  for (const layerVersion of versionList.filter(r => !skipLayerVersionSet.has(r.Version))) {
    let shortId: string;
    if (!layerVersion.legacyLayer) {
      cfnObj.Resources[layerVersion.LogicalName] = constructLayerVersionCfnObject(layerName, layerVersion, resourceName);
      shortId = layerVersion.LogicalName.replace(LayerCfnLogicalNamePrefix.LambdaLayerVersion, '');
    }
    const permissionObjects = constructLayerVersionPermissionObjects(layerVersion, parameters, shortId, envName);
    permissionObjects.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  }

  return { ...cfnObj, ...outputObj };
}

function getLayerCfnObjBase() {
  return {
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
      runtimes: {
        Type: 'List<String>',
      },
    },
    Resources: {},
  };
}

function constructLayerVersionCfnObject(
  layerName: string | IntrinsicFunction,
  layerVersion: LayerVersionCfnMetadata,
  resourceName: string,
) {
  const description: string | IntrinsicFunction = layerVersion.CreatedDate ? layerVersion.Description : Fn.Ref('description');
  const newLayerVersion = new Lambda.LayerVersion({
    CompatibleRuntimes: layerVersion.CompatibleRuntimes || Fn.Ref('runtimes'),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: layerVersion.CreatedDate
        ? // 'amplify-builds/' prefix is added during push operation
          `amplify-builds/${createLayerZipFilename(resourceName, layerVersion.LogicalName)}`
        : Fn.Ref('s3Key'),
    },
    Description: description,
    LayerName: layerName,
  });
  newLayerVersion.deletionPolicy(DeletionPolicy.Delete);
  _.assign(newLayerVersion, { UpdateReplacePolicy: DeletionPolicy.Retain });
  return newLayerVersion;
}

function constructLayerVersionPermissionObjects(
  layerVersion: LayerVersionCfnMetadata,
  layerParameters: LayerParameters,
  shortId: string,
  envName: string,
) {
  let permissions: LayerPermission[];
  if (layerVersion.Version) {
    permissions = getLayerVersionPermissionsToBeUpdatedInCfn(layerParameters.layerName, envName, layerVersion.Version);
  }

  permissions ||=
    Array.isArray(layerVersion.permissions) && layerVersion.permissions.length > 0 ? layerVersion.permissions : layerParameters.permissions;

  const layerVersionPermissionBase = {
    Action: 'lambda:GetLayerVersion',
    LayerVersionArn: getLayerVersionArn(layerVersion),
  };

  // If public permissions are applied, any other permissions are redundant
  if (permissions.filter(p => p.type === PermissionEnum.Public).length > 0) {
    return [
      {
        name: getPublicLayerVersionPermissionName(layerVersion, shortId),
        policy: new Lambda.LayerVersionPermission({
          ...layerVersionPermissionBase,
          Principal: '*',
        }),
      },
    ];
  }

  const layerVersionPermissions: { name: string; policy: object }[] = [];

  permissions.forEach((permission: LayerPermission | { type: LegacyPermissionEnum; accounts?: string[]; orgs?: string[] }) => {
    switch (permission.type) {
      case PermissionEnum.Private:
        layerVersionPermissions.push({
          name: getPrivateLayerVersionPermissionName(layerVersion, shortId),
          policy: new Lambda.LayerVersionPermission({
            ...layerVersionPermissionBase,
            Principal: Refs.AccountId,
          }),
        });
        break;
      case PermissionEnum.AwsAccounts:
        permission.accounts.forEach(accountId =>
          layerVersionPermissions.push({
            name: getAccountLayerVersionPermissionName(layerVersion, shortId, accountId),
            policy: new Lambda.LayerVersionPermission({
              ...layerVersionPermissionBase,
              Principal: accountId,
            }),
          }),
        );
        break;
      case PermissionEnum.AwsOrg:
        permission.orgs.forEach(orgId =>
          layerVersionPermissions.push({
            name: getOrgLayerVersionPermissionName(layerVersion, shortId, orgId),
            policy: new Lambda.LayerVersionPermission({
              ...layerVersionPermissionBase,
              OrganizationId: orgId,
              Principal: '*',
            }),
          }),
        );
        break;
      default:
        throw new Error(`Invalid permission type ${permission.type}`);
    }
  });
  return layerVersionPermissions;
}

function getPublicLayerVersionPermissionName(layerVersion: LayerVersionCfnMetadata, shortId: string) {
  return `${LayerCfnLogicalNamePrefix.LambdaLayerVersionPermission}${PermissionEnum.Public}${
    layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId
  }`;
}

function getPrivateLayerVersionPermissionName(layerVersion: LayerVersionCfnMetadata, shortId: string) {
  return `${LayerCfnLogicalNamePrefix.LambdaLayerVersionPermission}${PermissionEnum.Private}${
    layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId
  }`;
}

function getAccountLayerVersionPermissionName(layerVersion: LayerVersionCfnMetadata, shortId: string, accountId: string) {
  return `${LayerCfnLogicalNamePrefix.LambdaLayerVersionPermission}${PermissionEnum.AwsAccounts}${accountId}${
    layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId
  }`;
}

function getOrgLayerVersionPermissionName(layerVersion: LayerVersionCfnMetadata, shortId: string, orgId: string) {
  return `${LayerCfnLogicalNamePrefix.LambdaLayerVersionPermission}${PermissionEnum.AwsOrg}${orgId.replace('-', '')}${
    layerVersion.legacyLayer ? `Legacy${layerVersion.Version}` : shortId
  }`;
}

// e.g. arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
function getLayerVersionArn(layerVersionMeta: LayerVersionCfnMetadata) {
  return layerVersionMeta?.LayerVersionArn || Fn.Ref(layerVersionMeta.LogicalName);
}
