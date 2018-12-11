import TransformerContext from "./TransformerContext";
import Template from "cloudform-types/types/template";
import { CloudFormation } from 'cloudform-types';
import { getTemplateReferences, ReferenceMap } from './util/getTemplateReferences';
import Resource from "cloudform-types/types/resource";
import blankNestedTemplate from './util/blankNestedTemplate';
import { Fn, Refs } from "cloudform-types";
import {
    makeOperationType,
    makeSchema
} from 'graphql-transformer-common';
import { ObjectTypeDefinitionNode, print } from "graphql";
import { stripDirectives } from "./stripDirectives";
import { SchemaResourceUtil } from "./util/schemaResourceUtil";
import makeExportName from './util/makeExportName';
import { DeploymentResources, ResolversFunctionsAndSchema, ResolverMap, StackResources } from './DeploymentResources';
import { ResourceConstants } from "graphql-transformer-common";
import Output from "cloudform-types/types/output";

const ROOT_STACK_NAME = 'root';

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
    private resourceToStackMap = {}

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
        const stackDependsOnMap = this.replaceReferencesAndReturnDependencies(stacks);
        let rootStack = stacks.root;
        delete(stacks.root);
        rootStack = this.updateRootWithNestedStacks(rootStack, stacks, stackDependsOnMap);
        return {
            rootStack,
            stacks,
            ...resolversFunctionsAndSchema
        };
    }

    /**
     * Looks at each stack, finds all its references and GetAtt expressions,
     * and replaces those references with an Import and Export value expressions
     * in the corresponding stack.
     * @param template
     * @param rootTemplate
     */
    private replaceReferencesAndReturnDependencies(stacks: {[name: string]: Template}) {
        // For each stack create a list of stacks that it depends on.
        const stackDependsOnMap: { [k: string]: string[] } = Object.keys(stacks).reduce((acc, k) => ({ ...acc, [k]: []}), {})
        for (const thisStackName of Object.keys(stacks)) {
            const template = stacks[thisStackName]
            const resourceToReferenceMap = getTemplateReferences(template);
            for (const resourceId of Object.keys(resourceToReferenceMap)) {
                const references = resourceToReferenceMap[resourceId];
                const referencedStackName = this.resourceToStackMap[resourceId]
                for (const refList of references) {
                    const refNode = getIn(template, refList)
                    // Only update a Ref if it references a Resource in a different stack.
                    // Other Refs are params, conditions, or built in pseudo params which remain the same.
                    const refNeedsReplacing =
                        refNode
                        && refNode.Ref
                        && referencedStackName
                        && referencedStackName !== thisStackName;
                    // Do not update a GetAtt if resources are in the same stack.
                    // Do update a GetAtt if it ref's a resource in a different stack.
                    const getAttNeedsReplacing =
                        refNode
                        && refNode['Fn::GetAtt']
                        && referencedStackName
                        && referencedStackName !== thisStackName;
                    const attributeIsApiId = resourceId === ResourceConstants.RESOURCES.GraphQLAPILogicalID
                    if (refNeedsReplacing) {
                        setIn(template, refList, this.makeImportValueForRef(resourceId));
                        const outputForInput = this.makeOutputForRef(resourceId);
                        const referencedStack = stacks[referencedStackName];
                        const exportLogicalId = `Ref${resourceId}`
                        if (referencedStack && referencedStack.Outputs && !referencedStack.Outputs[exportLogicalId]) {
                            referencedStack.Outputs[exportLogicalId] = outputForInput;
                        }
                        if (stackDependsOnMap[thisStackName] && !stackDependsOnMap[thisStackName].find(s => s === referencedStackName)) {
                            stackDependsOnMap[thisStackName].push(referencedStackName)
                        }
                    } else if (getAttNeedsReplacing && attributeIsApiId) {
                        // A special case. We pass the API id to children via a
                        // parameters trying to export it causes ref issues with CloudFormation outputs.
                        const [resId, attr] = refNode["Fn::GetAtt"];
                        setIn(template, refList, Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId));
                    } else if (getAttNeedsReplacing) {
                        const [resId, attr] = refNode["Fn::GetAtt"];
                        setIn(template, refList, this.makeImportValueForGetAtt(resourceId, attr));
                        const outputForInput = this.makeOutputForGetAtt(resourceId, attr);
                        const referencedStack = stacks[referencedStackName];
                        const exportLogicalId = `GetAtt${resourceId}${attr}`
                        if (referencedStack && referencedStack.Outputs && !referencedStack.Outputs[exportLogicalId]) {
                            referencedStack.Outputs[exportLogicalId] = outputForInput;
                        }
                        if (stackDependsOnMap[thisStackName] && !stackDependsOnMap[thisStackName].find(s => s === referencedStackName)) {
                            stackDependsOnMap[thisStackName].push(referencedStackName)
                        }
                    }
                }
            }
        }
        return stackDependsOnMap
    }

    /**
     * Forwards all root parameters to each nested stack and adds the GraphQL API
     * reference as a parameter.
     * @param root The root stack
     * @param stacks The list of stacks keyed by filename.
     */
    private updateRootWithNestedStacks(root: Template, stacks: { [key: string]: Template }, dependsOnMap: { [stack: string]: string[] }) {
        const stackFileNames = Object.keys(stacks);
        const allParamNames = Object.keys(root.Parameters);
        // Forward all parent parameters
        const allParamValues = allParamNames.reduce((acc: any, name: string) => ({
            ...acc,
            [name]: Fn.Ref(name)
        }), {})
        allParamValues[ResourceConstants.PARAMETERS.AppSyncApiId] = Fn.GetAtt(
            ResourceConstants.RESOURCES.GraphQLAPILogicalID,
            "ApiId"
        )
        // Also forward the API id of the top level API.
        // allParamValues[ResourceConstants.RESOURCES.GraphQLAPILogicalID] = Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
        for (const stackName of stackFileNames) {
            const dependsOnStacks = dependsOnMap[stackName] || []
            let stackResource = new CloudFormation.Stack({
                Parameters: allParamValues,
                TemplateURL: Fn.Join(
                    '/',
                    [
                        "https://s3.amazonaws.com",
                        Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                        Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                        'stacks',
                        stackName + ".json"
                    ]
                )
            }).dependsOn([
                ResourceConstants.RESOURCES.GraphQLSchemaLogicalID,
                ...dependsOnStacks
            ])
            root.Resources[stackName] = stackResource
        }
        return root;
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
        // const referenceMap = getTemplateReferences(templateJson);
        const resourceToStackMap = this.mapResourcesToStack(templateJson);
        // this.replaceReferencesWithImports(templateJson, referenceMap, resourceToStackMap);
        // this.replaceGraphQLAPIGetAttsWithRef(templateJson, referenceMap, resourceToStackMap);
        const templateMap = this.collectTemplates(templateJson, resourceToStackMap);
        return templateMap;
    }

    private getParentResourceFromLocation(location: string[]) {
        // There should never be a resource location with fewer than 2 elements.
        if (!location || location.length < 2) {
            return null;
        }
        return location[1]
    }

    /**
     * Walks through the referenceMap and replaces all occurances of Fn.Ref and
     * Fn.GetAtt with the relevant ImportValue statement.
     * @param template The template to update.
     * @param referenceMap The reference map.
     * @param resourceToStackMap The mapping from resourceId to stack name.
     */
    private replaceReferencesWithImports(
        template: Template,
        referenceMap: ReferenceMap,
        resourceToStackMap: { [k: string]: string }
    ) {
        const resourceIds = Object.keys(resourceToStackMap);
        for (const id of resourceIds) {
            const referencedResourceStack = resourceToStackMap[id];
            if (referenceMap[id] && referenceMap[id].length > 0) {
                const referenceLocations = referenceMap[id];
                for (const referenceLocation of referenceLocations) {
                    const referenceNode = getIn(template, referenceLocation);
                    // A reference location looks like ['Resources', 'PostTable', 'Properties']
                    const sourceResourceId = this.getParentResourceFromLocation(referenceLocation)
                    const sourceResourceStack = resourceToStackMap[sourceResourceId]
                    if (
                        sourceResourceStack &&
                        referenceNode &&
                        referenceNode.Ref &&
                        sourceResourceStack !== referencedResourceStack
                    ) {
                        // Replace the Ref with an import only if they resources are in different stacks.
                        const resourceId = referenceNode.Ref;
                        const importNode = this.makeImportValueForRef(resourceId);
                        setIn(template, referenceLocation, importNode);
                    } else if (
                        sourceResourceStack &&
                        referenceNode &&
                        referenceNode["Fn::GetAtt"] &&
                        sourceResourceStack !== referencedResourceStack
                    ) {
                        // Replace the GetAtt with an import only if they resources are in different stacks.
                        const [resId, attr] = referenceNode["Fn::GetAtt"];
                        const importNode = this.makeImportValueForGetAtt(resId, attr);
                        setIn(template, referenceLocation, importNode);
                    }
                }
            }
        }
    }

    /**
     * Replaces any GetAtt(GraphQLAPI, ApiId) with Fn.Ref(GraphQLAPI) which
     * will be passed in as a parameter from the parent.
     * @param template
     * @param referenceMap
     * @param resourceToStackMap
     */
    private replaceGraphQLAPIGetAttsWithRef(
        template: Template,
        referenceMap: ReferenceMap,
        resourceToStackMap: { [k: string]: string }
    ) {
        const resourceIds = Object.keys(resourceToStackMap);
        for (const id of resourceIds) {
            const referencedResourceStack = resourceToStackMap[id];
            if (referenceMap[id] && referenceMap[id].length > 0) {
                const referenceLocations = referenceMap[id];
                for (const referenceLocation of referenceLocations) {
                    const referenceNode = getIn(template, referenceLocation);
                    // A reference location looks like ['Resources', 'PostTable', 'Properties']
                    const sourceResourceId = this.getParentResourceFromLocation(referenceLocation)
                    const sourceResourceStack = resourceToStackMap[sourceResourceId]
                    if (
                        sourceResourceStack &&
                        referenceNode &&
                        referenceNode["Fn::GetAtt"] &&
                        sourceResourceStack !== referencedResourceStack
                    ) {
                        // Replace the GetAtt with an import only if they resources are in different stacks.
                        const [resId, attr] = referenceNode["Fn::GetAtt"];
                        if (resId === ResourceConstants.RESOURCES.GraphQLAPILogicalID && attr === 'ApiId') {
                            // TODO: Generalize this. For now GetAtt on API.ApiId is enough.
                            setIn(template, referenceLocation, Fn.Ref(resId));
                        }
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
                templateMap[stackName] = blankNestedTemplate(template.Parameters)
            }
            templateMap[stackName].Resources[resourceId] = template.Resources[resourceId]
            templateMap[stackName].Conditions = {
                ...templateMap[stackName].Conditions,
                ...this.schemaResourceUtil.makeEnvironmentConditions()
            }
        }
        // The root stack exposes all parameters at the top level.
        templateMap[ROOT_STACK_NAME].Parameters = template.Parameters;
        templateMap[ROOT_STACK_NAME].Outputs = template.Outputs;
        templateMap[ROOT_STACK_NAME].Conditions = template.Conditions;
        templateMap[ROOT_STACK_NAME].Conditions = {
            ...templateMap[ROOT_STACK_NAME].Conditions,
            ...this.schemaResourceUtil.makeEnvironmentConditions()
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
                resourceStackMap[resourceKey] = ROOT_STACK_NAME
            }
        }
        this.resourceToStackMap = resourceStackMap;
        return resourceStackMap;
    }

    private makeImportValueForRef(resourceId: string): any {
        return Fn.ImportValue(
            Fn.Join(
                ':',
                [
                    Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
                    'Ref',
                    resourceId
                ]
            )
        )
    }

    private makeImportValueForGetAtt(resourceId: string, attribute: string): any {
        return Fn.ImportValue(
            Fn.Join(
                ':',
                [
                    Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
                    'GetAtt',
                    resourceId,
                    attribute
                ]
            )
        )
    }

    /**
     * Make an output record that exports the GetAtt.
     * @param resourceId The resource being got
     * @param attribute The attribute on the resource
     */
    private makeOutputForGetAtt(resourceId: string, attribute: string): Output {
        return {
            Value: Fn.GetAtt(resourceId, attribute),
            Export: {
                Name: Fn.Join(
                    ':',
                    [
                        Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
                        'GetAtt',
                        resourceId,
                        attribute
                    ]
                )
            }
        }
    }

    /**
     * Make an output record that exports the GetAtt.
     * @param resourceId The resource being got
     * @param attribute The attribute on the resource
     */
    private makeOutputForRef(resourceId: string): Output {
        return {
            Value: Fn.Ref(resourceId),
            Export: {
                Name: Fn.Join(
                    ':',
                    [
                        Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
                        'Ref',
                        resourceId
                    ]
                )
            }
        }
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
