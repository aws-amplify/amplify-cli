import { TransformConfig } from './transformer-config';
export type Template = {
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
  Conditions: Record<string, any>;
};

export interface TransformerProjectConfig {
  schema: string;
  functions: Record<string, string>;
  pipelineFunctions: Record<string, string>;
  resolvers: Record<string, string>;
  stacks: Record<string, Template>;
  config: TransformConfig;
}
