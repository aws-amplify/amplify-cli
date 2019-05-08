import { 
    Transformer, gql, TransformerContext, getDirectiveArguments, TransformerContractError, InvalidDirectiveError
} from 'graphql-transformer-core';
import { obj, str, ref, printBlock, compoundExpression, qref, raw, iff } from 'graphql-mapping-template';
import { ResolverResourceIDs, ResourceConstants, isNonNullType, toCamelCase, attributeTypeFromScalar, ModelResourceIDs } from 'graphql-transformer-common';
import { ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode } from 'graphql';
import { AppSync, IAM, Fn, DynamoDB } from 'cloudform-types'

const FUNCTION_DIRECTIVE_STACK = 'FunctionDirectiveStack';

interface KeyArguments {
    name?: string;
    fields: string[];
}

export default class FunctionTransformer extends Transformer {

    constructor() {
        super(
            'KeyTransformer', 
            gql`directive @key(name: String, fields: [String!]!) on OBJECT`
        )
    }

    /**
     * Augment the table key structures based on the @key.
     */
    object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, acc: TransformerContext) => {
        this.validate(definition, directive, acc);

        if (this.isPrimaryKey(directive)) {
            // Set the table's primary key using the @key definition.
            this.replacePrimaryKey(definition, directive, acc);
        } else {
            // Append a GSI/LSI to the table configuration.
            this.appendSecondaryIndex(definition, directive, acc);
        }
    };

    /**
     * Validates the directive usage is semantically valid.
     * 
     * 1. There may only be 1 @key without a name (specifying the primary key)
     * 2. There may only be 1 @key with a given name.
     * 3. @key must only reference existing scalar fields that map to DynamoDB S, N, or B.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    validate = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const directiveArgs = getDirectiveArguments(directive);
        if (!directiveArgs.name) {
            // 1. Make sure there are no more directives without a name.
            for (const otherDirective of definition.directives.filter(d => d.name.value === 'key')) {
                const otherArgs = getDirectiveArguments(otherDirective);
                if (otherDirective !== directive && !otherArgs.name) {
                    throw new InvalidDirectiveError(`You may only supply one @key without a name on type '${definition.name.value}'.`);
                }
            }
        } else {
            // 2. Make sure there are no more directives with the same name.
            for (const otherDirective of definition.directives.filter(d => d.name.value === 'key')) {
                const otherArgs = getDirectiveArguments(otherDirective);
                if (otherDirective !== directive && otherArgs.name === directiveArgs.name) {
                    throw new InvalidDirectiveError(`You may only supply one @key with the name '${directiveArgs.name}' on type '${definition.name.value}'.`);
                }
            }
        }
        // 3. Check that fields exists and are valid key types.
        const fieldMap = new Map();
        for (const field of definition.fields) {
            fieldMap.set(field.name.value, field);
        }
        for (const fieldName of directiveArgs.fields) {
            if (!fieldMap.has(fieldName)) {
                throw new InvalidDirectiveError(`You cannot specify a non-existant field '${fieldName}' in @key '${directiveArgs.name}' on type '${definition.name.value}'.`);
            } else {
                const existingField = fieldMap.get(fieldName);
                const ddbKeyType = attributeTypeFromScalar(existingField.type);
                if (!isNonNullType(existingField.type)) {
                    throw new InvalidDirectiveError(`The primary @key on type '${definition.name.value}' must reference non-null fields.`);
                } else if (ddbKeyType !== 'S' && ddbKeyType !== 'N' && ddbKeyType !== 'B') {
                    throw new InvalidDirectiveError(`The primary @key on type '${definition.name.value}' cannot reference non-scalar field ${fieldName}.`);
                }
            }
        }
    }

    /**
     * Returns true if the directive specifies a primary key.
     * @param directive The directive node.
     */
    isPrimaryKey = (directive: DirectiveNode) => {
        const directiveArgs = getDirectiveArguments(directive);
        return !Boolean(directiveArgs.name);
    }

    /**
     * Replace the primary key schema with one defined by a @key.
     */
    replacePrimaryKey = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const args: KeyArguments = getDirectiveArguments(directive);
        const ks = keySchema(args);
        const attrDefs = attributeDefinitions(args, definition);
        const tableLogicalID = ModelResourceIDs.ModelTableResourceID(definition.name.value);
        const tableResource = ctx.getResource(tableLogicalID);
        if (!tableResource) {
            throw new InvalidDirectiveError(`The @key directive may only be added to object definitions annotated with @model.`);
        } else {
            // First remove any attribute definitions in the current primary key.
            const existingAttrDefSet = new Set(tableResource.Properties.AttributeDefinitions.map(ad => ad.AttributeName));
            for (const existingKey of tableResource.Properties.KeySchema) {
                if (existingAttrDefSet.has(existingKey.AttributeName)) {
                    tableResource.Properties.AttributeDefinitions = tableResource.Properties.AttributeDefinitions.filter(ad => ad.AttributeName !== existingKey.AttributeName);
                    existingAttrDefSet.delete(existingKey.AttributeName);
                }
            }
            // Then replace the KeySchema and add any new attribute definitions back.
            tableResource.Properties.KeySchema = ks;
            for (const attr of attrDefs) {
                if (!existingAttrDefSet.has(attr.AttributeName)) {
                    tableResource.Properties.AttributeDefinitions.push(attr);
                }
            }
        }
    }

    /**
     * Add a LSI or GSI to the table as defined by a @key.
     */
    appendSecondaryIndex = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
    }
}

function keySchema(args: KeyArguments) {
    if (args.fields.length > 1) {
        const condensedSortKey = toCamelCase(args.fields.slice(1));
        return [
            { AttributeName: args.fields[0], KeyType: 'HASH' },
            { AttributeName: condensedSortKey, KeyType: 'RANGE' },
        ];
    } else {
        return [{ AttributeName: args.fields[0], KeyType: 'HASH' }];
    }
}

function attributeDefinitions(args: KeyArguments, def: ObjectTypeDefinitionNode) {
    const fieldMap = new Map();
    for (const field of def.fields) {
        fieldMap.set(field.name.value, field);
    }
    if (args.fields.length > 2) {
        const hashName = args.fields[0];
        const condensedSortKey = toCamelCase(args.fields.slice(1));
        return [
            { AttributeName: hashName, AttributeType: attributeTypeFromScalar(fieldMap.get(hashName).type) },
            { AttributeName: condensedSortKey, AttributeType: 'S' },
        ];
    } else if (args.fields.length === 2) {
        const hashName = args.fields[0];
        const sortName = args.fields[1];
        return [
            { AttributeName: hashName, AttributeType: attributeTypeFromScalar(fieldMap.get(hashName).type) },
            { AttributeName: sortName, AttributeType: attributeTypeFromScalar(fieldMap.get(sortName).type) },
        ];
    } else {
        const fieldName = args.fields[0];
        return [{ AttributeName: fieldName, AttributeType: attributeTypeFromScalar(fieldMap.get(fieldName).type) }];
    }
}
