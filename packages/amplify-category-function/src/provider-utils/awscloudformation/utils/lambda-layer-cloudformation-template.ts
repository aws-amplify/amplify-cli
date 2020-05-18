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

  let layerVersionPermissionInput  = {
    Action: 'lambda:GetLayerPermission',
    LayerVersionArn: Fn.Ref(layer.Properties.LayerName), // generate layer version name with version param
  };
  let currentParams = {
    OrganizationId: undefined,
    Principal: undefined
  };

  parameters.layerPermissions.forEach(permission => {
    if (permission === Permissions.awsOrg) {
      if (!parameters.authorizedOrgId) {
        throw 'AWS Organization ID is missing, failed to generate cloudformation.';
      }
      currentParams.OrganizationId = parameters.authorizedOrgId;
    } else if (permission === Permissions.public) {
      currentParams.Principal = '*';
    }
    else{
      currentParams.Principal = "accountId-private";
    }
  });
  let layerVersionPermission = new Lambda.LayerVersionPermission({
    ...layerVersionPermissionInput,
    Principal: currentParams.Principal,
    OrganizationId: currentParams.OrganizationId
  });


  if (layerVersionPermission) {
    layerVersionPermission.deletionPolicy(POLICY_RETAIN);
    _.assign(layerVersionPermission, { UpdateReplacePolicy: POLICY_RETAIN });
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
      LambdaLayerPermission: layerVersionPermission,
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
          Ref: 'layerVersionPermission',
        },
      },
    },
  };
  return cfnObj;
}
