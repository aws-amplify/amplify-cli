import { stateManager } from 'amplify-cli-core';
import { DeletionPolicy, Fn, IntrinsicFunction, Refs } from 'cloudform-types';
import Lambda from 'cloudform-types/types/lambda';
import _ from 'lodash';
import uuid from 'uuid';
import { LayerCloudState } from './layerCloudState';
import { getLayerVersionToBeRemovedByCfn } from './layerConfiguration';
import { isMultiEnvLayer } from './layerHelpers';
import { LayerParameters, LayerPermission, LayerVersionCfnMetadata, PermissionEnum } from './layerParams';

/**
 * generates CloudFormation for Layer versions and Layer permissions
 */
export function generateLayerCfnObj(isNewVersion: boolean, parameters: LayerParameters, versionList: LayerVersionCfnMetadata[] = []) {
  const multiEnvLayer = isMultiEnvLayer(parameters.layerName);
  const resourceName = parameters.layerName;
  const layerName = multiEnvLayer ? Fn.Sub(`${parameters.layerName}-` + '${env}', { env: Fn.Ref('env') }) : parameters.layerName;
  let logicalName: string;

  if (isNewVersion) {
    const [shortId] = uuid().split('-');
    logicalName = `LambdaLayerVersion${shortId}`;
    const layerCloudState = LayerCloudState.getInstance();
    layerCloudState.latestVersionLogicalId = logicalName; // Store in singleton so it can be used in zipfile name
    versionList.push({ LogicalName: logicalName, LegacyLayer: false });
  } else {
    logicalName = versionList[versionList.length - 1].LogicalName;
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
  const layerVersionsToBeRemoved = getLayerVersionToBeRemovedByCfn(parameters.layerName, envName);
  const skipLayerVersionSet = new Set<number>(layerVersionsToBeRemoved);

  for (const layerVersion of versionList.filter(r => !r.LegacyLayer && !skipLayerVersionSet.has(r.Version))) {
    cfnObj.Resources[layerVersion.LogicalName] = constructLayerVersionCfnObject(layerName, layerVersion, resourceName);
    const shortId = layerVersion.LogicalName.replace('LambdaLayerVersion', '');
    const permissionObjects = constructLayerVersionPermissionObjects(layerVersion, parameters, shortId);
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
      S3Key: layerVersion.CreatedDate ? `amplify-builds/${resourceName}-${layerVersion.LogicalName}-build.zip` : Fn.Ref('s3Key'),
    },
    Description: description,
    LayerName: layerName,
  });
  newLayerVersion.deletionPolicy(DeletionPolicy.Delete);
  _.assign(newLayerVersion, { UpdateReplacePolicy: DeletionPolicy.Retain });
  return newLayerVersion;
}

function constructLayerVersionPermissionObjects(layerVersion: LayerVersionCfnMetadata, layerParameters: LayerParameters, shortId: string) {
  const permissions = layerVersion.permissions || layerParameters.permissions;
  const layerVersionPermissionBase = {
    Action: 'lambda:GetLayerVersion',
    LayerVersionArn: getLayerVersionArn(layerVersion),
  };

  // If public permissions are applied, any other permissions are redundant
  if (permissions.filter(p => p.type === PermissionEnum.Public).length > 0) {
    return [
      {
        name: `LambdaLayerPermission${PermissionEnum.Public}${shortId}`,
        policy: new Lambda.LayerVersionPermission({
          ...layerVersionPermissionBase,
          Principal: '*',
        }),
      },
    ];
  }

  const layerVersionPermissions: { name: string; policy: object }[] = [];

  permissions.forEach((permission: LayerPermission) => {
    switch (permission.type) {
      case PermissionEnum.Private:
        layerVersionPermissions.push({
          name: `LambdaLayerPermission${PermissionEnum.Private}${shortId}`,
          policy: new Lambda.LayerVersionPermission({
            ...layerVersionPermissionBase,
            Principal: Refs.AccountId,
          }),
        });
        break;
      case PermissionEnum.AwsAccounts:
        permission.accounts.forEach(acctId =>
          layerVersionPermissions.push({
            name: `LambdaLayerPermission${PermissionEnum.AwsAccounts}${acctId}${shortId}`,
            policy: new Lambda.LayerVersionPermission({
              ...layerVersionPermissionBase,
              Principal: acctId,
            }),
          }),
        );
        break;
      case PermissionEnum.AwsOrg:
        permission.orgs.forEach(orgId =>
          layerVersionPermissions.push({
            name: `LambdaLayerPermission${PermissionEnum.AwsOrg}${orgId.replace('-', '')}${shortId}`,
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

// e.g. arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
function getLayerVersionArn(layerVersionMeta: LayerVersionCfnMetadata) {
  return layerVersionMeta?.LayerVersionArn || Fn.Ref(layerVersionMeta.LogicalName);
}
