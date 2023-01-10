import { ExternalLayer, LambdaLayer, ProjectLayer } from 'amplify-function-plugin-interface';
import { convertProjectLayer } from './layerArnConverter';
const externalLayer = 'ExternalLayer';
const projectLayer = 'ProjectLayer';

const LAYER_ARN_KEY = 'Fn::Sub';

// convert project layers to external when changing env
// only latest version layer will remain a project layer
export const convertProjectLayersToExternalLayers = (lambdaLayers: LambdaLayer[], envName: string): LambdaLayer[] => {
  const modifiedLambdaLayers: LambdaLayer[] = [];
  lambdaLayers.forEach(layer => {
    if (layer.type === projectLayer) {
      if (layer.env !== envName && !layer.isLatestVersionSelected) {
        const convertLayer: ExternalLayer = {
          type: externalLayer,
          arn: convertProjectLayer(layer, layer.env),
        };
        modifiedLambdaLayers.push(convertLayer);
      } else {
        const typedProjectLayer = <ProjectLayer>layer;
        const convertLayer: ProjectLayer = {
          type: projectLayer,
          resourceName: typedProjectLayer.resourceName,
          version: typedProjectLayer.version,
          isLatestVersionSelected: true,
          env: envName,
        };
        modifiedLambdaLayers.push(convertLayer);
      }
    }
  });
  return modifiedLambdaLayers;
};

//This functions convert external layers to project layers if they belong to the env
// exmaple Arn to convert external layers to project Layers when changing env
// "Fn::Sub": "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:layer:buildlayers8mytestinglayer1-dev:2"
export const convertExternalLayersToProjectLayers = (lambdaLayers: LambdaLayer[], envName: string): LambdaLayer[] => {
  const modifiedLambdaLayers: LambdaLayer[] = [];
  lambdaLayers.forEach(layer => {
    if (layer.type === externalLayer && Object.prototype.hasOwnProperty.call(layer.arn, LAYER_ARN_KEY)) {
      const layerArn = layer.arn[LAYER_ARN_KEY];
      const layerArnSplit = layerArn.split(':');
      const layerNameWithEnv = layerArnSplit[layerArnSplit.length - 2];
      const layerVersion = parseInt(layerArnSplit[layerArnSplit.length - 1], 10);
      const [layerName, layerEnv] = layerNameWithEnv.split('-');
      if (envName !== layerEnv) {
        modifiedLambdaLayers.push(layer);
      } else {
        modifiedLambdaLayers.push({
          type: projectLayer,
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
