import TransformerContext from "./TransformerContext";
import Template from "cloudform/types/template";
import { getTemplateReferences, ReferenceMap } from './util/getTemplateReferences';
import Resource from "cloudform/types/resource";
import blankTemplate from './util/blankTemplate';
import { Fn, Refs } from "cloudform";

interface StackMap {
    [key: string]: Template;
}
interface StackExprMap {
    [key: string]: RegExp[];
}
interface TransformFormatterOptions {
    stackRules: StackExprMap
}
export class TransformFormatter {

    private _opts: TransformFormatterOptions;

    constructor(opts: TransformFormatterOptions) {
        this._opts = opts;
    }

    public format(template: Template): any {
        return this.splitContextIntoTemplates(template);
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
        console.log(JSON.stringify(templateMap, null, 4))
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
        const stackNames = Object.keys(this._opts.stackRules)
        const resourceKeys = Object.keys(template.Resources);
        const resourceStackMap = {};
        for (const stackName of stackNames) {
            for (const resourceKey of resourceKeys) {
                for (const regEx of this._opts.stackRules[stackName]) {
                    if (regEx.test(resourceKey)) {
                        resourceStackMap[resourceKey] = stackName
                    }
                }
            }
        }
        for (const resourceKey of resourceKeys) {
            if (!resourceStackMap[resourceKey]) {
                resourceStackMap[resourceKey] = 'main'
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