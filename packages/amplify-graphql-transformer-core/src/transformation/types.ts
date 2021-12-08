export default interface Template {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: Record<string, any>;
  Parameters?: Record<string, any>;
  Mappings?: {
    [key: string]: {
      [key: string]: Record<string, string | number | string[]>;
    };
  };
  Conditions?: Record<string, any>;
  Transform?: any;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
}

export interface NestedStacks {
  // The root stack template.
  rootStack: Template;
  // All the nested stack templates.
  stacks: Record<string, Template>;
  // The full stack mapping for the deployment.
  stackMapping: Record<string, string>;
}

export type StringMap = Record<string, string>;

export type ResolverMap = StringMap;
export type PipelineFunctionMap = StringMap;
export interface ResolversFunctionsAndSchema {
  // Resolver templates keyed by their filename.
  resolvers: ResolverMap;
  // Contains mapping templates for pipeline functions.
  pipelineFunctions: PipelineFunctionMap;
  // Code for any functions that need to be deployed.
  functions: Record<string, string>;
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

export type UserDefinedSlot = {
  resolverTypeName: string;
  resolverFieldName: string;
  slotName: string;
  requestResolver?: UserDefinedResolver;
  responseResolver?: UserDefinedResolver;
};

export type UserDefinedResolver = {
  fileName: string;
  template: string;
};

export type OverrideConfig = {
  overrideFlag: boolean;
  overrideDir: string;
  resourceName: string;
};
