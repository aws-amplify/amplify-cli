import { Template } from 'cloudform-types';
import { NestedStacks } from './util/splitStack'

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
 * The full set of resources needed for the deployment.
 */
export interface DeploymentResources extends ResolversFunctionsAndSchema, NestedStacks {}
export default DeploymentResources