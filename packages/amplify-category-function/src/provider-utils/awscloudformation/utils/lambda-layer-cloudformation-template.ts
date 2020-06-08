import { Fn, DeletionPolicy } from 'cloudform';
import _ from 'lodash';
import Lambda from 'cloudform-types/types/lambda';
import { Permissions} from './layerParams';


export default function generateLayerCfnObj(parameters) {

  const cfnObj = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda Layer resource stack creation using Amplify CLI',
    Parameters: {
      layerVersion:{
        Type: 'String',
        Default: '1'
      },
      env: {
        Type: "String"
      }
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
    Conditions: {
      HasEnvironmentParameter: {
        "Fn::Not": [
          {
            "Fn::Equals": [
                {
                    Ref: "env"
                },
                "NONE"
            ]
          }
        ]
      }
    }
  };
  const POLICY_RETAIN = DeletionPolicy.Retain;
  const layer = new Lambda.LayerVersion({
    CompatibleRuntimes: parameters.runtimes.map(runtime => runtime.cloudTemplateValue),
    Content: {
      S3Bucket: Fn.Ref('deploymentBucketName'),
      S3Key: Fn.Ref('s3Key'),
    },
    Description: parameters.description || '',
    LayerName: joinWithEnv('-', [parameters.layerName]),
    LicenseInfo: 'MIT',
  });
  layer.deletionPolicy(POLICY_RETAIN);
  _.assign(layer, { UpdateReplacePolicy: POLICY_RETAIN });

  cfnObj.Resources["LambdaLayer"] = layer;

  // parameters.laatestLayerVersion is defined
  Object.entries(parameters.layerVersionsMap).forEach(([key , value]) => {
    parameters.layerVersionsMap[key].forEach(permissions => {
      if (permissions.type === Permissions.awsAccounts) {
         assignLayerPermissionsAccounts(cfnObj,parameters,permissions.type,key);
       }
       else if (permissions.type === Permissions.awsOrg){
         assignLayerPermissionsOrgs(cfnObj,parameters,permissions.type,key);
       }
       else{
         assignLayerPermissions(cfnObj,parameters,permissions.type,key)
       }
     });
  })
  return cfnObj;
}

function assignLayerPermissions(cfnObj,parameters,permissions,version){
    // assign permissions
    const layerVersionPermissionInput = {
      Action: 'lambda:GetLayerVersion',
      LayerVersionArn: parameters.layerVersion !== version ? createLayerversionArn(parameters,version) : Fn.Ref("LambdaLayer")
    };
  let layerVersionPermission = new Lambda.LayerVersionPermission({
    ...layerVersionPermissionInput,
    Principal: '*',
  });
  layerVersionPermission.deletionPolicy(DeletionPolicy.Retain);
  let temp : string = `LambdaLayerPermission${permissions}${version}`
  if(permissions === Permissions.public){
    layerVersionPermission.Properties.Principal = "*";
    cfnObj.Resources[temp] = layerVersionPermission;
  }
  else{
    layerVersionPermission.Properties.Principal = Fn.Ref("AWS::AccountId");
    cfnObj.Resources[temp] = layerVersionPermission;
  }
}

function assignLayerPermissionsOrgs(cfnObj,parameters,permissions,version){
  // assign permissions
  let whitelistOrgIds = parameters.layerVersionsMap[version].filter(val =>  val.type === permissions)[0].orgs;
  whitelistOrgIds.forEach(org => {
    const layerVersionPermissionInput = {
      Action: 'lambda:GetLayerVersion',
      LayerVersionArn: parameters.layerVersion !== version ? createLayerversionArn(parameters,version) : Fn.Ref("LambdaLayer"),
    };
    let layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: '*',
    });
    layerVersionPermission.deletionPolicy(DeletionPolicy.Retain);
    let temp : string = `LambdaLayerPermission${permissions}${org.replace('-','')}${version}`
    layerVersionPermission.Properties.OrganizationId = `${org}`;
    cfnObj.Resources[temp] = layerVersionPermission;
  })
}

function assignLayerPermissionsAccounts(cfnObj,parameters,permissions,version){
  // assign permissions
  let whitelistAccountIds = parameters.layerVersionsMap[version].filter(val =>  val.type === permissions)[0].accounts;
  whitelistAccountIds.forEach(account => {
    const layerVersionPermissionInput = {
      Action: 'lambda:GetLayerVersion',
      LayerVersionArn: parameters.layerVersion !== version ? createLayerversionArn(parameters,version) : Fn.Ref("LambdaLayer"),
    };
    let layerVersionPermission = new Lambda.LayerVersionPermission({
      ...layerVersionPermissionInput,
      Principal: '*',
    });
    layerVersionPermission.deletionPolicy(DeletionPolicy.Retain);
    let temp : string = `LambdaLayerPermission${permissions}${account}${version}`
    layerVersionPermission.Properties.Principal = `${account}`;
    cfnObj.Resources[temp] = layerVersionPermission;
  })
}

export function joinWithEnv(separator: string, listToJoin: any[]) {
  return Fn.If(
    "HasEnvironmentParameter",
    Fn.Join(separator, [...listToJoin, Fn.Ref("env")]),
    listToJoin[0]
  );
}

export function createLayerversionArn(parameters,version){
  //arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
  return Fn.Sub('arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:${layerName}:${layerVersion}', {
    layerName: joinWithEnv('-', [parameters.layerName]),
    layerVersion: version
  })
}