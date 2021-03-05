import { $TSContext } from 'amplify-cli-core';
import { Fn, DeletionPolicy, Refs } from 'cloudform-types';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { isMultiEnvLayer, LayerMetadata, LayerParameters, LayerVersionCfnMetadata, Permission } from './layerParams';
import uuid from 'uuid';

function generateLayerCfnObjBase() {
  const cfnObj = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda layer resource stack creation using Amplify CLI',
    Parameters: {
      env: {
        Type: 'String',
      },
      s3Key: {
        Type: 'String',
      },
      deploymentBucketName: {
        Type: 'String',
      },
    },
    Resources: {},
  };

  return cfnObj;
}

/**
 * generates CFN for Layer and Layer permissions when updating layerVersion
 */
export function generateLayerCfnObj(context: $TSContext, parameters: LayerParameters, versionList: LayerVersionCfnMetadata[]) {
  context.print.debug('generateLayerCfnObj()');
  const multiEnvLayer = isMultiEnvLayer(parameters.layerName);
  const layerName = multiEnvLayer ? Fn.Sub(`${parameters.layerName}-` + '${env}', { env: Fn.Ref('env') }) : parameters.layerName;
  const [shortId] = uuid().split('-');
  const logicalName = `LambdaLayerVersion${shortId}`;
  // const layerData = getLayerMetadataFactory(context)(parameters.layerName);
  const outputObj = {
    Outputs: {
      Arn: {
        Value: Fn.Ref(logicalName),
      },
      Region: { Value: Refs.Region },
    },
  };
  const cfnObj = generateLayerCfnObjBase();
  for (const layerVersion of versionList) {
    if (layerVersion.LogicalName) {
      cfnObj.Resources[layerVersion.LogicalName] = constructLayerVersionCfnObj(layerName, layerVersion);
    } else {
      cfnObj.Resources[logicalName] = constructLayerVersionCfnObj(layerName, layerVersion);
    }
  }

  // Object.entries(parameters.layerVersionMap).forEach(([key]) => {
  //   const answer = assignLayerVersionPermissions(layerData, key, parameters.layerName, parameters.build, multiEnvLayer);
  //   answer.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  // });
  return cfnObj;
}

function constructLayerVersionCfnObj(layerName, layerVersion: LayerVersionCfnMetadata) {
  const newLayerVersion = new Lambda.LayerVersion({
    CompatibleRuntimes: layerVersion.CompatibleRuntimes,
    Content: layerVersion.Content ?? {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: '', // TODO Implement
    LayerName: layerName,
  });
  newLayerVersion.deletionPolicy(DeletionPolicy.Delete);
  _.assign(newLayerVersion, { UpdateReplacePolicy: DeletionPolicy.Retain });
  return newLayerVersion;
}

function assignLayerVersionPermissions(
  layerData: LayerMetadata,
  version: string,
  layerName: string,
  isContentUpdated: boolean,
  multiEnvLayer: boolean,
) {
  const layerVersionPermissionBase = {
    Action: 'lambda:GetLayerVersion',
    LayerVersionArn: createLayerVersionArn(layerData, layerName, version, isContentUpdated, multiEnvLayer),
  };

  const result = [];
  const versionPermission = layerData.getVersion(Number(version));
  if (versionPermission.isPublic()) {
    result.push({
      name: `LambdaLayerPermission${Permission.public}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: '*',
      }),
    });
    return result;
  }
  if (versionPermission.isPrivate()) {
    result.push({
      name: `LambdaLayerPermission${Permission.private}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: Refs.AccountId,
      }),
    });
  }

  const accountIds = versionPermission.listAccountAccess();
  const orgIds = versionPermission.listOrgAccess();

  accountIds.forEach(acctId =>
    result.push({
      name: `LambdaLayerPermission${Permission.awsAccounts}${acctId}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: acctId,
      }),
    }),
  );

  orgIds.forEach(orgId =>
    result.push({
      name: `LambdaLayerPermission${Permission.awsOrg}${orgId.replace('-', '')}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: '*',
        OrganizationId: orgId,
      }),
    }),
  );
  return result;
}

function createLayerVersionArn(
  layerData: LayerMetadata,
  layerName: string,
  version: string,
  isContentUpdated: boolean,
  multiEnvLayer: boolean,
) {
  //arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
  if (isContentUpdated) {
    // if runtime/Content updated
    if (layerData.getLatestVersion() === Number(version)) {
      return Fn.Ref('LambdaLayerVersion'); // TODO use logical name
    }
  }
  if (multiEnvLayer) {
    return Fn.Sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:${layerName}-${env}:${layerVersion}', {
      layerName,
      env: Fn.Ref('env'),
      layerVersion: version,
    });
  }
  return Fn.Sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:${layerName}:${layerVersion}', {
    layerName,
    layerVersion: version,
  });
}
