import Template from "cloudform-types/types/template";
import { Fn, CloudFormation, StringParameter } from "cloudform-types";
import { getTemplateReferences } from './getTemplateReferences';
import getIn from './getIn';
import setIn from './setIn';
import blankTemplate from './blankTemplate';
import Output from "cloudform-types/types/output";

/**
 * Stack resources
 */
export interface NestedStacks {
    // The root stack template.
    rootStack: Template,
    // All the nested stack templates.
    stacks: {
        [name: string]: Template
    },
    // The full stack mapping for the deployment.
    stackMapping: { [resourceId: string]: string }
}
interface NestedStackInfo {
    stackDependencyMap: { [k: string]: string[] }
    stackParameterMap: { [k: string]: {[p: string]: any }  }
}

export type StackRules = Map<string, string>;
export interface SplitStackOptions {
    stack: Template,
    stackRules: StackRules,
    rootStackName?: string,
    defaultParameterValues?: { [k: string]: any },
    defaultParameterDefinitions?: { [k: string]: any }
    defaultDependencies?: string[],
    importExportPrefix: any,
    deployment: {
        deploymentBucketParameterName: string,
        deploymentKeyParameterName: string
    }
}
export default function splitStack(opts: SplitStackOptions): NestedStacks {
    const stack = opts.stack;
    const stackRules = opts.stackRules;
    const rootStackName = opts.rootStackName || 'root';
    const defaultParameterValues = opts.defaultParameterValues || {};
    const defaultParameterDefinitions = opts.defaultParameterDefinitions || {};
    const defaultDependencies = opts.defaultDependencies || [];
    const importExportPrefix = opts.importExportPrefix;

    /**
     * Returns a map where the keys are the Resource/Output ids and the values are
     * the names of the stack where that Resource/Output belongs. This fills
     * any missing values with that of the root stack and thus returns a full-mapping.
     */
    function createMapByStackRules(
        keys: string[]
    ): { [key: string]: string } {
        const stackMap = {};
        for (const key of keys) {
            const mappedTo = stackRules.get(key);
            if (mappedTo) {
                stackMap[key] = mappedTo;
            } else {
                stackMap[key] = rootStackName;
            }
        }
        return stackMap;
    }
    
    /**
     * Returns a map where the keys are the resource ids and the values are the
     * names of the stack where that resource belongs.
     */
    function mapResourcesToStack(
        template: Template,
    ): { [key: string]: string } {
        return createMapByStackRules(Object.keys(template.Resources));
    }

    /**
     * Returns a map where the keys are the Outputs ids and the values are the
     * names of the stack where that Output belongs.
     */
    function mapOutputsToStack(
        template: Template,
    ): { [key: string]: string } {
        return createMapByStackRules(Object.keys(template.Outputs));
    }

    /**
     * Uses the stackRules to split resources out into the different stacks.
     */
    function collectTemplates(template: Template, resourceToStackMap: { [k: string]: string }, outputToStackMap: { [k: string]: string }) {
        const resourceIds = Object.keys(resourceToStackMap);
        const templateMap = {}
        for (const resourceId of resourceIds) {
            const stackName = resourceToStackMap[resourceId]
            if (!templateMap[stackName]) {
                templateMap[stackName] = blankTemplate({
                    Description: 'An auto-generated nested stack.',
                    Parameters: {
                        ...template.Parameters,
                        ...defaultParameterDefinitions
                    },
                    Conditions: template.Conditions
                })
            }
            const resource = template.Resources[resourceId];
            // Remove any dependsOn that will no longer be in the same template.
            let depends: string | string[] = (resource.DependsOn as any);
            if (depends && Array.isArray(depends)) {
                resource.DependsOn =  depends.filter(id => {
                    return resourceToStackMap[id] === stackName;
                })
            } else if (depends && typeof depends === 'string') {
                resource.DependsOn = resourceToStackMap[depends] === stackName ? depends : undefined;
            }
            templateMap[stackName].Resources[resourceId] = resource;
        }

        const outputIds = Object.keys(outputToStackMap);
        for (const outputId of outputIds) {
            const stackName = outputToStackMap[outputId];
            const output = template.Outputs[outputId];
            templateMap[stackName].Outputs[outputId] = output;
        }
        // The root stack exposes all parameters at the top level.
        templateMap[rootStackName].Parameters = template.Parameters;
        templateMap[rootStackName].Conditions = template.Conditions;
        return templateMap;
    }

    /**
     * Looks at each stack to finds all its Ref and GetAtt expressions
     * and relaces them with Import/Export when siblings and Parameter/Ref
     * when parent-child.
     */
    function replaceReferences(stacks: {[name: string]: Template}, resourceToStackMap: { [key: string]: string }): NestedStackInfo {
        // For each stack create a list of stacks that it depends on.
        const stackDependsOnMap: { [k: string]: string[] } = Object.keys(stacks).reduce((acc, k) => ({ ...acc, [k]: []}), {})
        const stackParamsMap: { [k: string]: {[p: string]: any }  } = Object.keys(stacks).reduce((acc, k) => ({ ...acc, [k]: {}}), {})
        for (const thisStackName of Object.keys(stacks)) {
            const template = stacks[thisStackName]
            const resourceToReferenceMap = getTemplateReferences(template);
            for (const resourceId of Object.keys(resourceToReferenceMap)) {
                const references = resourceToReferenceMap[resourceId];
                const referencedStackName = resourceToStackMap[resourceId]
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
                    const isChildReferencingRoot = thisStackName !== rootStackName && referencedStackName === rootStackName
                    if (refNeedsReplacing && isChildReferencingRoot) {
                        // Replace the Ref with a reference to the parameter that we will pass in.
                        // The stackParamsMap holds a map of parameter values that will be passed into
                        // the nested stack from the root. The values are the full Ref or GetAtt nodes.
                        const parameterName = `Ref${resourceId}`
                        stackParamsMap[thisStackName][parameterName] = refNode
                        template.Parameters[parameterName] = new StringParameter({
                            Description: `Auto-generated parameter that forwards Fn.Ref(${resourceId}) through to nested stacks.`
                        })
                        setIn(template, refList, Fn.Ref(parameterName));
                    } else if (refNeedsReplacing) {
                        setIn(template, refList, makeImportValueForRef(resourceId));
                        const outputForInput = makeOutputForRef(resourceId);
                        const referencedStack = stacks[referencedStackName];
                        const exportLogicalId = `Ref${resourceId}`
                        if (referencedStack && referencedStack.Outputs && !referencedStack.Outputs[exportLogicalId]) {
                            if (template.Outputs[exportLogicalId]) {
                                // https://github.com/aws-amplify/amplify-cli/issues/1581
                                // Export names are unique and the transformer libraries
                                // enforce resource id uniqueness as well. Delete the existing
                                // output if we are adding it to another stack to prevent push failures.
                                delete template.Outputs[exportLogicalId];
                            }
                            referencedStack.Outputs[exportLogicalId] = outputForInput;
                        }
                        if (stackDependsOnMap[thisStackName] && !stackDependsOnMap[thisStackName].find(s => s === referencedStackName)) {
                            stackDependsOnMap[thisStackName].push(referencedStackName)
                        }
                    } else if (getAttNeedsReplacing && isChildReferencingRoot) {
                        // Replace the GetAtt with a reference to the parameter that we will pass in.
                        // The stackParamsMap holds a map of parameter values that will be passed into
                        // the nested stack from the root. The values are the full Ref or GetAtt nodes.
                        const [resId, attr] = refNode["Fn::GetAtt"];
                        const parameterName = `GetAtt${resourceId}${attr}`
                        stackParamsMap[thisStackName][parameterName] = refNode
                        template.Parameters[parameterName] = new StringParameter({
                            Description: `Auto-generated parameter that forwards Fn.GetAtt(${resourceId}, ${attr}) through to nested stacks.`
                        })
                        setIn(template, refList, Fn.Ref(parameterName));
                    } else if (getAttNeedsReplacing) {
                        const [resId, attr] = refNode["Fn::GetAtt"];
                        setIn(template, refList, makeImportValueForGetAtt(resourceId, attr));
                        const outputForInput = makeOutputForGetAtt(resourceId, attr);
                        const referencedStack = stacks[referencedStackName];
                        const exportLogicalId = `GetAtt${resourceId}${attr}`
                        if (referencedStack && referencedStack.Outputs && !referencedStack.Outputs[exportLogicalId]) {
                            if (template.Outputs[exportLogicalId]) {
                                // https://github.com/aws-amplify/amplify-cli/issues/1581
                                // Export names are unique and the transformer libraries
                                // enforce resource id uniqueness as well. Delete the existing
                                // output if we are adding it to another stack to prevent push failures.
                                delete template.Outputs[exportLogicalId];
                            }
                            referencedStack.Outputs[exportLogicalId] = outputForInput;
                        }
                        if (stackDependsOnMap[thisStackName] && !stackDependsOnMap[thisStackName].find(s => s === referencedStackName)) {
                            stackDependsOnMap[thisStackName].push(referencedStackName)
                        }
                    }
                }
            }
        }
        return {
            stackDependencyMap: stackDependsOnMap,
            stackParameterMap: stackParamsMap
        }
    }

    /**
     * Create an import value node that replaces a Ref.
     */
    function makeImportValueForRef(resourceId: string): any {
        return Fn.ImportValue(
            Fn.Join(
                ':',
                [
                    importExportPrefix,
                    'Ref',
                    resourceId
                ]
            )
        )
    }

    /**
     * Make an ImportValue node that imports the corresponding export.
     * @param resourceId The resource being got
     * @param attribute The attribute on the resource
     */
    function makeImportValueForGetAtt(resourceId: string, attribute: string): any {
        return Fn.ImportValue(
            Fn.Join(
                ':',
                [
                    importExportPrefix,
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
    function makeOutputForGetAtt(resourceId: string, attribute: string): Output {
        return {
            Value: Fn.GetAtt(resourceId, attribute),
            Export: {
                Name: Fn.Join(
                    ':',
                    [
                        importExportPrefix,
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
    function makeOutputForRef(resourceId: string): Output {
        return {
            Value: Fn.Ref(resourceId),
            Export: {
                Name: Fn.Join(
                    ':',
                    [
                        importExportPrefix,
                        'Ref',
                        resourceId
                    ]
                )
            }
        }
    }

    /**
     * Forwards all root parameters to each nested stack and adds the GraphQL API
     * reference as a parameter.
     * @param root The root stack
     * @param stacks The list of stacks keyed by filename.
     */
    function updateRootWithNestedStacks(root: Template, stacks: { [key: string]: Template }, stackInfo: NestedStackInfo) {
        const stackFileNames = Object.keys(stacks);
        const allParamNames = Object.keys(root.Parameters);
        // Forward all parent parameters
        const allParamValues = allParamNames.reduce((acc: any, name: string) => ({
            ...acc,
            [name]: Fn.Ref(name)
        }), defaultParameterValues)
        // Also forward the API id of the top level API.
        // allParamValues[ResourceConstants.RESOURCES.GraphQLAPILogicalID] = Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId')
        for (const stackName of stackFileNames) {
            const dependsOnStacks = stackInfo.stackDependencyMap[stackName] || []
            const extraParams = stackInfo.stackParameterMap[stackName] || {}
            let stackResource = new CloudFormation.Stack({
                Parameters: {
                    ...allParamValues,
                    ...extraParams
                },
                TemplateURL: Fn.Join(
                    '/',
                    [
                        "https://s3.amazonaws.com",
                        Fn.Ref(opts.deployment.deploymentBucketParameterName),
                        Fn.Ref(opts.deployment.deploymentKeyParameterName),
                        'stacks',
                        stackName + ".json"
                    ]
                )
            }).dependsOn([
                ...defaultDependencies,
                ...dependsOnStacks
            ])
            root.Resources[stackName] = stackResource
        }
        return root;
    }

    const templateJson: any = JSON.parse(JSON.stringify(stack));
    const resourceToStackMap = mapResourcesToStack(templateJson);
    const outputToStackMap = mapOutputsToStack(templateJson);
    const stackMapping = { ...resourceToStackMap, ...outputToStackMap };
    const stacks = collectTemplates(templateJson, resourceToStackMap, outputToStackMap);
    const stackInfo = replaceReferences(stacks, resourceToStackMap);
    let rootStack = stacks[rootStackName];
    delete(stacks[rootStackName]);
    rootStack = updateRootWithNestedStacks(rootStack, stacks, stackInfo);
    return {
        rootStack,
        stacks,
        stackMapping
    }
}
