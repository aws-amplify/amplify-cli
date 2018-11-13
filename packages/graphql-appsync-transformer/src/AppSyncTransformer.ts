import { Transformer, TransformerContext, stripDirectives } from "graphql-transformer-core";
import {
    print,
    TypeDefinitionNode,
    Kind,
    ObjectTypeDefinitionNode
} from "graphql";

import { ResourceFactory } from "./resources";
import { ResourceConstants, blankObject, makeSchema, makeOperationType } from "graphql-transformer-common";
import Resource from "cloudform/types/resource";

import fs = require('fs');
import { normalize } from "path";

export class AppSyncTransformer extends Transformer {

    resources: ResourceFactory
    outputPath: string

    constructor(outputPath?: string) {
        super(
            'AppSyncTransformer',
            'directive @ignore on OBJECT'  // TODO: this not a real directive
        )
        this.resources = new ResourceFactory();

        if (outputPath) {
            this.outputPath = normalize(outputPath)
        }
    }

    public before = (ctx: TransformerContext): void => {
        // Some downstream resources depend on this so put a placeholder in and
        // overwrite it in the after
        const conditions = this.resources.makeEnvironmentConditions()
        const schemaResource = this.resources.makeAppSyncSchema('placeholder')
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
        ctx.mergeConditions(conditions)
    }

    public after = (ctx: TransformerContext): void => {
        if (!this.outputPath) {
            this.printWithoutFilePath(ctx);
        } else {
            this.printWithFilePath(ctx);
        }
    }

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

    private printWithoutFilePath(ctx: TransformerContext): void {
        const SDL = this.buildSchema(ctx)
        const schemaResource = this.resources.makeAppSyncSchema(SDL)
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }

    private printWithFilePath(ctx: TransformerContext): void {

        if (!fs.existsSync(this.outputPath)) {
            fs.mkdirSync(this.outputPath);
        }

        const resolverFilePath = normalize(this.outputPath + '/resolvers')
        if (fs.existsSync(resolverFilePath)) {
            const files = fs.readdirSync(resolverFilePath)
            files.forEach(file => fs.unlinkSync(resolverFilePath + '/' + file))
            fs.rmdirSync(resolverFilePath)
        }

        const templateResources: { [key: string]: Resource } = ctx.template.Resources

        const resolverParams = this.resources.makeResolverS3RootParams()
        ctx.mergeParameters(resolverParams.Parameters);

        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type === 'AWS::AppSync::Resolver') {
                this.writeResolverToFile(resourceName, ctx)
            } else if (resource.Type === 'AWS::Lambda::Function') {
                this.writeLamdbaFunctionToFile(resourceName, ctx)
            } else if (resource.Type === 'AWS::AppSync::GraphQLSchema') {
                this.writeSchemaToFile(resourceName, ctx)
            }
        }
    }

    private writeResolverToFile(resourceName: string, ctx: TransformerContext): void {
        const resolverFilePath = normalize(this.outputPath + '/resolvers')
        if (!fs.existsSync(resolverFilePath)) {
            fs.mkdirSync(resolverFilePath);
        }

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
            const reqFileName = `${reqType}.${reqFieldName}.request`
            fs.writeFileSync(`${resolverFilePath}/${reqFileName}`, requestMappingTemplate)

            const respType = resolverResource.Properties.TypeName
            const respFieldName = resolverResource.Properties.FieldName
            const respFileName = `${respType}.${respFieldName}.response`
            fs.writeFileSync(`${resolverFilePath}/${respFileName}`, responseMappingTemplate)

            const updatedResolverResource = this.resources.updateResolverResource(resolverResource)
            ctx.setResource(resourceName, updatedResolverResource)
        }
    }

    private writeSchemaToFile(resourceName: string, ctx: TransformerContext): void {

        const SDL = this.buildSchema(ctx)
        const schemaPath = normalize(this.outputPath + '/schema.graphql')
        fs.writeFileSync(schemaPath, SDL)

        const schemaParam = this.resources.makeSchemaParam()
        ctx.mergeParameters(schemaParam.Parameters)

        const schemaResource = this.resources.makeAppSyncSchema()
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }

    private writeLamdbaFunctionToFile(resourceName: string, ctx: TransformerContext): void {

        const functionPath = normalize(this.outputPath + '/functions')
        if (!fs.existsSync(functionPath)) {
            fs.mkdirSync(functionPath);
        }
        const sourcePath = normalize(ctx.metadata.get('ElasticSearchPathToStreamingLambda'))
        const destPath = normalize(`${this.outputPath}/functions/python_streaming_function.zip`)

        const lambdaCode = fs.readFileSync(sourcePath)
        fs.writeFileSync(destPath, lambdaCode)
    }
}
