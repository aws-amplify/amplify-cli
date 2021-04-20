import { LambdaLayer, ProjectLayer } from 'amplify-function-plugin-interface';
import { isMultiEnvLayer } from './layerHelpers';

/**
 * Convert the internal LambdaLayer[] structure into an array that can be JSON.stringify-ed into valid CFN
 */
export const convertLambdaLayerMetaToLayerCFNArray = (
  input: LambdaLayer[],
  env: string,
): (string | { 'Fn::Sub': string } | { Ref: string })[] => {
  return input.map(layer => {
    if (layer.type === 'ProjectLayer') {
      if (isMultiEnvLayer(layer.resourceName)) {
        return convertProjectLayer(layer, env);
      }
      return convertProjectLayer(layer);
    }
    return layer.arn;
  });
};

export const convertProjectLayer = (layer: ProjectLayer, env?: string) => {
  if (!layer.isLatestVersionSelected) {
    if (env) {
      return {
        'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}-${env}:${layer.version}`,
      };
    }
    return {
      'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}:${layer.version}`,
    };
  }
  return {
    Ref: `function${layer.resourceName}Arn`,
  };
};
