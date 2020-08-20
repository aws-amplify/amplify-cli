import { LambdaLayer, ProjectLayer } from 'amplify-function-plugin-interface';
import { isMultiEnvLayer } from './layerParams';

/**
 * Convert the internal LambdaLayer[] structure into an array that can be JSON.stringify-ed into valid CFN
 */
export const convertLambdaLayerMetaToLayerCFNArray = (
  context: any,
  input: LambdaLayer[],
  env: string,
): (string | { 'Fn::Sub': string })[] => {
  return input.map(layer => (layer.type === 'ProjectLayer' ? convertProjectLayer(context, layer, env) : layer.arn));
};

const convertProjectLayer = (context: any, layer: ProjectLayer, env: string) => {
  if (isMultiEnvLayer(context, layer.resourceName)) {
    return {
      'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}-${env}:${layer.version}`,
    };
  }
  return {
    'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}:${layer.version}`,
  };
};
