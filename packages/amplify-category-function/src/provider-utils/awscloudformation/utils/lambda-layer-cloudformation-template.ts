import { Fn, DeletionPolicy } from 'cloudform';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { Permissions } from './layerParams';

export default function generateLayerCfnObj(parameters) {
  const POLICY_RETAIN = DeletionPolicy.Retain;

  const layer = new Lambda.LayerVersion({
    CompatibleRuntimes: parameters.runtimes.map(runtime => runtime.cloudTemplateValue),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: parameters.description || '',
    LayerName: parameters.layerName,
    LicenseInfo: 'MIT',
  });
  layer.deletionPolicy(POLICY_RETAIN);
  _.assign(layer, { UpdateReplacePolicy: POLICY_RETAIN });

  const layerVersionPermissionInput = {
    Action: 'lambda:GetLayerPermission',
    LayerVersionArn: Fn.Ref(layer.Properties.LayerName),
  };
  let layerVersionPermission;

  if (parameters.layerPermissions === Permissions.awsOrg) {
    if (!parameters.authorizedOrgId) {
      throw 'AWS Organization ID is missing, failed to generate cloudformation.';
    }

    layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: '*',
    });
    layerVersionPermission.OganizationId = parameters.authorizedOrgId;
  } else if (parameters.layerPermissions === Permissions.awsAccounts) {
    if (!parameters.authorizedAccountIds || parameters.authorizedAccountIds.length <= 0) {
      throw 'No AWS Account IDs present, failed to generate cloudformation.';
    }

    layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: parameters.authorizedAccountIds,
    });
  } else if (parameters.layerPermissions === Permissions.public) {
    layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: '*',
    });
  }

  const cfnObj = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda Layer resource stack creation using Amplify CLI',
    Parameters: {
      deploymentBucketName: {
        Type: 'String',
      },
      s3Key: {
        Type: 'String',
      },
    },
    Resources: {
      LambdaLayer: layer,
    },
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
      Permission: {
        Value: {
          Ref: 'LambdaLayerPermission',
        },
      },
    },
  };

  if (layerVersionPermission) {
    layerVersionPermission.deletionPolicy(POLICY_RETAIN);
    layerVersionPermission.UpdateReplacePolicy = POLICY_RETAIN;
    _.assign(layerVersionPermission, { UpdateReplacePolicy: POLICY_RETAIN });

    cfnObj.Resources = { ...cfnObj.Resources, ...layerVersionPermission };
  }
  return cfnObj;
}
