import { Fn, DeletionPolicy, Refs } from 'cloudform';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { FeatureFlags } from 'amplify-cli-core';
import { Permission, LayerParameters, getLayerMetadataFactory, LayerMetadata } from './layerParams';

function generateLayerCfnObjBase() {
  const cfnObj = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda layer resource stack creation using Amplify CLI',
    Parameters: {
      layerVersion: {
        Type: 'String',
        Default: '1',
      },
      env: {
        Type: 'String',
      },
    },
    Resources: {},
    Conditions: {
      HasEnvironmentParameter: Fn.Not(Fn.Equals(Fn.Ref('env'), 'NONE')),
    },
  };

  if (FeatureFlags.getBoolean('lambdaLayers.multiEnv')) {
    _.merge(cfnObj, {
      Parameters: {
        s3Key: {
          Type: 'String',
        },
        deploymentBucketName: {
          Type: 'String',
        },
      },
    });
  }

  return cfnObj;
}

/**
 * generates CFN for Layer and Layer permissions when updating layerVersion
 */
export function generateLayerCfnObj(context, parameters: LayerParameters) {
  const layerData = getLayerMetadataFactory(context)(parameters.layerName);
  const outputObj = {
    Outputs: {
      Arn: {
        Value: Fn.Ref('LambdaLayer'),
      },
      Region: { Value: Refs.Region },
    },
  };
  let cfnObj = { ...generateLayerCfnObjBase(), ...outputObj };
  const POLICY_RETAIN = DeletionPolicy.Retain;
  const layerName = FeatureFlags.getBoolean('lambdaLayers.multiEnv')
    ? Fn.Sub(`${parameters.layerName}-` + '${env}', { env: Fn.Ref('env') })
    : parameters.layerName;

  const layer = new Lambda.LayerVersion({
    CompatibleRuntimes: parameters.runtimes.map(runtime => runtime.cloudTemplateValue),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: Fn.Sub('Lambda layer version ${latestVersion}', { latestVersion: Fn.Ref('layerVersion') }),
    LayerName: layerName,
  });
  layer.deletionPolicy(POLICY_RETAIN);
  _.assign(layer, { UpdateReplacePolicy: POLICY_RETAIN });

  cfnObj.Resources['LambdaLayer'] = layer;
  Object.entries(parameters.layerVersionMap).forEach(([key]) => {
    const answer = assignLayerPermissions(layerData, key, parameters.layerName, parameters.build);
    answer.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  });
  return cfnObj;
}

function assignLayerPermissions(layerData: LayerMetadata, version: string, layerName: string, isContentUpdated: boolean) {
  const layerVersionPermissionBase = {
    Action: 'lambda:GetLayerVersion',
    LayerVersionArn: createLayerVersionArn(layerData, layerName, version, isContentUpdated),
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

function createLayerVersionArn(layerData: LayerMetadata, layerName: string, version: string, isContentUpdated: boolean) {
  //arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
  if (isContentUpdated) {
    // if runtime/Content updated
    if (layerData.getLatestVersion() === Number(version)) {
      return Fn.Ref('LambdaLayer');
    }
  }
  return Fn.Sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:${layerName}-${env}:${layerVersion}', {
    layerName: layerName,
    env: Fn.Ref('env'),
    layerVersion: version,
  });
}
