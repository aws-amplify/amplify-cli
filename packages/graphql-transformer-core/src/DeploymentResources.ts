import { Template } from 'cloudform-types';

export interface ResolverMap {
    [path: string]: string
}
export interface ResolversFunctionsAndSchema {
    // Resolver templates keyed by their filename.
    resolvers: ResolverMap
    // Code for any functions that need to be deployed.
    functions: {
        [path: string]: string
    },
    // The full GraphQL schema.
    schema: string
}

/**
 * Stack resources
 */
export interface StackResources {
    // The root stack template.
    rootStack: Template,
    // All the nested stack templates.
    stacks: {
        [name: string]: Template
    }
}
/**
 * The full set of resources needed for the deployment.
 */
export interface DeploymentResources extends ResolversFunctionsAndSchema, StackResources {}