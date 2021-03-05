import { DeletionPolicy, Fn, IntrinsicFunction, Refs } from 'cloudform-types';
import Lambda from 'cloudform-types/types/lambda';
import { isMultiEnvLayer, LayerMetadata, LayerParameters, LayerVersionCfnMetadata, Permission } from './layerParams';
import uuid from 'uuid';

function getLayerCfnObjBase() {
  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'Lambda layer resource stack creation using Amplify CLI',
    Parameters: {
      env: {
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
  });
  return layerVersionPermissions;
}

// e.g. arn:aws:lambda:us-west-2:136981144547:layer:layers089e3f8b-dev:1
function getLayerVersionArn(layerVersionMeta: LayerVersionCfnMetadata) {
  return layerVersionMeta?.LayerVersionArn || Fn.Ref(layerVersionMeta.LogicalName);
}
