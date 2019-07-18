import TransformerContext from "./TransformerContext";
import { StringParameter } from 'cloudform-types';
import Resource from "cloudform-types/types/resource";
import { Fn } from "cloudform-types";
import {
    makeOperationType,
    makeSchema
} from 'graphql-transformer-common';
import { ObjectTypeDefinitionNode, print } from "graphql";
import { stripDirectives } from "./stripDirectives";
import { SchemaResourceUtil } from "./util/SchemaResourceUtil";
import splitStack, { StackRules } from './util/splitStack'
import { DeploymentResources, ResolversFunctionsAndSchema, ResolverMap } from './DeploymentResources';
import { ResourceConstants } from "graphql-transformer-common";

export class TransformFormatter {

    private schemaResourceUtil = new SchemaResourceUtil()

    /**
     * Formats the ctx into a set of deployment resources.
     * @param ctx the transformer context.
     * Returns all the deployment resources for the transformation.
     */
    public format(ctx: TransformerContext): DeploymentResources {
        ctx.mergeConditions(this.schemaResourceUtil.makeEnvironmentConditions())
        const resolversFunctionsAndSchema = this.collectResolversFunctionsAndSchema(ctx);
        const defaultDependencies = [ResourceConstants.RESOURCES.GraphQLSchemaLogicalID];
        if (ctx.getResource(ResourceConstants.RESOURCES.NoneDataSource)) {
            defaultDependencies.push(ResourceConstants.RESOURCES.NoneDataSource);
        }
        const nestedStacks = splitStack({
            stack: ctx.template,
            stackRules: ctx.getStackMapping(),
            defaultParameterValues: {
                [ResourceConstants.PARAMETERS.AppSyncApiId]: Fn.GetAtt(
                    ResourceConstants.RESOURCES.GraphQLAPILogicalID,
                    "ApiId"
                )
            },
            defaultParameterDefinitions: {
                [ResourceConstants.PARAMETERS.AppSyncApiId]: new StringParameter({
                    Description: `The id of the AppSync API associated with this project.`,
                })
            },
            deployment: {
                deploymentBucketParameterName: ResourceConstants.PARAMETERS.S3DeploymentBucket,
                deploymentKeyParameterName: ResourceConstants.PARAMETERS.S3DeploymentRootKey
            },
            importExportPrefix: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
            defaultDependencies
        })
        return {
            ...nestedStacks,
            ...resolversFunctionsAndSchema
        };
    }

    /**
     * Schema helper to pull resources from the context and output the final schema resource.
     */
    private buildSchema(ctx: TransformerContext): string {
        const mutationNode: ObjectTypeDefinitionNode | undefined = ctx.getMutation()
        const queryNode: ObjectTypeDefinitionNode | undefined = ctx.getQuery()
        const subscriptionNode: ObjectTypeDefinitionNode | undefined = ctx.getSubscription()
        let includeMutation = true
        let includeQuery = true
        let includeSubscription = true
        if (!mutationNode || mutationNode.fields.length === 0) {
            delete ctx.nodeMap.Mutation
            includeMutation = false
        }
        if (!queryNode || queryNode.fields.length === 0) {
            delete ctx.nodeMap.Query
            includeQuery = false
        }
        if (!subscriptionNode || subscriptionNode.fields.length === 0) {
            delete ctx.nodeMap.Subscription
            includeSubscription = false
        }
        const ops = []
        if (includeQuery) {
            ops.push(makeOperationType('query', queryNode.name.value))
        }
        if (includeMutation) {
            ops.push(makeOperationType('mutation', mutationNode.name.value))
        }
        if (includeSubscription) {
            ops.push(makeOperationType('subscription', subscriptionNode.name.value))
        }
        const schema = makeSchema(ops)
        ctx.putSchema(schema)
        const astSansDirectives = stripDirectives({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map((k: string) => ctx.getType(k))
        }, ['aws_subscribe', 'aws_auth'])
        const SDL = print(astSansDirectives)
        return SDL;
    }

    /**
     * Builds the schema and creates the schema record to pull from S3.
     * Returns the schema SDL text as a string.
     */
    private buildAndSetSchema(ctx: TransformerContext): string {
        const SDL = this.buildSchema(ctx)
        const schemaResource = this.schemaResourceUtil.makeAppSyncSchema()
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
        return SDL
    }

    private collectResolversFunctionsAndSchema(ctx: TransformerContext): ResolversFunctionsAndSchema {
        const resolverParams = this.schemaResourceUtil.makeResolverS3RootParams()
        ctx.mergeParameters(resolverParams.Parameters);
        const templateResources: { [key: string]: Resource } = ctx.template.Resources
        let resolverMap = {}
        let pipelineFunctionMap = {}
        let functionsMap = {}
        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type === 'AWS::AppSync::Resolver') {
                const resourceResolverMap = this.replaceResolverRecord(resourceName, ctx)
                resolverMap = { ...resolverMap, ...resourceResolverMap }
            } else if (resource.Type === 'AWS::AppSync::FunctionConfiguration') {
                const functionConfigMap = this.replaceFunctionConfigurationRecord(resourceName, ctx)
                pipelineFunctionMap = { ...pipelineFunctionMap, ...functionConfigMap }
            } else if (resource.Type === 'AWS::Lambda::Function') {
                // TODO: We only use the one function for now. Generalize this.
                functionsMap = {
                    ...functionsMap,
                    [`${resourceName}.zip`]: ctx.metadata.get('ElasticsearchPathToStreamingLambda')
                }
            }
        }
        const schema = this.buildAndSetSchema(ctx);
        return {
            resolvers: resolverMap,
            functions: functionsMap,
            pipelineFunctions: pipelineFunctionMap,
            schema
        }
    }

    private replaceResolverRecord(resourceName: string, ctx: TransformerContext): ResolverMap {
        const resolverResource = ctx.template.Resources[resourceName]

        const requestMappingTemplate = resolverResource.Properties.RequestMappingTemplate
        const responseMappingTemplate = resolverResource.Properties.ResponseMappingTemplate
        // If the templates are not strings. aka they use CF intrinsic functions don't rewrite.
        if (
            typeof requestMappingTemplate === 'string' &&
            typeof responseMappingTemplate === 'string'
        ) {
            const reqType = resolverResource.Properties.TypeName
            const reqFieldName = resolverResource.Properties.FieldName
            const reqFileName = `${reqType}.${reqFieldName}.req.vtl`

            const respType = resolverResource.Properties.TypeName
            const respFieldName = resolverResource.Properties.FieldName
            const respFileName = `${respType}.${respFieldName}.res.vtl`

            const updatedResolverResource = this.schemaResourceUtil.updateResolverResource(resolverResource)
            ctx.setResource(resourceName, updatedResolverResource)
            return {
                [reqFileName]: requestMappingTemplate,
                [respFileName]: responseMappingTemplate
            }
        }
        return {}
    }

    private replaceFunctionConfigurationRecord(resourceName: string, ctx: TransformerContext): ResolverMap {
        const functionConfiguration = ctx.template.Resources[resourceName]

        const requestMappingTemplate = functionConfiguration.Properties.RequestMappingTemplate
        const responseMappingTemplate = functionConfiguration.Properties.ResponseMappingTemplate
        // If the templates are not strings. aka they use CF intrinsic functions don't rewrite.
        if (
            typeof requestMappingTemplate === 'string' &&
            typeof responseMappingTemplate === 'string'
        ) {
            const reqFileName = `${functionConfiguration.Properties.Name}.req.vtl`
            const respFileName = `${functionConfiguration.Properties.Name}.res.vtl`
            const updatedResolverResource = this.schemaResourceUtil.updateFunctionConfigurationResource(functionConfiguration)
            ctx.setResource(resourceName, updatedResolverResource)
            return {
                [reqFileName]: requestMappingTemplate,
                [respFileName]: responseMappingTemplate
            }
        }
        return {}
    }
}
