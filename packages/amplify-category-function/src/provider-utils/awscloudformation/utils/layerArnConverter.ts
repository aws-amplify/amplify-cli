import { LambdaLayer, ProjectLayer } from 'amplify-function-plugin-interface';

/**
 * Convert the internal LambdaLayer[] structure into an array that can be JSON.stringify-ed into valid CFN
 */
export const convertLambdaLayerMetaToLayerCFNArray = (input: LambdaLayer[], env: string): (string | { 'Fn::Sub': string })[] => {
  return input.map(layer => (layer.type === 'ProjectLayer' ? convertProjectLayer(layer, env) : layer.arn));
};

const convertProjectLayer = (layer: ProjectLayer, env: string) => {
  return {
    'Fn::Sub': `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:layer:${layer.resourceName}-${env}:${layer.version}`,
  };
};
