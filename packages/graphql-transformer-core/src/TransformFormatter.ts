import TransformerContext from "./TransformerContext";
import Template from "cloudform/types/template";
import { getTemplateReferences, ReferenceMap } from './util/getTemplateReferences';
import Resource from "cloudform/types/resource";
import blankTemplate from './util/blankTemplate';
import { Fn, Refs } from "cloudform";
import {
    makeOperationType,
    makeSchema
} from 'graphql-transformer-common';
import { ObjectTypeDefinitionNode, print } from "graphql";
import { stripDirectives } from "./stripDirectives";
import { SchemaResourceUtil } from "./util/schemaResourceUtil";
import { DeploymentResources, ResolversFunctionsAndSchema, ResolverMap } from './DeploymentResources';
import { ResourceConstants } from "graphql-transformer-common";
import fs = require('fs');
import { normalize } from 'path';

interface StackExprMap {
    [key: string]: RegExp[];
}
interface TransformFormatterOptions {
    stackRules: StackExprMap,
    outputPath?: string
}
export class TransformFormatter {

    private opts: TransformFormatterOptions;
    private schemaResourceUtil = new SchemaResourceUtil()

    constructor(opts: TransformFormatterOptions) {
        this.opts = opts;
    }

    /**
     * Formats the ctx into a set of deployment resources.
     * @param ctx the transformer context.
     * Returns all the deployment resources for the transformation.
     */
    public format(ctx: TransformerContext): DeploymentResources {
        const resolversFunctionsAndSchema = this.collectResolversFunctionsAndSchema(ctx);
        const stacks = this.splitContextIntoTemplates(ctx.template);
        const rootStack = stacks.root;
        delete(stacks.root);
        return {
            rootStack,
            stacks,
            ...resolversFunctionsAndSchema
        };
    }

    /**
     * Iterate through the keys in the template and applies regex's one by
     * one until a match is found. Once a match is found, that resource is
     * added to the stack specified by the key of the StackExprMap. After a
     * resource is tagged into a stack, all references to that resource
     * are replaced with a corresponding import export statement in the
     * nested stacks.
     * @param context The transformer context.
     */
    private splitContextIntoTemplates(template: Template): any {
        // Pre-compute a reference map that tells us the location
        // of every Fn.Ref and Fn.GetAtt in the template.
        const templateJson: any = JSON.parse(JSON.stringify(template));
        const referenceMap = getTemplateReferences(templateJson);
        const resourceToStackMap = this.mapResourcesToStack(templateJson);
        this.replaceReferencesWithImports(templateJson, referenceMap, resourceToStackMap);
        const templateMap = this.collectTemplates(templateJson, resourceToStackMap)
        return templateMap;
    }

    private replaceReferencesWithImports(
        template: Template,
        referenceMap: ReferenceMap,
        resourceToStackMap: { [k: string]: string }
    ) {
        const resourceIds = Object.keys(resourceToStackMap);
        for (const id of resourceIds) {
            if (referenceMap[id] && referenceMap[id].length > 0) {
                const referenceLocations = referenceMap[id];
                for (const referenceLocation of referenceLocations) {
                    const referenceNode = getIn(template, referenceLocation);
                    if (referenceNode.Ref) {
                        // Replace the node with a reference import.
                        const resourceId = referenceNode.Ref;
                        const importNode = this.makeImportValueForRef(resourceToStackMap[resourceId], resourceId);
                        setIn(template, referenceLocation, importNode);
                    } else if (referenceNode["Fn::GetAtt"]) {
                        // Replace the node with a GetAtt import.
                        const [resId, attr] = referenceNode["Fn::GetAtt"];
                        const importNode = this.makeImportValueForGetAtt(resourceToStackMap[resId], resId, attr);
                        setIn(template, referenceLocation, importNode);
                    }
                }
            }
        }
    }

    /**
     * Uses the stackRules to split resources out into the different stacks.
     * By the time that this is called, all Ref & GetAtt nodes will have already
     * been replaced with ImportValue nodes. After splitting these out, exports
     * still need to be added.
     * @param template The master template to split into many templates.
     */
    private collectTemplates(template: Template, resourceToStackMap: { [k: string]: string }) {
        const resourceIds = Object.keys(resourceToStackMap);
        const templateMap = {}
        for (const resourceId of resourceIds) {
            const stackName = resourceToStackMap[resourceId]
            if (!templateMap[stackName]) {
                templateMap[stackName] = blankTemplate()
            }
            templateMap[stackName].Resources[resourceId] = template.Resources[resourceId]
        }
        return templateMap;
    }

    /**
     * Returns a map containing all the resources that satisfy the regex's.
     * @param regexes The name of the regex's
     * @param template The transformer template.
     */
    private mapResourcesToStack(
        template: Template,
    ): { [key: string]: string } {
        const stackNames = Object.keys(this.opts.stackRules)
        const resourceKeys = Object.keys(template.Resources);
        const resourceStackMap = {};
        for (const stackName of stackNames) {
            for (const resourceKey of resourceKeys) {
                for (const regEx of this.opts.stackRules[stackName]) {
                    if (regEx.test(resourceKey)) {
                        resourceStackMap[resourceKey] = stackName
                    }
                }
            }
        }
        for (const resourceKey of resourceKeys) {
            if (!resourceStackMap[resourceKey]) {
                resourceStackMap[resourceKey] = 'root'
            }
        }
        return resourceStackMap;
    }

    private makeOutputForResourceRef(resourceId: string, resource: Resource) {
        return {
            Description: `Auto-generated output for ref to resource ${resourceId}.`,
            Value: Fn.Ref(resourceId),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, 'Ref', resourceId])
            }
        }
    }

    private makeOutputForResourceGetAtt(resourceId: string, resource: Resource, attribute: string) {
        return {
            Description: `Auto-generated output for GetAtt to resource ${resourceId}.${attribute}.`,
            Value: Fn.GetAtt(resourceId, attribute),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, 'GetAtt', resourceId, attribute])
            }
        }
    }

    private makeImportValueForRef(stack: string, resourceId: string): any {
        return Fn.ImportValue(`${stack}:Ref:${resourceId}`)
    }

    private makeImportValueForGetAtt(stack: string, resourceId: string, attribute: string): any {
        return Fn.ImportValue(`${stack}:GetAtt:${resourceId}:${attribute}`)
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
     * Resolver output methods. These were previously found in the AppSync transformer.
     */
    private printWithoutFilePath(ctx: TransformerContext): void {
        const SDL = this.buildSchema(ctx)
        const schemaResource = this.schemaResourceUtil.makeAppSyncSchema(SDL)
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }


    /**
     * Builds the schema and creates the schema record to pull from S3.
     * Returns the schema SDL text as a string.
     */
    private buildAndSetSchema(ctx: TransformerContext): string {
        const SDL = this.buildSchema(ctx)

        const schemaParam = this.schemaResourceUtil.makeSchemaParam()
        ctx.mergeParameters(schemaParam.Parameters)

        const schemaResource = this.schemaResourceUtil.makeAppSyncSchema()
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
        return SDL
    }

    private collectResolversFunctionsAndSchema(ctx: TransformerContext): ResolversFunctionsAndSchema {
        const resolverParams = this.schemaResourceUtil.makeResolverS3RootParams()
        ctx.mergeParameters(resolverParams.Parameters);
        const templateResources: { [key: string]: Resource } = ctx.template.Resources
        let resolverMap = {}
        let functionsMap = {}
        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type === 'AWS::AppSync::Resolver') {
                const resourceResolverMap = this.replaceResolverRecord(resourceName, ctx)
                resolverMap = { ...resolverMap, ...resourceResolverMap }
            } else if (resource.Type === 'AWS::Lambda::Function') {
                // TODO: We only use the one function for now. Generalize this.
                functionsMap = {
                    ...functionsMap,
                    [resourceName]: ctx.metadata.get('ElasticSearchPathToStreamingLambda')
                }
            }
        }
        const schema = this.buildAndSetSchema(ctx);
        return {
            resolvers: resolverMap,
            functions: functionsMap,
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
            const reqFileName = `${reqType}.${reqFieldName}.request.vtl`

            const respType = resolverResource.Properties.TypeName
            const respFieldName = resolverResource.Properties.FieldName
            const respFileName = `${respType}.${respFieldName}.response.vtl`

            const updatedResolverResource = this.schemaResourceUtil.updateResolverResource(resolverResource)
            ctx.setResource(resourceName, updatedResolverResource)
            return {
                [reqFileName]: requestMappingTemplate,
                [respFileName]: responseMappingTemplate
            }
        }
        return {}
    }

    private printWithFilePath(ctx: TransformerContext): void {
        const outputPath = normalize(this.opts.outputPath);
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath);
        }

        const resolverFilePath = normalize(outputPath + '/resolvers')
        if (fs.existsSync(resolverFilePath)) {
            const files = fs.readdirSync(resolverFilePath)
            files.forEach(file => fs.unlinkSync(resolverFilePath + '/' + file))
            fs.rmdirSync(resolverFilePath)
        }

        const templateResources: { [key: string]: Resource } = ctx.template.Resources

        const resolverParams = this.schemaResourceUtil.makeResolverS3RootParams()
        ctx.mergeParameters(resolverParams.Parameters);

        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type === 'AWS::AppSync::Resolver') {
                this.writeResolverToFile(outputPath, resourceName, ctx)
            } else if (resource.Type === 'AWS::Lambda::Function') {
                this.writeLamdbaFunctionToFile(outputPath, resourceName, ctx)
            } else if (resource.Type === 'AWS::AppSync::GraphQLSchema') {
                this.writeSchemaToFile(outputPath, resourceName, ctx)
            }
        }
    }

    private writeResolverToFile(outputPath: string, resourceName: string, ctx: TransformerContext): void {
        const resolverFilePath = normalize(outputPath + '/resolvers')
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
            const reqFileName = `${reqType}.${reqFieldName}.request.vtl`
            fs.writeFileSync(`${resolverFilePath}/${reqFileName}`, requestMappingTemplate)

            const respType = resolverResource.Properties.TypeName
            const respFieldName = resolverResource.Properties.FieldName
            const respFileName = `${respType}.${respFieldName}.response.vtl`
            fs.writeFileSync(`${resolverFilePath}/${respFileName}`, responseMappingTemplate)

            const updatedResolverResource = this.schemaResourceUtil.updateResolverResource(resolverResource)
            ctx.setResource(resourceName, updatedResolverResource)
        }
    }

    private writeSchemaToFile(outputPath: string, resourceName: string, ctx: TransformerContext): void {

        const SDL = this.buildSchema(ctx)
        const schemaPath = normalize(outputPath + '/schema.graphql')
        fs.writeFileSync(schemaPath, SDL)

        const schemaParam = this.schemaResourceUtil.makeSchemaParam()
        ctx.mergeParameters(schemaParam.Parameters)

        const schemaResource = this.schemaResourceUtil.makeAppSyncSchema()
        ctx.setResource(ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, schemaResource)
    }

    private writeLamdbaFunctionToFile(outputPath: string, resourceName: string, ctx: TransformerContext): void {

        const functionPath = normalize(outputPath + '/functions')
        if (!fs.existsSync(functionPath)) {
            fs.mkdirSync(functionPath);
        }
        const sourcePath = normalize(ctx.metadata.get('ElasticSearchPathToStreamingLambda'))
        const destPath = normalize(`${outputPath}/functions/python_streaming_function.zip`)

        const lambdaCode = fs.readFileSync(sourcePath)
        fs.writeFileSync(destPath, lambdaCode)
    }
}

/**
 * Get a value at the path in the object.
 * @param obj The object to look in.
 * @param path The path.
 */
function getIn(obj: any, path: string[]): any {
    let val = obj;
    for (const elem of path) {
        if (val[elem]) {
            val = val[elem]
        } else {
            return null;
        }
    }
    return val;
}

/**
 * Deeply set a value in an object.
 * @param obj The object to look in.
 * @param path The path.
 */
function setIn(obj: any, path: string[], value: any): any {
    let val = obj;
    for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (val[key] && i === path.length - 1) {
            val[key] = value
        } else if (val[key]) {
            val = val[key]
        }
    }
}