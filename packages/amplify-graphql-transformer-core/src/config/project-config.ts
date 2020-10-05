import { TransformConfig } from './transformer-config'
// Todo: Cast this to proper CFN template type
export type Template = {
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
  Conditions: Record<string, any>;
};

export interface TransformerProjectConfig {
  schema: string;
  functions: {
    [k: string]: string;
  };
  pipelineFunctions: {
    [k: string]: string;
  };
  resolvers: {
    [k: string]: string;
  };
  stacks: {
    [k: string]: Template;
  };
  config: TransformConfig;
  // Custom transformer plugins
  transformers?: string[];
}
