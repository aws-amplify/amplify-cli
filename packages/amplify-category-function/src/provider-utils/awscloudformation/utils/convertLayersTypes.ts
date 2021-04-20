import { ExternalLayer, LambdaLayer, ProjectLayer } from 'amplify-function-plugin-interface';
import { convertProjectLayer } from './layerArnConverter';

const LAYER_ARN_KEY = 'Fn::Sub';

export const convertProjectLayersToExternalLayers = (lambdaLayers: LambdaLayer[], envName: string): LambdaLayer[] => {
  const modifiedLambdaLayers: LambdaLayer[] = [];
  lambdaLayers.forEach(layer => {
    if (layer.type === 'ProjectLayer' && layer.env !== envName && !layer.isLatestVersionSelected) {
      const convertLayer: ExternalLayer = {
        type: 'ExternalLayer',
        arn: convertProjectLayer(layer, envName),
      };
      modifiedLambdaLayers.push(convertLayer);
    } else {
      const convertLayer: ProjectLayer = {
        type: 'ProjectLayer',
        resourceName: (layer as ProjectLayer).resourceName,
        version: (layer as ProjectLayer).version,
        isLatestVersionSelected: true,
        env: envName,
      };
      modifiedLambdaLayers.push(convertLayer);
    }
  });
  return modifiedLambdaLayers;
};

export const covertExternalLayersToProjectLayers = (lambdaLayers: LambdaLayer[], envName: string): LambdaLayer[] => {
  const modifiedLambdaLayers: LambdaLayer[] = [];
  lambdaLayers.forEach(layer => {
    if (layer.type === 'ExternalLayer' && layer.arn.hasOwnProperty(LAYER_ARN_KEY)) {
      const layerArn = layer.arn[LAYER_ARN_KEY];
      const layerNameWithEnv = layerArn.split(':')[layerArn.split(':').length - 2];
      const layerVersion = parseInt(layerArn.split(':')[layerArn.split(':').length - 1], 10);
      const layerName = layerNameWithEnv.split('-')[0];
      const layerEnv = layerNameWithEnv.split('-')[1];
      if (envName !== layerEnv) {
        modifiedLambdaLayers.push(layer);
      } else {
        modifiedLambdaLayers.push({
          type: 'ProjectLayer',
          resourceName: layerName,
          version: layerVersion,
          isLatestVersionSelected: false,
          env: layerEnv,
        });
      }
    }
  });
  return modifiedLambdaLayers;
};
