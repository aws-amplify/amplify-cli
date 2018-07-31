import { Transformer, TransformerContext } from "amplify-graphql-transform";
import {
    buildASTSchema,
    printSchema
} from "graphql";

import { ResourceFactory } from "./resources";
import { ResourceConstants } from "../node_modules/amplify-graphql-transformer-common/lib";
import Resource from "../../amplify-graphql-transform/node_modules/cloudform/types/resource";

import fs = require('fs');
import { normalize } from "path";

export class AppSyncFileTransformer extends Transformer {

    resources: ResourceFactory
    filePath: string

    constructor(filePath?: string) {
        super(
            'AppSyncFileTransformer',
            'directive @file on OBJECT'  // TODO: this not a real directive
        )
        this.resources = new ResourceFactory();

        if (filePath) {
            this.filePath = normalize(filePath)
        }
    }

    public before = (ctx: TransformerContext): void => {
        if (!this.filePath) {
            return;
        }
    }

    public after = (ctx: TransformerContext): void => {
        
        if (!this.filePath) {
            this.printWithoutFilePath(ctx);
        } else {
            this.printWithFilePath(ctx);
        }
    }

    private buildSchema(ctx: TransformerContext) : string {
        const built = buildASTSchema({
            kind: 'Document',
            definitions: Object.keys(ctx.nodeMap).map((k: string) => ctx.nodeMap[k])
        })
        const SDL = printSchema(built)
        return SDL;
    }
    

    private printWithoutFilePath(ctx: TransformerContext) : void {
        const SDL = this.buildSchema(ctx)
        const schemaResource = this.resources.makeAppSyncSchema(SDL)
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }

    private printWithFilePath(ctx: TransformerContext) : void {

        if (!fs.existsSync(this.filePath)){
            fs.mkdirSync(this.filePath);
        }

        const templateResources: { [key: string]: Resource } = ctx.template.Resources
        
        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type == 'AWS::AppSync::Resolver') {
                this.writeResolverToFile(resourceName, ctx)
            } else if (resource.Type == 'AWS::Lambda::Function') {
                this.writeLamdbaFunctionToFile(resourceName, ctx)
            } else if (resource.Type == 'AWS::AppSync::GraphQLSchema') {
                this.writeSchemaToFile(resourceName, ctx)
            }
        }
    }

    private writeResolverToFile(resourceName: string, ctx: TransformerContext) : void {
        const resolverFilePath = normalize(this.filePath + '/resolver')
        if (!fs.existsSync(resolverFilePath)){
            fs.mkdirSync(resolverFilePath);
        }

        const resolverResource = ctx.template.Resources[resourceName]
        
        const requestMappingTemplate = resolverResource.Properties.RequestMappingTemplate
        const reqType = resolverResource.Properties.TypeName
        const reqFieldName = resolverResource.Properties.FieldName
        const reqFileName = `${reqType}.${reqFieldName}.request`
        fs.writeFileSync(`${resolverFilePath}/${reqFileName}`, requestMappingTemplate)

        const reqParam = this.resources.makeResolverParam(reqFileName);
        ctx.mergeParameters(reqParam.Parameters);

        const responseMappingTemplate = resolverResource.Properties.ResponseMappingTemplate
        const respType = resolverResource.Properties.TypeName
        const respFieldName = resolverResource.Properties.FieldName
        const respFileName = `${respType}.${respFieldName}.response`
        fs.writeFileSync(`${resolverFilePath}/${respFileName}`, responseMappingTemplate)

        const respParam = this.resources.makeResolverParam(respFileName);
        ctx.mergeParameters(respParam.Parameters);

        const updatedResolverResource = this.resources.updateResolverResource(resolverResource, reqFileName, respFileName)
        ctx.setResource(resourceName, updatedResolverResource)
    }

    private writeSchemaToFile(resourceName: string, ctx: TransformerContext) : void {

        const SDL = this.buildSchema(ctx)
        const schemaPath = normalize(this.filePath + '/schema.graphql')
        fs.writeFileSync(schemaPath, SDL)

        const schemaParam = this.resources.makeSchemaParam()
        ctx.mergeParameters(schemaParam.Parameters)
        
        const schemaResource = this.resources.makeAppSyncSchema()
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }

    private writeLamdbaFunctionToFile(resourceName: string, ctx: TransformerContext) : void {

        const functionPath = normalize(this.filePath + '/function')
        if (!fs.existsSync(functionPath)){
            fs.mkdirSync(functionPath);
        }
        const sourcePath = normalize(`${__dirname}/../node_modules/amplify-graphql-elasticsearch-transformer/streaming-lambda/python_streaming_function.py`)
        const destPath = normalize(`${this.filePath}/function/python_streaming_function.py`)
        fs.copyFileSync(
            sourcePath,
            destPath)
    }
}
