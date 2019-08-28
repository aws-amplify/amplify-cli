import {
    Transformer, gql, TransformerContext, getDirectiveArguments, TransformerContractError, InvalidDirectiveError
} from 'graphql-transformer-core';
import {
    obj, str, ref, printBlock, compoundExpression, newline, raw, qref, set, Expression, print,
    ifElse, iff, block, bool, forEach, list
} from 'graphql-mapping-template';
import {
    ResolverResourceIDs, ResourceConstants, isNonNullType,
    attributeTypeFromScalar, ModelResourceIDs, makeInputValueDefinition,
    wrapNonNull, withNamedNodeNamed,
    makeNonNullType, makeNamedType, getBaseType,
    makeConnectionField,
    makeScalarKeyConditionForType, applyKeyExpressionForCompositeKey,
    makeCompositeKeyConditionInputForKey, makeCompositeKeyInputForKey, toCamelCase, graphqlName
} from 'graphql-transformer-common';
import {
    ObjectTypeDefinitionNode, FieldDefinitionNode, DirectiveNode,
    InputObjectTypeDefinitionNode, TypeNode, Kind, InputValueDefinitionNode, EnumTypeDefinitionNode
} from 'graphql';
import { AppSync, IAM, Fn, DynamoDB, Refs } from 'cloudform-types'
import { Projection, GlobalSecondaryIndex, LocalSecondaryIndex } from 'cloudform-types/types/dynamoDb/table';
import * as Case from 'case';

interface KeyArguments {
    name?: string;
    fields: string[];
    queryField?: string;
}

export default class FunctionTransformer extends Transformer {

    constructor() {
        super(
            'KeyTransformer',
            gql`directive @key(name: String, fields: [String!]!, queryField: String) on OBJECT`
        )
    }

    /**
     * Augment the table key structures based on the @key.
     */
    object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        this.validate(definition, directive, ctx);
        this.updateIndexStructures(definition, directive, ctx);
        this.updateSchema(definition, directive, ctx);
        this.updateResolvers(definition, directive, ctx);
        this.addKeyConditionInputs(definition, directive, ctx);
    };

    /**
     * Update the existing @model table's index structures. Includes primary key, GSI, and LSIs.
     * @param definition The object type definition node.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    private updateIndexStructures = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        if (this.isPrimaryKey(directive)) {
            // Set the table's primary key using the @key definition.
            this.replacePrimaryKey(definition, directive, ctx);
        } else {
            // Append a GSI/LSI to the table configuration.
            this.appendSecondaryIndex(definition, directive, ctx);
        }
    }

    /**
     * Update the structural components of the schema that are relevant to the new index structures.
     *
     * Updates:
     * 1. getX with new primary key information.
     * 2. listX with new primary key information.
     *
     * Creates:
     * 1. A query field for each secondary index.
     */
    private updateSchema = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        this.updateQueryFields(definition, directive, ctx);
        this.updateInputObjects(definition, directive, ctx);
    }

    /**
     * Update the get, list, create, update, and delete resolvers with updated key information.
     */
    private updateResolvers = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const directiveArgs: KeyArguments = getDirectiveArguments(directive);
        const getResolver = ctx.getResource(ResolverResourceIDs.DynamoDBGetResolverResourceID(definition.name.value));
        const listResolver = ctx.getResource(ResolverResourceIDs.DynamoDBListResolverResourceID(definition.name.value));
        const createResolver = ctx.getResource(ResolverResourceIDs.DynamoDBCreateResolverResourceID(definition.name.value));
        const updateResolver = ctx.getResource(ResolverResourceIDs.DynamoDBUpdateResolverResourceID(definition.name.value));
        const deleteResolver = ctx.getResource(ResolverResourceIDs.DynamoDBDeleteResolverResourceID(definition.name.value));
        if (this.isPrimaryKey(directive)) {
            // When looking at a primary key we update the primary paths for writing/reading data.
            // and ensure any composite sort keys for the primary index.
            if (getResolver) {
                getResolver.Properties.RequestMappingTemplate = joinSnippets([
                    this.setKeySnippet(directive),
                    getResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (listResolver) {
                listResolver.Properties.RequestMappingTemplate = joinSnippets([
                    print(setQuerySnippet(definition, directive, ctx)),
                    listResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (createResolver) {
                createResolver.Properties.RequestMappingTemplate = joinSnippets([
                    this.setKeySnippet(directive, true),
                    ensureCompositeKeySnippet(directive),
                    createResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (updateResolver) {
                updateResolver.Properties.RequestMappingTemplate = joinSnippets([
                    this.setKeySnippet(directive, true),
                    ensureCompositeKeySnippet(directive),
                    updateResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (deleteResolver) {
                deleteResolver.Properties.RequestMappingTemplate = joinSnippets([
                    this.setKeySnippet(directive, true),
                    deleteResolver.Properties.RequestMappingTemplate
                ]);
            }
        } else {
            // When looking at a secondary key we need to ensure any composite sort key values
            // and validate update operations to protect the integrity of composite sort keys.
            if (createResolver) {
                createResolver.Properties.RequestMappingTemplate = joinSnippets([
                    ensureCompositeKeySnippet(directive),
                    createResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (updateResolver) {
                updateResolver.Properties.RequestMappingTemplate = joinSnippets([
                    this.validateKeyUpdateArgumentsSnippet(directive),
                    ensureCompositeKeySnippet(directive),
                    updateResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (deleteResolver) {
                deleteResolver.Properties.RequestMappingTemplate = joinSnippets([
                    ensureCompositeKeySnippet(directive),
                    deleteResolver.Properties.RequestMappingTemplate
                ]);
            }
            if (directiveArgs.queryField) {
                const queryTypeName = ctx.getQueryTypeName();
                const queryResolverId = ResolverResourceIDs.ResolverResourceID(queryTypeName, directiveArgs.queryField);
                const queryResolver = makeQueryResolver(definition, directive, ctx);
                ctx.mapResourceToStack(definition.name.value, queryResolverId);
                ctx.setResource(queryResolverId, queryResolver);
            }
        }
    }

    private addKeyConditionInputs = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const args: KeyArguments = getDirectiveArguments(directive);
        if (args.fields.length > 2) {
            const compositeKeyFieldNames = args.fields.slice(1);
            // To make sure we get the intended behavior and type conversion we have to keep the order of the fields
            // as it is in the key field list
            const compositeKeyFields = [];
            for (const compositeKeyFieldName of compositeKeyFieldNames) {
                const field = definition.fields.find(field => field.name.value === compositeKeyFieldName);
                if (!field) {
                    throw new InvalidDirectiveError(`Can't find field: ${compositeKeyFieldName} in ${definition.name.value}, but it was specified in the @key definition.`);
                } else {
                    compositeKeyFields.push (field);
                }
            }
            const keyName = Case.pascal(args.name || 'Primary');
            const keyConditionInput = makeCompositeKeyConditionInputForKey(definition.name.value, keyName, compositeKeyFields);
            if (!ctx.getType(keyConditionInput.name.value)) {
                ctx.addInput(keyConditionInput);
            }
            const compositeKeyInput = makeCompositeKeyInputForKey(definition.name.value, keyName, compositeKeyFields);
            if (!ctx.getType(compositeKeyInput.name.value)) {
                ctx.addInput(compositeKeyInput);
            }
        } else if (args.fields.length === 2) {
            const finalSortKeyFieldName = args.fields[1];
            const finalSortKeyField = definition.fields.find(f => f.name.value === finalSortKeyFieldName);
            const typeResolver = (baseType: string) => {
                const resolvedEnumType = ctx.getType(baseType) as EnumTypeDefinitionNode;
                return resolvedEnumType ? 'String' : undefined;
            };
            const sortKeyConditionInput = makeScalarKeyConditionForType(finalSortKeyField.type, typeResolver);

            if (!sortKeyConditionInput) {
                const checkedKeyName = args.name ? args.name : "<unnamed>";
                throw new InvalidDirectiveError(`Cannot resolve type for field '${finalSortKeyFieldName}' in @key '${checkedKeyName}' on type '${definition.name.value}'.`);
            }

            if (!ctx.getType(sortKeyConditionInput.name.value)) {
                ctx.addInput(sortKeyConditionInput);
            }
        }
    }

    /**
     * Updates query fields to include any arguments required by the key structures.
     * @param definition The object type definition node.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    private updateQueryFields = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        this.updateGetField(definition, directive, ctx);
        this.updateListField(definition, directive, ctx);
        this.ensureQueryField(definition, directive, ctx);
    }

    // If the get field exists, update its arguments with primary key information.
    private updateGetField = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        let query = ctx.getQuery();
        const getResourceID = ResolverResourceIDs.DynamoDBGetResolverResourceID(definition.name.value);
        const getResolverResource = ctx.getResource(getResourceID);
        if (getResolverResource && this.isPrimaryKey(directive)) {
            // By default takes a single argument named 'id'. Replace it with the updated primary key structure.
            let getField: FieldDefinitionNode = query.fields.find(field => field.name.value === getResolverResource.Properties.FieldName) as FieldDefinitionNode;
            const args: KeyArguments = getDirectiveArguments(directive);
            const getArguments = args.fields.map(keyAttributeName => {
                const keyField = definition.fields.find(field => field.name.value === keyAttributeName);
                const keyArgument = makeInputValueDefinition(keyAttributeName, makeNonNullType(makeNamedType(getBaseType(keyField.type))));
                return keyArgument;
            })
            getField = { ...getField, arguments: getArguments };
            query = { ...query, fields: query.fields.map(field => field.name.value === getField.name.value ? getField : field)}
            ctx.putType(query);
        }
    }

    // If the list field exists, update its arguments with primary key information.
    private updateListField = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const listResourceID = ResolverResourceIDs.DynamoDBListResolverResourceID(definition.name.value);
        const listResolverResource = ctx.getResource(listResourceID);
        if (listResolverResource && this.isPrimaryKey(directive)) {
            // By default takes a single argument named 'id'. Replace it with the updated primary key structure.
            let query = ctx.getQuery();
            let listField: FieldDefinitionNode = query.fields.find(field => field.name.value === listResolverResource.Properties.FieldName) as FieldDefinitionNode;
            let listArguments: InputValueDefinitionNode[] = [ ...listField.arguments ];
            const args: KeyArguments = getDirectiveArguments(directive);
            if (args.fields.length > 2) {
                listArguments = addCompositeSortKey(definition, args, listArguments);
                listArguments = addHashField(definition, args, listArguments);
            } else if (args.fields.length === 2) {
                listArguments = addSimpleSortKey(ctx, definition, args, listArguments);
                listArguments = addHashField(definition, args, listArguments);
            } else {
                listArguments = addHashField(definition, args, listArguments);
            }
            listArguments.push(makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')));
            listField = { ...listField, arguments: listArguments };
            query = { ...query, fields: query.fields.map(field => field.name.value === listField.name.value ? listField : field)}
            ctx.putType(query);
        }
    }

    // If this is a secondary key and a queryField has been provided, create the query field.
    private ensureQueryField = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const args: KeyArguments = getDirectiveArguments(directive);
        if (args.queryField && !this.isPrimaryKey(directive)) {
            let queryType = ctx.getQuery();
            let queryArguments = [];
            if (args.fields.length > 2) {
                queryArguments = addCompositeSortKey(definition, args, queryArguments);
                queryArguments = addHashField(definition, args, queryArguments);
            } else if (args.fields.length === 2) {
                queryArguments = addSimpleSortKey(ctx, definition, args, queryArguments);
                queryArguments = addHashField(definition, args, queryArguments);
            } else {
                queryArguments = addHashField(definition, args, queryArguments);
            }
            queryArguments.push(makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')));
            const queryField = makeConnectionField(args.queryField, definition.name.value, queryArguments);
            queryType = {
                ...queryType,
                fields: [...queryType.fields, queryField]
            };
            ctx.putType(queryType);
        }
    }

    // Update the create, update, and delete input objects to account for any changes to the primary key.
    private updateInputObjects = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        if (this.isPrimaryKey(directive)) {
            const directiveArgs: KeyArguments = getDirectiveArguments(directive);
            const createInput = ctx.getType(ModelResourceIDs.ModelCreateInputObjectName(definition.name.value)) as InputObjectTypeDefinitionNode;
            if (createInput) {
                ctx.putType(replaceCreateInput(definition, createInput, directiveArgs.fields));
            }
            const updateInput = ctx.getType(ModelResourceIDs.ModelUpdateInputObjectName(definition.name.value)) as InputObjectTypeDefinitionNode;
            if (updateInput) {
                ctx.putType(replaceUpdateInput(definition, updateInput, directiveArgs.fields));
            }
            const deleteInput = ctx.getType(ModelResourceIDs.ModelDeleteInputObjectName(definition.name.value)) as InputObjectTypeDefinitionNode;
            if (deleteInput) {
                ctx.putType(replaceDeleteInput(definition, deleteInput, directiveArgs.fields));
            }
        }
    }

    // Return a VTL snippet that sets the key for key for get, update, and delete operations.
    private setKeySnippet = (directive: DirectiveNode, isMutation: boolean = false) => {
        const directiveArgs = getDirectiveArguments(directive);
        const cmds: Expression[] = [set(
            ref(ResourceConstants.SNIPPETS.ModelObjectKey),
            modelObjectKey(directiveArgs, isMutation)
        )];
        return printBlock(`Set the primary @key`)(compoundExpression(cmds));
    }

    // When issuing an update mutation that changes one part of a composite sort key,
    // you must supply the entire key so that the underlying composite key can be resaved
    // in the update operation. We only need to update for composite sort keys on secondary indexes.
    private validateKeyUpdateArgumentsSnippet = (directive: DirectiveNode): string => {
        const directiveArgs: KeyArguments = getDirectiveArguments(directive);
        if (!this.isPrimaryKey(directive) && directiveArgs.fields.length > 2) {
            const sortKeyFields = directiveArgs.fields.slice(1);
            return printBlock(`Validate update mutation for @key '${directiveArgs.name}'`)(compoundExpression([
                set(ref('hasSeenSomeKeyArg'), bool(false)),
                set(ref('keyFieldNames'), list(sortKeyFields.map(f => str(f)))),
                forEach(ref('keyFieldName'), ref('keyFieldNames'), [
                    iff(
                        raw(`$ctx.args.input.containsKey("$keyFieldName")`),
                        set(ref('hasSeenSomeKeyArg'), bool(true)),
                        true
                    )
                ]),
                forEach(ref('keyFieldName'), ref('keyFieldNames'), [
                    iff(
                        raw(`$hasSeenSomeKeyArg && !$ctx.args.input.containsKey("$keyFieldName")`),
                        raw(`$util.error("When updating any part of the composite sort key for @key '${directiveArgs.name}',` +
                        ` you must provide all fields for the key. Missing key: '$keyFieldName'.")`)
                    )
                ])
            ]));
        }
        return '';
    }

    /**
     * Validates the directive usage is semantically valid.
     *
     * 1. There may only be 1 @key without a name (specifying the primary key)
     * 2. There may only be 1 @key with a given name.
     * 3. @key must only reference existing scalar fields that map to DynamoDB S, N, or B.
     * 4. A primary key must not include a 'queryField'.
     * 5. If there is no primary sort key, make sure there are no more LSIs.
     * @param definition The object type definition node.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    private validate = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const directiveArgs = getDirectiveArguments(directive);
        if (!directiveArgs.name) {
            // 1. Make sure there are no more directives without a name.
            for (const otherDirective of definition.directives.filter(d => d.name.value === 'key')) {
                const otherArgs = getDirectiveArguments(otherDirective);
                if (otherDirective !== directive && !otherArgs.name) {
                    throw new InvalidDirectiveError(`You may only supply one primary @key on type '${definition.name.value}'.`);
                }
                // 5. If there is no primary sort key, make sure there are no more LSIs.
                const hasPrimarySortKey = directiveArgs.fields.length > 1;
                const primaryHashField = directiveArgs.fields[0];
                const otherHashField = otherArgs.fields[0];
                if (
                    otherDirective !== directive &&
                    !hasPrimarySortKey &&
                    // If the primary key and other key share the first field and are not the same directive it is an LSI.
                    primaryHashField === otherHashField
                ) {
                    throw new InvalidDirectiveError(
                        `Invalid @key "${otherArgs.name}". You may not create a @key where the first field in 'fields' ` +
                        `is the same as that of the primary @key unless the primary @key has multiple 'fields'. ` +
                        `You cannot have a local secondary index without a sort key in the primary index.`
                    );
                }
            }
            // 4. Make sure that a 'queryField' is not included on a primary @key.
            if (directiveArgs.queryField) {
                throw new InvalidDirectiveError(`You cannot pass 'queryField' to the primary @key on type '${definition.name.value}'.`);
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
                const checkedKeyName = directiveArgs.name ? directiveArgs.name : "<unnamed>";
                throw new InvalidDirectiveError(`You cannot specify a non-existant field '${fieldName}' in @key '${checkedKeyName}' on type '${definition.name.value}'.`);
            } else {
                const existingField = fieldMap.get(fieldName);
                const ddbKeyType = attributeTypeFromType(existingField.type, ctx);
                if (this.isPrimaryKey(directive) && !isNonNullType(existingField.type)) {
                    throw new InvalidDirectiveError(`The primary @key on type '${definition.name.value}' must reference non-null fields.`);
                } else if (ddbKeyType !== 'S' && ddbKeyType !== 'N' && ddbKeyType !== 'B') {
                    throw new InvalidDirectiveError(`A @key on type '${definition.name.value}' cannot reference non-scalar field ${fieldName}.`);
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
     * @param definition The object type definition node.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    replacePrimaryKey = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const args: KeyArguments = getDirectiveArguments(directive);
        const ks = keySchema(args);
        const attrDefs = attributeDefinitions(args, definition, ctx);
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
     * @param definition The object type definition node.
     * @param directive The @key directive
     * @param ctx The transformer context
     */
    appendSecondaryIndex = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const args: KeyArguments = getDirectiveArguments(directive);
        const ks = keySchema(args);
        const attrDefs = attributeDefinitions(args, definition, ctx);
        const tableLogicalID = ModelResourceIDs.ModelTableResourceID(definition.name.value);
        const tableResource = ctx.getResource(tableLogicalID);
        const primaryKeyDirective = getPrimaryKey(definition);
        const primaryPartitionKeyName = primaryKeyDirective ? getDirectiveArguments(primaryKeyDirective).fields[0] : 'id';
        if (!tableResource) {
            throw new InvalidDirectiveError(`The @key directive may only be added to object definitions annotated with @model.`);
        } else {
            const baseIndexProperties = {
                IndexName: args.name,
                KeySchema: ks,
                Projection: new Projection({
                    ProjectionType: 'ALL'
                })
            };
            if (primaryPartitionKeyName === ks[0].AttributeName) {
                // This is an LSI.
                // Add the new secondary index and update the table's attribute definitions.
                tableResource.Properties.LocalSecondaryIndexes = append(
                    tableResource.Properties.LocalSecondaryIndexes,
                    new LocalSecondaryIndex(baseIndexProperties)
                )
            } else {
                // This is a GSI.
                // Add the new secondary index and update the table's attribute definitions.
                tableResource.Properties.GlobalSecondaryIndexes = append(
                    tableResource.Properties.GlobalSecondaryIndexes,
                    new GlobalSecondaryIndex({
                        ...baseIndexProperties,
                        ProvisionedThroughput: Fn.If(
                            ResourceConstants.CONDITIONS.ShouldUsePayPerRequestBilling,
                            Refs.NoValue,
                            {
                                ReadCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableReadIOPS),
                                WriteCapacityUnits: Fn.Ref(ResourceConstants.PARAMETERS.DynamoDBModelTableWriteIOPS)
                            }
                        ) as any,
                    })
                )
            }
            const existingAttrDefSet = new Set(tableResource.Properties.AttributeDefinitions.map(ad => ad.AttributeName));
            for (const attr of attrDefs) {
                if (!existingAttrDefSet.has(attr.AttributeName)) {
                    tableResource.Properties.AttributeDefinitions.push(attr);
                }
            }
        }
    }
}

/**
 * Return a key schema given @key directive arguments.
 * @param args The arguments of the @key directive.
 */
function keySchema(args: KeyArguments) {
    if (args.fields.length > 1) {
        const condensedSortKey = condenseRangeKey(args.fields.slice(1));
        return [
            { AttributeName: args.fields[0], KeyType: 'HASH' },
            { AttributeName: condensedSortKey, KeyType: 'RANGE' },
        ];
    } else {
        return [{ AttributeName: args.fields[0], KeyType: 'HASH' }];
    }
}

function attributeTypeFromType(type: TypeNode, ctx: TransformerContext) {
    const baseTypeName = getBaseType(type);
    const ofType = ctx.getType(baseTypeName);
    if (ofType && ofType.kind === Kind.ENUM_TYPE_DEFINITION) {
        return 'S';
    }
    return attributeTypeFromScalar(type);
}

/**
 * Return a list of attribute definitions given a @key directive arguments and an object definition.
 * @param args The arguments passed to @key.
 * @param def The object type definition containing the @key.
 */
function attributeDefinitions(args: KeyArguments, def: ObjectTypeDefinitionNode, ctx: TransformerContext) {
    const fieldMap = new Map();
    for (const field of def.fields) {
        fieldMap.set(field.name.value, field);
    }
    if (args.fields.length > 2) {
        const hashName = args.fields[0];
        const condensedSortKey = condenseRangeKey(args.fields.slice(1));
        return [
            { AttributeName: hashName, AttributeType: attributeTypeFromType(fieldMap.get(hashName).type, ctx) },
            { AttributeName: condensedSortKey, AttributeType: 'S' },
        ];
    } else if (args.fields.length === 2) {
        const hashName = args.fields[0];
        const sortName = args.fields[1];
        return [
            { AttributeName: hashName, AttributeType: attributeTypeFromType(fieldMap.get(hashName).type, ctx) },
            { AttributeName: sortName, AttributeType: attributeTypeFromType(fieldMap.get(sortName).type, ctx) },
        ];
    } else {
        const fieldName = args.fields[0];
        return [{ AttributeName: fieldName, AttributeType: attributeTypeFromType(fieldMap.get(fieldName).type, ctx) }];
    }
}

function append<T>(maybeList: T[] | undefined, item: T) {
    if (maybeList) {
        return [...maybeList, item];
    }
    return [item];
}

function getPrimaryKey(obj: ObjectTypeDefinitionNode): DirectiveNode | undefined {
    for (const directive of obj.directives) {
        if (directive.name.value === 'key' && !getDirectiveArguments(directive).name) {
            return directive;
        }
    }
}

function primaryIdFields(definition: ObjectTypeDefinitionNode, keyFields: string[]): InputValueDefinitionNode[] {
    return keyFields.map(keyFieldName => {
        const keyField: FieldDefinitionNode = definition.fields.find(field => field.name.value === keyFieldName);
        return makeInputValueDefinition(keyFieldName, makeNonNullType(makeNamedType(getBaseType(keyField.type))));
    })
}

// Key fields are non-nullable, non-key fields follow what their @model declaration makes.
function replaceCreateInput(definition: ObjectTypeDefinitionNode, input: InputObjectTypeDefinitionNode, keyFields: string[]): InputObjectTypeDefinitionNode {
    return {
        ...input,
        fields: input.fields.reduce((acc, f) => {
            // If the field is a key, make it non-null.
            if (keyFields.find(k => k === f.name.value)) {
                return [...acc, makeInputValueDefinition(f.name.value, makeNonNullType(makeNamedType(getBaseType(f.type))))];
            }
            return [...acc, f];
        }, [])
    };
};

// Key fields are non-nullable, non-key fields are not non-nullable.
function replaceUpdateInput(definition: ObjectTypeDefinitionNode, input: InputObjectTypeDefinitionNode, keyFields: string[]): InputObjectTypeDefinitionNode {
    return {
        ...input,
        fields: input.fields.map(
            f => {
                if (keyFields.find(k => k === f.name.value)) {
                    return makeInputValueDefinition(f.name.value, wrapNonNull(withNamedNodeNamed(f.type, getBaseType(f.type))));
                } else {
                    return f;
                }
            }
        )
    };
};

// Key fields are non-nullable, non-key fields are not non-nullable.
function replaceDeleteInput(definition: ObjectTypeDefinitionNode, input: InputObjectTypeDefinitionNode, keyFields: string[]): InputObjectTypeDefinitionNode {
    return {
        ...input,
        fields: primaryIdFields(definition, keyFields)
    };
};

/**
 * Return a VTL object containing the compressed key information.
 * @param args The arguments of the @key directive.
 */
function modelObjectKey(args: KeyArguments, isMutation: boolean) {
    const argsPrefix = isMutation ?
        'ctx.args.input' :
        'ctx.args';
    if (args.fields.length > 2) {
        const rangeKeyFields = args.fields.slice(1);
        const condensedSortKey = condenseRangeKey(rangeKeyFields);
        const condensedSortKeyValue = condenseRangeKey(
            rangeKeyFields.map(keyField => `\${${argsPrefix}.${keyField}}`)
        );
        return obj({
            [args.fields[0]]: ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${args.fields[0]})`),
            [condensedSortKey]: ref(`util.dynamodb.toDynamoDB("${condensedSortKeyValue}")`)
        });
    } else if (args.fields.length === 2) {
        return obj({
            [args.fields[0]]: ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${args.fields[0]})`),
            [args.fields[1]]: ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${args.fields[1]})`)
        });
    } else if (args.fields.length === 1) {
        return obj({
            [args.fields[0]]: ref(`util.dynamodb.toDynamoDB($${argsPrefix}.${args.fields[0]})`),
        });
    }
    throw new InvalidDirectiveError('@key directives must include at least one field.');
}

function ensureCompositeKeySnippet(dir: DirectiveNode): string {
    const args: KeyArguments = getDirectiveArguments(dir);
    const argsPrefix = 'ctx.args.input';
    if (args.fields.length > 2) {
        const rangeKeyFields = args.fields.slice(1);
        const condensedSortKey = condenseRangeKey(rangeKeyFields);
        const dynamoDBFriendlySortKeyName = toCamelCase(rangeKeyFields.map(f => graphqlName(f)));
        const condensedSortKeyValue = condenseRangeKey(
            rangeKeyFields.map(keyField => `\${${argsPrefix}.${keyField}}`)
        );
        return print(compoundExpression([
            ifElse(
                raw(`$util.isNull($${ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap})`),
                set(ref(ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap), obj({
                    [condensedSortKey]: str(dynamoDBFriendlySortKeyName)
                })),
                qref(`$${ResourceConstants.SNIPPETS.DynamoDBNameOverrideMap}.put("${condensedSortKey}", "${dynamoDBFriendlySortKeyName}")`)
            ),
            qref(`$ctx.args.input.put("${condensedSortKey}","${condensedSortKeyValue}")`)
        ]));
    }
    return '';
}

function condenseRangeKey(fields: string[]) {
    return fields.join(ModelResourceIDs.ModelCompositeKeySeparator());
}

function makeQueryResolver(definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) {
    const type = definition.name.value;
    const directiveArgs: KeyArguments = getDirectiveArguments(directive);
    const index = directiveArgs.name;
    const fieldName = directiveArgs.queryField;
    const queryTypeName = ctx.getQueryTypeName();
    const defaultPageLimit = 10
    const requestVariable = 'QueryRequest';
    return new AppSync.Resolver({
        ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        DataSourceName: Fn.GetAtt(ModelResourceIDs.ModelTableDataSourceID(type), 'Name'),
        FieldName: fieldName,
        TypeName: queryTypeName,
        RequestMappingTemplate: print(
            compoundExpression([
                setQuerySnippet(definition, directive, ctx),
                set(ref('limit'),
                ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
                set(
                    ref(requestVariable),
                    obj({
                        version: str('2017-02-28'),
                        operation: str('Query'),
                        limit: ref('limit'),
                        query: ref(ResourceConstants.SNIPPETS.ModelQueryExpression),
                        index: str(index)
                    })
                ),
                ifElse(
                    raw(`!$util.isNull($ctx.args.sortDirection)
                    && $ctx.args.sortDirection == "DESC"`),
                    set(ref(`${requestVariable}.scanIndexForward`), bool(false)),
                    set(ref(`${requestVariable}.scanIndexForward`), bool(true)),
                ),
                iff(
                    ref('context.args.nextToken'),
                    set(
                        ref(`${requestVariable}.nextToken`),
                        str('$context.args.nextToken')
                    ),
                    true
                ),
                iff(
                    ref('context.args.filter'),
                    set(
                        ref(`${requestVariable}.filter`),
                        ref('util.parseJson("$util.transform.toDynamoDBFilterExpression($ctx.args.filter)")')
                    ),
                    true
                ),
                raw(`$util.toJson($${requestVariable})`)
            ])
        ),
        ResponseMappingTemplate: print(
            raw('$util.toJson($ctx.result)')
        )
    })
}

function setQuerySnippet(definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) {
    const args: KeyArguments = getDirectiveArguments(directive);
    const keys = args.fields;
    const keyTypes = keys.map(k => {
        const field = definition.fields.find(f => f.name.value === k);
        return attributeTypeFromType(field.type, ctx);
    })
    return block(`Set query expression for @key`, [
        set(ref(ResourceConstants.SNIPPETS.ModelQueryExpression), obj({})),
        applyKeyExpressionForCompositeKey(keys, keyTypes, ResourceConstants.SNIPPETS.ModelQueryExpression)
    ])
}

function addHashField(definition: ObjectTypeDefinitionNode, args: KeyArguments, elems: InputValueDefinitionNode[]): InputValueDefinitionNode[] {
    let hashFieldName = args.fields[0];
    const hashField = definition.fields.find(field => field.name.value === hashFieldName);
    const hashKey = makeInputValueDefinition(hashFieldName, makeNamedType(getBaseType(hashField.type)));
    return [hashKey, ...elems];
}
function addSimpleSortKey(ctx: TransformerContext, definition: ObjectTypeDefinitionNode, args: KeyArguments, elems: InputValueDefinitionNode[]): InputValueDefinitionNode[] {
    let sortKeyName = args.fields[1];
    const sortField = definition.fields.find(field => field.name.value === sortKeyName);
    const baseType = getBaseType(sortField.type);
    const resolvedTypeIfEnum = ctx.getType(baseType) as EnumTypeDefinitionNode ? 'String' : undefined;
    const resolvedType = resolvedTypeIfEnum ? resolvedTypeIfEnum : baseType;
    const hashKey = makeInputValueDefinition(sortKeyName, makeNamedType(ModelResourceIDs.ModelKeyConditionInputTypeName(resolvedType)));
    return [hashKey, ...elems];
}
function addCompositeSortKey(definition: ObjectTypeDefinitionNode, args: KeyArguments, elems: InputValueDefinitionNode[]): InputValueDefinitionNode[] {
    let sortKeyNames = args.fields.slice(1);
    const compositeSortKeyName = toCamelCase(sortKeyNames);
    const hashKey = makeInputValueDefinition(compositeSortKeyName, makeNamedType(ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(definition.name.value, args.name || 'Primary')));
    return [hashKey, ...elems];
}
function joinSnippets(lines: string[]): string {
    return lines.join('\n');
}
