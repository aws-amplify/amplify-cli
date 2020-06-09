import { Fn, DeletionPolicy } from 'cloudform';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { Permissions, LayerParameters, LayerPermission, layerMetadataFactory, LayerMetadata } from './layerParams';

function generateLayerCfnObjBase() {
  const cfnObj = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda Layer resource stack creation using Amplify CLI',
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
      HasEnvironmentParameter: {
        'Fn::Not': [
          {
            'Fn::Equals': [
              {
                Ref: 'env',
              },
              'NONE',
            ],
          },
        ],
      },
    },
  };
  return cfnObj;
}

/**
 * generated CFN for Layerpermissions only when updating permisssions
 */
export function generatePermissionCfnObj(context: any, parameters: LayerParameters): object {
  const cfnObj = generateLayerCfnObjBase();
  const layerData = layerMetadataFactory(context, parameters.layerName);
  Object.entries(parameters.layerVersionsMap).forEach(([key]) => {
    const answer = assignLayerPermissions(layerData, key, parameters.layerName, parameters.build);
    answer.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  });
  return cfnObj;
}

/**
 * generates CFN for Layer and Layer permissions when updating layerVersion
 */
export function generateLayerCfnObj(context, parameters: LayerParameters) {
  const outputObj = {
    Outputs: {
      Arn: {
        Value: {
          Ref: 'LambdaLayer',
        },
      },
      Region: {
        Value: {
          Ref: 'AWS::Region',
        },
      },
    },
  };
  let cfnObj = { ...generateLayerCfnObjBase(), ...outputObj };
  const POLICY_RETAIN = DeletionPolicy.Retain;
  const layer = new Lambda.LayerVersion({
    CompatibleRuntimes: parameters.runtimes.map(runtime => runtime.cloudTemplateValue),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: 'Lambda Layer',
    LayerName: joinWithEnv('-', parameters.layerName),
    LicenseInfo: 'MIT',
  });
  layer.deletionPolicy(POLICY_RETAIN);
  _.assign(layer, { UpdateReplacePolicy: POLICY_RETAIN });

  cfnObj.Resources['LambdaLayer'] = layer;

  // parameters.laatestLayerVersion is defined
  const layerData = layerMetadataFactory(context, parameters.layerName);
  Object.entries(parameters.layerVersionsMap).forEach(([key]) => {
    const answer = assignLayerPermissions(layerData, key, parameters.layerName, parameters.build);
    answer.forEach(permission => (cfnObj.Resources[permission.name] = permission.policy));
  });
  return cfnObj;
}

function assignLayerPermissions(layerData: LayerMetadata, version: string, layerName: string, isContentUpdated: boolean) {
  const layerVersionPermissionBase = {
    Action: 'lambda:GetLayerVersion',
    LayerVersionArn: createLayerversionArn(layerData, layerName, version, isContentUpdated),
  };

  const result = [];
  const versionPermission = layerData.getVersion(Number(version));
  if (versionPermission.isPublic()) {
    result.push({
      name: `LambdaLayerPermission${Permissions.public}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: '*',
      }),
    });
  }
  if (versionPermission.isPrivate()) {
    result.push({
      name: `LambdaLayerPermission${Permissions.private}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: Fn.Ref('AWS::AccountId'),
      }),
    });
  }

  const accountIds = versionPermission.listAccoutAccess();
  const orgIds = versionPermission.listOrgAccess();

  accountIds.forEach(acctId =>
    result.push({
      name: `LambdaLayerPermission${Permissions.awsAccounts}${acctId}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: acctId,
      }),
    }),
  );

  orgIds.forEach(orgId =>
    result.push({
      name: `LambdaLayerPermission${Permissions.awsOrg}${orgId.replace('-', '')}${version}`,
      policy: new Lambda.LayerVersionPermission({
        ...layerVersionPermissionBase,
        Principal: '*',
        OrganizationId: orgId,
      }),
    }),
  );
  return result;
}

function joinWithEnv(separator: string, stringToJoin: string) {
  return Fn.If('HasEnvironmentParameter', Fn.Join(separator, [stringToJoin, Fn.Ref('env')]), stringToJoin);
}

function createLayerversionArn(layerData: LayerMetadata, layerName: string, version: string, isContentUpdated: boolean) {
  //arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
  if (isContentUpdated) {
    // if runtime/Content updated
    if (layerData.getLatestVersion() === Number(version)) {
      return Fn.Ref('LambdaLayer');
    }
  }
  return Fn.Sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:${layerName}:${layerVersion}', {
    layerName: joinWithEnv('-', layerName),
    layerVersion: version,
  });
}
