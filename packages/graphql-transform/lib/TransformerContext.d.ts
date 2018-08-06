import Template from 'cloudform/types/template';
import Resource from 'cloudform/types/resource';
import Parameter from 'cloudform/types/parameter';
import { Condition } from 'cloudform/types/dataTypes';
import Output from 'cloudform/types/output';
import { TypeSystemDefinitionNode, ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode, SchemaDefinitionNode, ObjectTypeExtensionNode, DocumentNode, EnumTypeDefinitionNode } from 'graphql';
export declare class TransformerContextMetadata {
    /**
     * Used by transformers to pass information between one another.
     */
    private metadata;
    get(key: string): any;
    set(key: string, val: any): void;
    has(key: string): boolean;
}
/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
export default class TransformerContext {
    template: Template;
    nodeMap: {
        [name: string]: TypeSystemDefinitionNode;
    };
    inputDocument: DocumentNode;
    metadata: TransformerContextMetadata;
    constructor(inputSDL: string);
    mergeResources(resources: {
        [key: string]: Resource;
    }): void;
    mergeParameters(params: {
        [key: string]: Parameter;
    }): void;
    mergeConditions(conditions: {
        [key: string]: Condition;
    }): void;
    getResource(resource: string): Resource;
    setResource(key: string, resource: Resource): void;
    setOutput(key: string, output: Output): void;
    getOutput(key: string): Output;
    mergeOutputs(outputs: {
        [key: string]: Output;
    }): void;
    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    addSchema(obj: SchemaDefinitionNode): void;
    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    addObject(obj: ObjectTypeDefinitionNode): void;
    getObject(name: string): ObjectTypeDefinitionNode | undefined;
    /**
     * Add an object type extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The object type definition node to add.
     */
    addObjectExtension(obj: ObjectTypeExtensionNode): void;
    /**
     * Add an input type definition node to the context.
     * @param inp The input type definition node to add.
     */
    addInput(inp: InputObjectTypeDefinitionNode): void;
    /**
     * Add an enum type definition node to the context.
     * @param en The enum type definition node to add.
     */
    addEnum(en: EnumTypeDefinitionNode): void;
}
