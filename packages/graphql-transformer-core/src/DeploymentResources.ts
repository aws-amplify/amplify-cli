import { Template } from 'cloudform-types';
import { NestedStacks } from './util/splitStack'

export type StringMap = {
    [path: string]: string
}
export type ResolverMap = StringMap
export type PipelineFunctionMap = StringMap
export interface ResolversFunctionsAndSchema {
    // Resolver templates keyed by their filename.
    resolvers: ResolverMap
    // Contains mapping templates for pipeline functions.
    pipelineFunctions: PipelineFunctionMap
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