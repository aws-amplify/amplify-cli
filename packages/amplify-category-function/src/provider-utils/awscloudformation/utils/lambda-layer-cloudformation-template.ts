import { DeletionPolicy, Fn, IntrinsicFunction, Refs } from 'cloudform-types';
import Lambda from 'cloudform-types/types/lambda';
import _ from 'lodash';
import uuid from 'uuid';
import { isMultiEnvLayer } from './layerHelpers';
import { LayerParameters, LayerPermission, LayerVersionCfnMetadata, PermissionEnum } from './layerParams';

function generateLayerCfnObjBase() {
  const cfnObj = {
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

  return cfnObj;
}

/**
 * generates CloudFormation for Layer versions and Layer permissions
 */
export function generateLayerCfnObj(isNewVersion: boolean, parameters: LayerParameters, versionList: LayerVersionCfnMetadata[] = []) {
  const multiEnvLayer = isMultiEnvLayer(parameters.layerName);
  const layerName = multiEnvLayer ? Fn.Sub(`${parameters.layerName}-` + '${env}', { env: Fn.Ref('env') }) : parameters.layerName;
  let logicalName;
  if (isNewVersion) {
    const [shortId] = uuid().split('-');
    logicalName = `LambdaLayerVersion${shortId}`;
    versionList.push({ LogicalName: logicalName });
  } else {
    logicalName = versionList[versionList.length - 1].LogicalName;
  }
  const outputObj = {
    Outputs: {
      Arn: {
        Value: Fn.Ref(logicalName),
      },
      // Region: { Value: Refs.Region }, // TODO Do we need this?
    },
  };
  const cfnObj = generateLayerCfnObjBase();
  for (const layerVersion of versionList) {
    cfnObj.Resources[layerVersion.LogicalName] = constructLayerVersionCfnObject(layerName, layerVersion);
    const shortId = layerVersion.LogicalName.replace('LambdaLayerVersion', '');
    const permissionObjects = generateLayerVersionPermissionObjects(layerVersion, parameters, shortId);
    permissionObjects.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  }
  return { ...cfnObj, ...outputObj };
}

function constructLayerVersionCfnObject(layerName: string | IntrinsicFunction, layerVersion: LayerVersionCfnMetadata) {
  const newLayerVersion = new Lambda.LayerVersion({
    CompatibleRuntimes: layerVersion.CompatibleRuntimes || Fn.Ref('runtimes'),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: layerVersion.Description || Fn.Ref('description'),
    LayerName: layerName,
  });
  newLayerVersion.deletionPolicy(DeletionPolicy.Delete);
  _.assign(newLayerVersion, { UpdateReplacePolicy: DeletionPolicy.Retain });
  return newLayerVersion;
}

function generateLayerVersionPermissionObjects(layerVersion: LayerVersionCfnMetadata, layerParameters: LayerParameters, shortId: string) {
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
