import { Fn, DeletionPolicy } from 'cloudform';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { Permissions } from './layerParams';
import { copyFunctionResources } from './storeResources';
export default function generateLayerCfnObj(parameters) {

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
    },
  };
  const POLICY_RETAIN = DeletionPolicy.Retain;
  const layer = new Lambda.LayerVersion({
    CompatibleRuntimes: parameters.runtimes.map(runtime => runtime.cloudTemplateValue),
    Content: {
      S3Bucket: '<S3Bucket>',
      S3Key: '<S3Key>',
    },
    Description: parameters.description || '',
    LayerName: parameters.layerName,
    LicenseInfo: 'MIT',
  });
  layer.deletionPolicy(POLICY_RETAIN);
  _.assign(layer, { UpdateReplacePolicy: POLICY_RETAIN });

  cfnObj.Resources["LambdaLayer"] = layer;

  parameters.layerPermissions.forEach(permissions => {
   if (permissions === Permissions.awsAccounts) {
      assignLayerPermissionsAccounts(cfnObj,parameters,permissions);
    }else{
      assignLayerPermissions(cfnObj,parameters,permissions)
    }

  });
  return cfnObj;
}

function assignLayerPermissions(cfnObj,parameters,permissions){
    // assign permissions
    const layerVersionPermissionInput = {
      Action: 'lambda:GetLayerPermission',
      LayerVersionArn: Fn.Ref("LambdaLayer"),
    };
  let layerVersionPermission = new Lambda.LayerVersionPermission({
    ...layerVersionPermissionInput,
    Principal: '*',
  });
  layerVersionPermission.deletionPolicy(DeletionPolicy.Retain);
  let temp : string = `LambdaLayerPermission${permissions}`
  if(permissions === Permissions.awsOrg){
    if (!permissions) {
      throw 'AWS Organization ID is missing, failed to generate cloudformation.';
    }
    layerVersionPermission.Properties.OrganizationId = parameters.authorizedOrgId;
    cfnObj.Resources[temp] = layerVersionPermission;
  }else if(permissions === Permissions.public){
    layerVersionPermission.Properties.Principal = "*";
    cfnObj.Resources[temp] = layerVersionPermission;
  }
  else{
    layerVersionPermission.Properties.Principal = Fn.Ref("AWS::AccountId");
    cfnObj.Resources[temp] = layerVersionPermission;
  }
}

function assignLayerPermissionsAccounts(cfnObj,parameters,permissions){
  // assign permissions
  if (!parameters.authorizedAccountIds || parameters.authorizedAccountIds.length <= 0) {
    throw 'No AWS Account IDs present, failed to generate cloudformation.';
  }
  let whitelistAccountIds = parameters.authorizedAccountIds.split(',');
  whitelistAccountIds.forEach(account => {
    const layerVersionPermissionInput = {
      Action: 'lambda:GetLayerPermission',
      LayerVersionArn: Fn.Ref("LambdaLayer"),
    };
    let layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: '*',
    });
    layerVersionPermission.deletionPolicy(DeletionPolicy.Retain);
    let temp : string = `LambdaLayerPermission${permissions}${account}`
    layerVersionPermission.Properties.Principal = `${account}`;
    cfnObj.Resources[temp] = layerVersionPermission;
  })
}