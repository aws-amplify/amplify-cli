import Template from 'cloudform-types/types/template'
import Resource from 'cloudform-types/types/resource'
import Parameter from 'cloudform-types/types/parameter'
import { Condition } from 'cloudform-types/types/dataTypes'
import Output from 'cloudform-types/types/output'
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
    parse,
    EnumTypeDefinitionNode,
    TypeDefinitionNode,
    DefinitionNode,
    OperationTypeDefinitionNode,
    InterfaceTypeDefinitionNode
} from 'graphql'
import blankTemplate from './util/blankTemplate'
import DefaultSchemaDefinition from './defaultSchema'
import {
    InterfaceTypeExtensionNode, UnionTypeExtensionNode,
    UnionTypeDefinitionNode, EnumTypeExtensionNode, EnumValueDefinitionNode,
    InputObjectTypeExtensionNode, InputValueDefinitionNode
} from 'graphql/language/ast';
import { ConfigSnapshotDeliveryProperties } from 'cloudform-types/types/config/deliveryChannel';

export function blankObject(name: string): ObjectTypeDefinitionNode {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function objectExtension(name: string, fields: FieldDefinitionNode[] = []): ObjectTypeExtensionNode {
    return {
        kind: Kind.OBJECT_TYPE_EXTENSION,
        name: {
            kind: 'Name',
            value: name
        },
        fields,
        directives: [],
        interfaces: []
    }
}

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
 * The stack mapping defines a full mapping from resource id
 * to the stack that it belongs to. When transformers add
 * resources to the context, they add an entry to the
 * stack mapping and that resource will be pulled into the related stack
 * automatically.
 */
export type StackMapping = Map<string, string>;

/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
export default class TransformerContext {

    public template: Template = blankTemplate()

    public nodeMap: { [name: string]: TypeSystemDefinitionNode } = {}

    public inputDocument: DocumentNode

    public metadata: TransformerContextMetadata = new TransformerContextMetadata()

    private stackMapping: StackMapping = new Map();

    constructor(inputSDL: string) {
        const doc: DocumentNode = parse(inputSDL)
        for (const def of doc.definitions) {
            if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
                throw new Error(`Found a ${def.kind}. Transformers accept only documents consisting of TypeSystemDefinitions.`)
            }
        }
        this.inputDocument = doc
        this.fillNodeMapWithInput();
    }

    /**
     * Before running the transformers, first flush the input document
     * into the node map. If a schema definition node then leave everything
     * as is so customers can explicitly turn off mutations & subscriptions.
     * If a SDN is not provided then we add the default schema and empty
     * Query, Mutation, and Subscription
     */
    private fillNodeMapWithInput(): void {
        const extensionNodes = [];
        for (const inputDef of this.inputDocument.definitions) {
            switch (inputDef.kind) {
                case Kind.OBJECT_TYPE_DEFINITION:
                case Kind.SCALAR_TYPE_DEFINITION:
                case Kind.INTERFACE_TYPE_DEFINITION:
                case Kind.INPUT_OBJECT_TYPE_DEFINITION:
                case Kind.ENUM_TYPE_DEFINITION:
                case Kind.UNION_TYPE_DEFINITION:
                    const typeDef = inputDef as TypeDefinitionNode
                    if (!this.getType(typeDef.name.value)) {
                        this.addType(typeDef)
                    }
                    break;
                case Kind.SCHEMA_DEFINITION:
                    if (!this.getSchema()) {
                        const typeDef = inputDef as SchemaDefinitionNode
                        this.putSchema(typeDef);
                    }
                    break;
                case Kind.OBJECT_TYPE_EXTENSION:
                case Kind.ENUM_TYPE_EXTENSION:
                case Kind.UNION_TYPE_EXTENSION:
                case Kind.INTERFACE_TYPE_EXTENSION:
                case Kind.INPUT_OBJECT_TYPE_EXTENSION:
                    extensionNodes.push(inputDef);
                    break;
                case Kind.SCALAR_TYPE_EXTENSION:
                default:
                /* pass any others */
            }
        }
        // We add the extension nodes last so that the order of input documents does not matter.
        // At this point, all input documents have been processed so the base types will be present.
        for (const ext of extensionNodes) {
            switch (ext.kind) {
                case Kind.OBJECT_TYPE_EXTENSION:
                    this.addObjectExtension(ext);
                    break;
                case Kind.INTERFACE_TYPE_EXTENSION:
                    this.addInterfaceExtension(ext);
                    break;
                case Kind.UNION_TYPE_EXTENSION:
                    this.addUnionExtension(ext);
                    break;
                case Kind.ENUM_TYPE_EXTENSION:
                    this.addEnumExtension(ext);
                    break;
                case Kind.INPUT_OBJECT_TYPE_EXTENSION:
                    this.addInputExtension(ext);
                    break;
                case Kind.SCALAR_TYPE_EXTENSION:
                default:
                    continue;
            }
        }
        // If no schema definition is provided then fill with the default one.
        if (!this.getSchema()) {
            this.putSchema(DefaultSchemaDefinition);
        }
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

    public mergeConditions(conditions: { [key: string]: Condition }) {
        if (!this.template.Conditions) {
            this.template.Conditions = {}
        }
        for (const conditionName of Object.keys(conditions)) {
            if (this.template.Conditions[conditionName]) {
                throw new Error(`Conflicting CloudFormation condition name: ${conditionName}`)
            }
        }
        this.template.Conditions = { ...this.template.Conditions, ...conditions }
    }

    public getResource(resource: string): Resource {
        return this.template.Resources[resource];
    }

    public setResource(key: string, resource: Resource): void {
        this.template.Resources[key] = resource
    }

    public setOutput(key: string, output: Output): void {
        this.template.Outputs[key] = output;
    }

    public getOutput(key: string): Output {
        return this.template.Outputs[key]
    }

    public mergeOutputs(outputs: { [key: string]: Output }) {
        for (const outputName of Object.keys(outputs)) {
            if (this.template.Parameters[outputName]) {
                throw new Error(`Conflicting CloudFormation parameter name: ${outputName}`)
            }
        }
        this.template.Outputs = { ...this.template.Outputs, ...outputs }
    }

    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    public putSchema(obj: SchemaDefinitionNode) {
        this.nodeMap.__schema = obj
    }

    /**
     * Returns the schema definition record. If the user provides a schema
     * definition as part of the input document, that node is returned.
     * Otherwise a blank schema definition with default operation types
     * is returned.
     */
    public getSchema(): SchemaDefinitionNode {
        return this.nodeMap.__schema as SchemaDefinitionNode;
    }

    public getQueryTypeName(): string | undefined {
        const schemaNode = this.getSchema();
        const queryTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'query');
        if (queryTypeName && queryTypeName.type && queryTypeName.type.name) {
            return queryTypeName.type.name.value;
        }
    }

    public getQuery(): ObjectTypeDefinitionNode | undefined {
        const queryTypeName = this.getQueryTypeName();
        if (queryTypeName) {
            return this.nodeMap[queryTypeName] as ObjectTypeDefinitionNode | undefined;
        }
    }

    public getMutationTypeName(): string | undefined {
        const schemaNode = this.getSchema();
        const mutationTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'mutation');
        if (mutationTypeName && mutationTypeName.type && mutationTypeName.type.name) {
            return mutationTypeName.type.name.value;
        }
    }

    public getMutation(): ObjectTypeDefinitionNode | undefined {
        const mutationTypeName = this.getMutationTypeName();
        if (mutationTypeName) {
            return this.nodeMap[mutationTypeName] as ObjectTypeDefinitionNode | undefined;
        }
    }

    public getSubscriptionTypeName(): string | undefined {
        const schemaNode = this.getSchema();
        const subscriptionTypeName = schemaNode.operationTypes.find((op: OperationTypeDefinitionNode) => op.operation === 'subscription');
        if (subscriptionTypeName && subscriptionTypeName.type && subscriptionTypeName.type.name) {
            return subscriptionTypeName.type.name.value;
        }
    }

    public getSubscription(): ObjectTypeDefinitionNode | undefined {
        const subscriptionTypeName = this.getSubscriptionTypeName();
        if (subscriptionTypeName) {
            return this.nodeMap[subscriptionTypeName] as ObjectTypeDefinitionNode | undefined;
        }
    }

    /**
     * Add a generic type.
     * @param obj The type to add
     */
    public addType(obj: TypeDefinitionNode) {
        if (this.nodeMap[obj.name.value]) {
            throw new Error(`Conflicting type '${obj.name.value}' found.`)
        }
        this.nodeMap[obj.name.value] = obj
    }

    public putType(obj: TypeDefinitionNode) {
        this.nodeMap[obj.name.value] = obj
    }

    public getType(name: string): TypeSystemDefinitionNode | undefined {
        return this.nodeMap[name]
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
     * Extends the context query object with additional fields.
     * If the customer uses a name other than 'Query' this will proxy to the
     * correct type.
     * @param fields The fields to add the query type.
     */
    public addQueryFields(fields: FieldDefinitionNode[]) {
        const queryTypeName = this.getQueryTypeName();
        if (queryTypeName) {
            if (!this.getType(queryTypeName)) {
                this.addType(blankObject(queryTypeName))
            }
            let queryType = objectExtension(queryTypeName, fields)
            this.addObjectExtension(queryType);
        }
    }

    /**
     * Extends the context mutation object with additional fields.
     * If the customer uses a name other than 'Mutation' this will proxy to the
     * correct type.
     * @param fields The fields to add the mutation type.
     */
    public addMutationFields(fields: FieldDefinitionNode[]) {
        const mutationTypeName = this.getMutationTypeName();
        if (mutationTypeName) {
            if (!this.getType(mutationTypeName)) {
                this.addType(blankObject(mutationTypeName))
            }
            let mutationType = objectExtension(mutationTypeName, fields)
            this.addObjectExtension(mutationType);
        }
    }

    /**
     * Extends the context subscription object with additional fields.
     * If the customer uses a name other than 'Subscription' this will proxy to the
     * correct type.
     * @param fields The fields to add the subscription type.
     */
    public addSubscriptionFields(fields: FieldDefinitionNode[]) {
        const subscriptionTypeName = this.getSubscriptionTypeName();
        if (subscriptionTypeName) {
            if (!this.getType(subscriptionTypeName)) {
                this.addType(blankObject(subscriptionTypeName))
            }
            let subscriptionType = objectExtension(subscriptionTypeName, fields)
            this.addObjectExtension(subscriptionType);
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
     * Add an input object type extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The input object type definition node to add.
     */
    public addInputExtension(obj: InputObjectTypeExtensionNode) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error(`Cannot extend non-existant input '${obj.name.value}'.`)
        }
        // AppSync does not yet understand type extensions so fold the types in.
        const oldNode = this.getType(obj.name.value) as InputObjectTypeDefinitionNode
        const newDirs = obj.directives || []
        const oldDirs = oldNode.directives || []
        const mergedDirs = [...oldDirs, ...newDirs]

        // An extension cannot redeclare fields.
        const oldFields = oldNode.fields || []
        const oldFieldMap = oldFields.reduce(
            (acc: any, field: InputValueDefinitionNode) => ({
                ...acc,
                [field.name.value]: field
            }),
            {}
        )
        const newFields = obj.fields || []
        const mergedFields = [...oldFields]
        for (const newField of newFields) {
            if (oldFieldMap[newField.name.value]) {
                throw new Error(`Input object type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`)
            }
            mergedFields.push(newField)
        }

        this.nodeMap[oldNode.name.value] = {
            ...oldNode,
            directives: mergedDirs,
            fields: mergedFields
        }
    }

    /**
     * Add an interface extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The interface type definition node to add.
     */
    public addInterfaceExtension(obj: InterfaceTypeExtensionNode) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error(`Cannot extend non-existant interface '${obj.name.value}'.`)
        }
        // AppSync does not yet understand type extensions so fold the types in.
        const oldNode = this.getType(obj.name.value) as InterfaceTypeDefinitionNode;
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
                throw new Error(`Interface type extension '${obj.name.value}' cannot redeclare field ${newField.name.value}`)
            }
            mergedFields.push(newField)
        }

        this.nodeMap[oldNode.name.value] = {
            ...oldNode,
            directives: mergedDirs,
            fields: mergedFields
        }
    }

    /**
     * Add an union extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The union type definition node to add.
     */
    public addUnionExtension(obj: UnionTypeExtensionNode) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error(`Cannot extend non-existant union '${obj.name.value}'.`)
        }
        // AppSync does not yet understand type extensions so fold the types in.
        const oldNode = this.getType(obj.name.value) as UnionTypeDefinitionNode;
        const newDirs = obj.directives || []
        const oldDirs = oldNode.directives || []
        const mergedDirs = [...oldDirs, ...newDirs]

        // An extension cannot redeclare possible values
        const oldTypes = oldNode.types || []
        const oldTypeMap = oldTypes.reduce(
            (acc: any, type: NamedTypeNode) => ({
                ...acc,
                [type.name.value]: true
            }),
            {}
        )
        const newTypes = obj.types || []
        const mergedFields = [...oldTypes]
        for (const newType of newTypes) {
            if (oldTypeMap[newType.name.value]) {
                throw new Error(`Union type extension '${obj.name.value}' cannot redeclare type ${newType.name.value}`)
            }
            mergedFields.push(newType)
        }

        this.nodeMap[oldNode.name.value] = {
            ...oldNode,
            directives: mergedDirs,
            types: mergedFields
        }
    }

    /**
     * Add an enum extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The enum type definition node to add.
     */
    public addEnumExtension(obj: EnumTypeExtensionNode) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error(`Cannot extend non-existant enum '${obj.name.value}'.`)
        }
        // AppSync does not yet understand type extensions so fold the types in.
        const oldNode = this.getType(obj.name.value) as EnumTypeDefinitionNode;
        const newDirs = obj.directives || []
        const oldDirs = oldNode.directives || []
        const mergedDirs = [...oldDirs, ...newDirs]

        // An extension cannot redeclare possible values
        const oldValues = oldNode.values || []
        const oldValuesMap = oldValues.reduce(
            (acc: any, type: EnumValueDefinitionNode) => ({
                ...acc,
                [type.name.value]: true
            }),
            {}
        )
        const newValues = obj.values || []
        const mergedValues = [...oldValues]
        for (const newValue of newValues) {
            if (oldValuesMap[newValue.name.value]) {
                throw new Error(`Enum type extension '${obj.name.value}' cannot redeclare value ${newValue.name.value}`)
            }
            mergedValues.push(newValue)
        }

        this.nodeMap[oldNode.name.value] = {
            ...oldNode,
            directives: mergedDirs,
            values: mergedValues
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

    /**
     * Add an enum type definition node to the context.
     * @param en The enum type definition node to add.
     */
    public addEnum(en: EnumTypeDefinitionNode) {
        if (this.nodeMap[en.name.value]) {
            throw new Error(`Conflicting enum type '${en.name.value}' found.`)
        }
        this.nodeMap[en.name.value] = en
    }

    /**
     * Add an item to the stack mapping.
     * @param stackName The destination stack name.
     * @param resource The resource id that should be put into the stack.
     */
    public mapResourceToStack(stackName: string, resource: string) {
        this.stackMapping.set(resource, stackName);
    }

    public getStackMapping(): StackMapping {
        return this.stackMapping
    }
}
