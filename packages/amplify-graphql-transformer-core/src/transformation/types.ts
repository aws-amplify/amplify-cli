export default interface Template {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: {
    [key: string]: any;
  };
  Parameters?: {
    [key: string]: any;
  };
  Mappings?: {
    [key: string]: {
      [key: string]: {
        [key: string]: string | number | string[];
      };
    };
  };
  Conditions?: {
    [key: string]: any;
  };
  Transform?: any;
  Resources?: {
    [key: string]: any;
  };
  Outputs?: {
    [key: string]: any;
  };
}

export interface NestedStacks {
  // The root stack template.
  rootStack: Template;
  // All the nested stack templates.
  stacks: {
    [name: string]: Template;
  };
  // The full stack mapping for the deployment.
  stackMapping: { [resourceId: string]: string };
}

export type StringMap = {
  [path: string]: string;
};

export type ResolverMap = StringMap;
export type PipelineFunctionMap = StringMap;
export interface ResolversFunctionsAndSchema {
  // Resolver templates keyed by their filename.
  resolvers: ResolverMap;
  // Contains mapping templates for pipeline functions.
  pipelineFunctions: PipelineFunctionMap;
  // Code for any functions that need to be deployed.
  functions: {
    [path: string]: string;
  };
  // The full GraphQL schema.
  schema: string;
}
export interface StackMapping {
  [resourceId: string]: string;
}

/**
 * The full set of resources needed for the deployment.
 */
export interface DeploymentResources extends ResolversFunctionsAndSchema, NestedStacks {
  // The full stack mapping for the deployment.
  stackMapping: StackMapping;
}
