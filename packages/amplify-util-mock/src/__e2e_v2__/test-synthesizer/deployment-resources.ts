import { $TSAny } from '@aws-amplify/amplify-cli-core';

export interface Template {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: Record<string, $TSAny>;
  Parameters?: Record<string, $TSAny>;
  Mappings?: {
    [key: string]: {
      [key: string]: Record<string, string | number | string[]>;
    };
  };
  Conditions?: Record<string, $TSAny>;
  Transform?: $TSAny;
  Resources?: Record<string, $TSAny>;
  Outputs?: Record<string, $TSAny>;
}

export interface StackMapping {
  [resourceId: string]: string;
}

export interface ResolversFunctionsAndSchema {
  // Resolver templates keyed by their filename.
  resolvers: Record<string, string>;
  // Contains mapping templates for pipeline functions.
  pipelineFunctions: Record<string, string>;
  // Code for any functions that need to be deployed.
  functions: Record<string, string>;
  // The full GraphQL schema.
  schema: string;
  // List of the user overridden slots
  userOverriddenSlots: string[];
}

export interface NestedStacks {
  // The root stack template.
  rootStack: Template;
  // All the nested stack templates.
  stacks: Record<string, Template>;
  // The full stack mapping for the deployment.
  stackMapping: Record<string, string>;
}

/**
 * The full set of resources needed for the deployment.
 */
export interface DeploymentResources extends ResolversFunctionsAndSchema, NestedStacks {
  // The full stack mapping for the deployment.
  stackMapping: StackMapping;
}
