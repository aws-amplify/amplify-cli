import Template from 'cloudform/types/template'
import Resource from 'cloudform/types/resource'
import Parameter from 'cloudform/types/parameter'
import {
    TypeSystemDefinitionNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InputTypeDefinitionNode,
    SchemaDefinitionNode
} from 'graphql/language/ast'
import blankTemplate from './util/blankTemplate'

/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
export default class TransformerContext {

    public template: Template = blankTemplate()

    public nodeMap: { [name: string]: TypeSystemDefinitionNode } = {}

    public mergeResources(resources: { [key: string]: Resource }) {
        for (const resourceId of Object.keys(resources)) {
            if (this.template.Resources[resourceId]) {
                throw new Error(`Conflicting CloudFormation resource logical id: ${resourceId}`)
            }
        }
        this.template.Resources = { ...this.template.Resources, ...resources }
    }

    public mergeParameters(params: { [key: string]: Parameter }) {
        for (const parameterName of Object.keys(params)) {
            if (this.template.Parameters[parameterName]) {
                throw new Error(`Conflicting CloudFormation parameter name: ${parameterName}`)
            }
        }
        this.template.Parameters = { ...this.template.Parameters, ...params }
    }

    public getResource(resource: string): Resource {
        return this.template.Resources[resource];
    }

    public setResource(key: string, resource: Resource): void {
        this.template.Resources[key] = resource
    }

    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    public addSchema(obj: SchemaDefinitionNode) {
        if (this.nodeMap.__schema) {
            throw new Error(`Conflicting schema type found.`)
        }
        this.nodeMap.__schema = obj
    }

    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    public addObject(obj: ObjectTypeDefinitionNode) {
        if (this.nodeMap[obj.name.value]) {
            throw new Error(`Conflicting type '${obj.name.value}' found.`)
        }
        this.nodeMap[obj.name.value] = obj
    }

    /**
     * Add an input type definition node to the context.
     * @param inp The input type definition node to add.
     */
    public addInput(inp: InputTypeDefinitionNode) {
        if (this.nodeMap[inp.name.value]) {
            throw new Error(`Conflicting input type '${inp.name.value}' found.`)
        }
        this.nodeMap[inp.name.value] = inp
    }
}