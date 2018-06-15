import Template from 'cloudform/types/template'
import Resource from 'cloudform/types/resource'
import Parameter from 'cloudform/types/parameter'
import {
    TypeSystemDefinitionNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InputObjectTypeDefinitionNode,
    SchemaDefinitionNode,
    ObjectTypeExtensionNode,
    NamedTypeNode,
    DocumentNode,
    Kind,
    parse
} from 'graphql'
import blankTemplate from './util/blankTemplate'

export class TransformerContextMetadata {

    /**
     * Used by transformers to pass information between one another.
     */
    private metadata: { [key: string]: any } = {}

    public get(key: string): any {
        return this.metadata[key];
    }

    public set(key: string, val: any): void {
        return this.metadata[key] = val;
    }

    public has(key: string) {
        return Boolean(this.metadata[key] !== undefined)
    }
}

/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
export default class TransformerContext {

    public template: Template = blankTemplate()

    public nodeMap: { [name: string]: TypeSystemDefinitionNode } = {}

    public inputDocument: DocumentNode

    public metadata: TransformerContextMetadata = new TransformerContextMetadata()

    constructor(inputSDL: string) {
        const doc: DocumentNode = parse(inputSDL)
        for (const def of doc.definitions) {
            if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
                throw new Error(`Found a ${def.kind}. Transformers accept only documents consisting of TypeSystemDefinitions.`)
            }
        }
        this.inputDocument = doc
    }

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

    public getObject(name: string): ObjectTypeDefinitionNode | undefined {
        if (this.nodeMap[name]) {
            const node = this.nodeMap[name]
            if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
                return node as ObjectTypeDefinitionNode;
            }
        }
    }

    /**
     * Add an object type extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The object type definition node to add.
     */
    public addObjectExtension(obj: ObjectTypeExtensionNode) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error(`Cannot extend non-existant type '${obj.name.value}'.`)
        }
        // AppSync does not yet understand type extensions so fold the types in.
        const oldNode = this.getObject(obj.name.value)
        const newDirs = obj.directives || []
        const oldDirs = oldNode.directives || []
        const mergedDirs = [...oldDirs, ...newDirs]

        // An extension cannot redeclare fields.
        const oldFields = oldNode.fields || []
        const oldFieldMap = oldFields.reduce(
            (acc: any, field: FieldDefinitionNode) => ({
                ...acc,
                [field.name.value]: field
            }),
            {}
        )
        const newFields = obj.fields || []
        const mergedFields = [...oldFields]
        for (const newField of newFields) {
            if (oldFieldMap[newField.name.value]) {
                throw new Error(`Object type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`)
            }
            mergedFields.push(newField)
        }

        // An extension cannot redeclare interfaces
        const oldInterfaces = oldNode.interfaces || []
        const oldInterfaceMap = oldInterfaces.reduce(
            (acc: any, field: NamedTypeNode) => ({
                ...acc,
                [field.name.value]: field
            }),
            {}
        )
        const newInterfaces = obj.interfaces || []
        const mergedInterfaces = [...oldInterfaces]
        for (const newInterface of newInterfaces) {
            if (oldInterfaceMap[newInterface.name.value]) {
                throw new Error(`Object type extension '${obj.name.value}' cannot redeclare interface ${newInterface.name.value}`)
            }
            mergedInterfaces.push(newInterface)
        }
        this.nodeMap[oldNode.name.value] = {
            ...oldNode,
            interfaces: mergedInterfaces,
            directives: mergedDirs,
            fields: mergedFields
        }
    }

    /**
     * Add an input type definition node to the context.
     * @param inp The input type definition node to add.
     */
    public addInput(inp: InputObjectTypeDefinitionNode) {
        if (this.nodeMap[inp.name.value]) {
            throw new Error(`Conflicting input type '${inp.name.value}' found.`)
        }
        this.nodeMap[inp.name.value] = inp
    }
}