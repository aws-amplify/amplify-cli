import {
    Transformer, TransformerContext, InvalidDirectiveError,
    gql, getDirectiveArguments
} from 'graphql-transformer-core'
import {
    makeModelConnectionType,
    makeModelConnectionField,
    makeScalarFilterInputs,
    makeModelXFilterInputObject,
    makeModelSortDirectionEnumObject,
} from 'graphql-dynamodb-transformer'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode,
    InputObjectTypeDefinitionNode,
    NamedTypeNode
} from 'graphql'
import {
    getBaseType, isListType, ModelResourceIDs, isNonNullType, wrapNonNull, ResourceConstants,
    NONE_VALUE, ResolverResourceIDs, applyKeyConditionExpression, attributeTypeFromScalar, blankObject,
    makeScalarKeyConditionForType, makeNamedType
} from 'graphql-transformer-common'
import Table from 'cloudform-types/types/dynamoDb/table'
import {
    DynamoDBMappingTemplate, str, print,
    ref, obj, set, nul,
    ifElse, compoundExpression, bool, equals, iff, raw, comment, qref, Expression, block, ObjectNode, RawNode
} from 'graphql-mapping-template'
import { Fn } from 'cloudform-types'
import Resolver from 'cloudform-types/types/appSync/resolver'
import Key from 'cloudform-types/types/kms/key';
import { PrivateIpAddressSpecification } from 'cloudform-types/types/ec2/networkInterface';

interface KeySchema {
    AttributeName: string;
    KeyType: string;
}

interface RelationArguments {
    index?: string;
    fields: string[];
}

interface Index {
    IndexName: string;
    KeySchema: KeySchema[];
    Projection?: any;
    ProvisionedThroughput?: any;
}

/**
 * Create a get item resolver for singular connections.
 * @param type The parent type name.
 * @param field The connection field name.
 * @param relatedType The name of the related type to fetch from.
 * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
 * @param keySchema Key schema of the index or table being queried.
 */
function makeGetItemRelationResolver(type: string,
                                       field: string,
                                       relatedType: string,
                                       connectionAttributes: string[],
                                       keySchema: KeySchema[]): Resolver {

    let attributeName = keySchema[0].AttributeName as string

    let keyObj : ObjectNode = obj({
        [attributeName] :
            ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttributes[0]}, "${NONE_VALUE}"))`)
        })

    if (connectionAttributes[1]) {
        const sortKeyName = keySchema[1].AttributeName as string
        keyObj.attributes.push([
            sortKeyName,
            ref(`util.dynamodb.toDynamoDBJson($util.defaultIfNullOrBlank($ctx.source.${connectionAttributes[1]}, "${NONE_VALUE}"))`)
        ]);
    }

    return new Resolver({
        ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        DataSourceName: ModelResourceIDs.ModelTableResourceID(relatedType),
        FieldName: field,
        TypeName: type,
        RequestMappingTemplate: print(
            compoundExpression([
                DynamoDBMappingTemplate.getItem({
                    key: keyObj
                })
            ])
        ),
        ResponseMappingTemplate: print(
            ref('util.toJson($context.result)')
        )
    }).dependsOn([ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, ModelResourceIDs.ModelTableResourceID(relatedType)])
}


/**
 * Create a resolver that queries an item in DynamoDB.
 * @param type The parent type name.
 * @param field The connection field name.
 * @param relatedType The related type to fetch from.
 * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
 * @param keySchema The keySchema for the table or index being queried.
 * @param indexName The index to run the query on.
 */
function makeQueryRelationResolver(
    type: string,
    field: string,
    relatedType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    connectionAttributes: string[],
    keySchema: KeySchema[],
    indexName: string
) {
    const defaultPageLimit = 10
    const setup: Expression[] = [
        set(ref('limit'), ref(`util.defaultIfNull($context.args.limit, ${defaultPageLimit})`)),
        set(ref('query'), makeExpression(keySchema, connectionAttributes))
    ];
    if (keySchema[1] && !connectionAttributes[1]) {
        let sortKeyType = relatedType.fields.find(f => f.name.value === keySchema[1].AttributeName).type;
        let sortKeyAttType = attributeTypeFromScalar(sortKeyType);
        setup.push(applyKeyConditionExpression(keySchema[1].AttributeName, sortKeyAttType, 'query'));
    }

    var queryArguments : { query, filter, scanIndexForward, limit, nextToken, index? } = {
        query: raw('$util.toJson($query)'),
        scanIndexForward: ifElse(
            ref('context.args.sortDirection'),
            ifElse(
                equals(ref('context.args.sortDirection'), str('ASC')),
                bool(true),
                bool(false)
            ),
            bool(true)
        ),
        filter: ifElse(
            ref('context.args.filter'),
            ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'),
            nul()
        ),
        limit: ref('limit'),
        nextToken: ifElse(
            ref('context.args.nextToken'),
            str('$context.args.nextToken'),
            nul()
        )
    }
    if (indexName) {
        let indexArg = "index";
        queryArguments[indexArg] = str(indexName);
    }

    return new Resolver({
        ApiId: Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        DataSourceName: ModelResourceIDs.ModelTableResourceID(relatedType.name.value),
        FieldName: field,
        TypeName: type,
        RequestMappingTemplate: print(
            compoundExpression([
                ...setup,
                DynamoDBMappingTemplate.query(queryArguments)
            ])
        ),
        ResponseMappingTemplate: print(
            compoundExpression([
                iff(raw('!$result'), set(ref('result'), ref('ctx.result'))),
                raw('$util.toJson($result)')
            ])
        )
    }).dependsOn([ResourceConstants.RESOURCES.GraphQLSchemaLogicalID, ModelResourceIDs.ModelTableResourceID(relatedType.name.value)])
}

/**
 * Makes the query expression based on whether there is a sort key to be used for the query
 * or not.
 * @param keySchema The key schema for the table or index being queried.
 * @param connectionAttributes The names of the underlying attributes containing the fields to query by.
 */
function makeExpression(keySchema: KeySchema[], connectionAttributes: string[]) : ObjectNode {
    if (keySchema[1]) {
        return obj({
            'expression': str('#partitionKey = :partitionKey AND #sortKey = :sortKey'),
            'expressionNames': obj({
                '#partitionKey': str(keySchema[0].AttributeName),
                '#sortKey': str(keySchema[1].AttributeName),
            }),
            'expressionValues': obj({
                ':partitionKey': obj({
                    'S': str(`$context.source.${connectionAttributes[0]}`)
                }),
                ':sortKey': obj({
                    'S': str(`$context.source.${connectionAttributes[1]}`)
                }),
            })
        })
    }

    return obj({
        'expression': str('#partitionKey = :partitionKey'),
        'expressionNames': obj({
            '#partitionKey': str(keySchema[0].AttributeName)
        }),
        'expressionValues': obj({
            ':partitionKey': obj({
                'S': str(`$context.source.${connectionAttributes[0]}`)
            })
        })
    })
}



/**
 * Ensure that the field passed in is compatible to be a key field
 * (Not a list and of type ID or String)
 * @param field: the field to be checked.
 */
function validateKeyField(field: FieldDefinitionNode): void {
    if (!field) {
        return
    }
    const isNonNull = isNonNullType(field.type);
    const isAList = isListType(field.type)

    // The only valid key fields are single non-null fields.
    if (!isAList && isNonNull) {
        return;
    }
    throw new InvalidDirectiveError(`All fields used for a relation cannot be lists and must be of Non-Null types.`)
}

/**
 * Checks that the fields being used to query match the expected key types for the index being used.
 * @param parentFields: All fields of the parent object.
 * @param realtedTypeFields: All fields of the related object.
 * @param inputFieldNames: The fields passed in to the @relation directive.
 * @param keySchema: The key schema for the index being used.
 */
function checkFieldsAgainstIndex(parentFields: ReadonlyArray<FieldDefinitionNode>,
                                 relatedTypeFields: ReadonlyArray<FieldDefinitionNode>,
                                 inputFieldNames: string[],
                                 keySchema: KeySchema[]): void {
    let hashAttributeName = keySchema[0].AttributeName;
    let tablePKType = relatedTypeFields.find(f => f.name.value === hashAttributeName).type;
    let queryPKType = parentFields.find(f => f.name.value === inputFieldNames[0]).type;
    let numFields = inputFieldNames.length;

    if (getBaseType(tablePKType) !== getBaseType(queryPKType)) {
        throw new InvalidDirectiveError(inputFieldNames[0] + ' field is not of type ' + getBaseType(tablePKType))
    }
    if (numFields > keySchema.length) {
        throw new InvalidDirectiveError('Too many fields passed in for relation.')
    }
    if (numFields > 1) {
        let sortAttributeName = keySchema[1].AttributeName;
        let tableSKType = relatedTypeFields.find(f => f.name.value === sortAttributeName).type;
        let querySKType = parentFields.find(f => f.name.value === inputFieldNames[1]).type;

        if (getBaseType(tableSKType) !== getBaseType(querySKType)) {
            throw new InvalidDirectiveError(inputFieldNames[1] + ' field is not of type ' + getBaseType(tableSKType))
        }
    }
}


/**
 * The @relation directive can be used to connect objects by running a query on a table.
 * The directive is given an index to query and a list of fields to query by such that it
 * returns a list objects (or in certain cases a single object) that are connected to the
 * object it is called on.
 * This directive is designed to leverage indices configured using @key to create relationships.
 *
 * Directive Definition:
 * @relation(index: String, fields: [String!]!) on FIELD_DEFINITION
 * param @index The name of the index configured using @key that should be queried to get
 *      connected objects
 * param @fields The names of the fields on the current object to query by.
 */
export default class RelationTransformer extends Transformer {

    constructor() {
        super(
            'RelationTransformer',
            gql`directive @relation(index: String, fields: [String!]!) on FIELD_DEFINITION`
        )
    }

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const parentTypeName = parent.name.value;
        const fieldName = field.name.value;
        const args : RelationArguments = getDirectiveArguments(directive);
        const numFields = args.fields.length;

        // Check that related type exists and that the connected object is annotated with @model.
        const relatedTypeName = getBaseType(field.type)
        const relatedType = ctx.inputDocument.definitions.find(
            d => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName
        ) as ObjectTypeDefinitionNode | undefined

        if (!relatedType) {
            throw new InvalidDirectiveError(`Could not find an object type named ${relatedTypeName}.`)
        }

        const parentModelDirective = parent.directives.find((dir: DirectiveNode) => dir.name.value === 'model')
        const modelDirective = relatedType.directives.find((dir: DirectiveNode) => dir.name.value === 'model')

        // Get Child object's table.
        const tableLogicalID = ModelResourceIDs.ModelTableResourceID(relatedType.name.value);
        const tableResource = ctx.getResource(tableLogicalID) as Table;

        // Ensure that there is at least one field provided.
        if (numFields === 0) {
            throw new InvalidDirectiveError('No fields passed in to @relation directive.')
        }

        // Check that @relation was called on a @model type object.
        if (!parentModelDirective) {
            throw new InvalidDirectiveError(`Object type ${parentTypeName} must be annotated with @model.`)
        }
        if (!modelDirective) {
            throw new InvalidDirectiveError(`Object type ${relatedTypeName} must be annotated with @model.`)
        }

        // Check that each field provided exists in the parent model and that it is a valid key type (single non-null).
        let inputFields : FieldDefinitionNode[] = [];
        args.fields.forEach(
            item => {
                let fieldsArrayLength = inputFields.length;
                inputFields[fieldsArrayLength] = parent.fields.find(f => f.name.value === item);
                if (!inputFields[fieldsArrayLength]) {
                    throw new InvalidDirectiveError(item + ' is not a field in ' + parentTypeName)
                }

                validateKeyField(inputFields[fieldsArrayLength]);
            })

        var index : Index;
        // If no index is provided use the default index for the related model type and
        // check that the query fields match the PK/SK of the table. Else confirm that index exists.
        if (!args.index || args.index === 'default' || args.index === 'Default') {

            args.index = 'default';
            checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, tableResource.Properties.KeySchema);

        } else {
            index = (tableResource.Properties.GlobalSecondaryIndexes ?
                tableResource.Properties.GlobalSecondaryIndexes.find(GSI => GSI.IndexName === args.index) : null)
                || (tableResource.Properties.LocalSecondaryIndexes ?
                tableResource.Properties.LocalSecondaryIndexes.find(LSI => LSI.IndexName === args.index) : null)
            if (!index) {
                throw new InvalidDirectiveError('Index ' + args.index + ' does not exist for model ' + relatedTypeName)
            }

            // Confirm that types of query fields match types of PK/SK of the index being queried.
            checkFieldsAgainstIndex(parent.fields, relatedType.fields, args.fields, index.KeySchema);
        }

        // If the related type is not a list, the index has to be the default index and the fields provided must match the PK/SK of the index.
        if (!isListType(field.type)) {
            if (args.index !== 'default') {
                throw new InvalidDirectiveError('Relation is to a single object but the query index is not the default.')
            }

            // Start with GetItem resolver for case where the connection is to a single object.
            let getResolver = makeGetItemRelationResolver(
                parentTypeName,
                fieldName,
                relatedTypeName,
                args.fields,
                tableResource.Properties.KeySchema
            )

            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver);
            ctx.mapResourceToStack(relatedTypeName, ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName));
        } else {

            let keySchema : KeySchema[] = index ? index.KeySchema : tableResource.Properties.KeySchema;

            let queryResolver = makeQueryRelationResolver(
                parentTypeName,
                fieldName,
                relatedType,
                args.fields,
                keySchema,
                index ? index.IndexName : null
            )

            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver);
            ctx.mapResourceToStack(relatedTypeName, ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName));

            let sortKeyType = relatedType.fields.find(f => f.name.value === keySchema[1].AttributeName).type
            const sortKeyInfo = keySchema[1] ?
                                { fieldName : keySchema[1].AttributeName, typeName : getBaseType(sortKeyType)} :
                                undefined;
            this.extendTypeWithConnection(ctx, parent, field, relatedType, sortKeyInfo);
        }

    }


    private typeExist(type: string, ctx: TransformerContext): boolean {
        return Boolean(type in ctx.nodeMap);
    }

    private generateModelXConnectionType(ctx: TransformerContext, typeDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): void {
        const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(typeDef.name.value)
        if (this.typeExist(tableXConnectionName, ctx)) {
            return
        }

        // Create the ModelXConnection
        const connectionType = blankObject(tableXConnectionName)
        ctx.addObject(connectionType)

        ctx.addObjectExtension(makeModelConnectionType(typeDef.name.value))
    }

    private extendTypeWithConnection(
        ctx: TransformerContext,
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        returnType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        sortKeyInfo?: { fieldName: string, typeName: string }
    ) {
        this.generateModelXConnectionType(ctx, returnType)

        // Extensions are not allowed to redeclare fields so we must replace
        // it in place.
        const type = ctx.getType(parent.name.value) as ObjectTypeDefinitionNode
        if (
            type &&
            (type.kind === Kind.OBJECT_TYPE_DEFINITION || type.kind === Kind.INTERFACE_TYPE_DEFINITION)
        ) {
            // Find the field and replace it in place.
            const newFields = type.fields.map(
                (f: FieldDefinitionNode) => {
                    if (f.name.value === field.name.value) {
                        const updated = makeModelConnectionField(field.name.value, returnType.name.value, sortKeyInfo)
                        updated.directives = f.directives
                        return updated
                    }
                    return f;
                }
            )
            const updatedType = {
                ...type,
                fields: newFields
            }
            ctx.putType(updatedType)

            if (!this.typeExist('ModelSortDirection', ctx)) {
                const modelSortDirection = makeModelSortDirectionEnumObject()
                ctx.addEnum(modelSortDirection)
            }

            this.generateFilterAndKeyConditionInputs(ctx, returnType, sortKeyInfo)
        } else {
            throw new InvalidDirectiveError(`Could not find a object or interface type named ${parent.name.value}.`)
        }
    }

    private generateFilterAndKeyConditionInputs(
        ctx: TransformerContext, field: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        sortKeyInfo?: { fieldName: string, typeName: string }
    ): void {
        const scalarFilters = makeScalarFilterInputs()
        for (const filter of scalarFilters) {
            if (!this.typeExist(filter.name.value, ctx)) {
                ctx.addInput(filter)
            }
        }

        // Create the ModelXFilterInput
        const tableXQueryFilterInput = makeModelXFilterInputObject(field, ctx)
        if (!this.typeExist(tableXQueryFilterInput.name.value, ctx)) {
            ctx.addInput(tableXQueryFilterInput)
        }

        // Create sort key condition inputs for valid sort key types
        // We only create the KeyConditionInput if it is being used.
        if (sortKeyInfo) {
            const sortKeyConditionInput = makeScalarKeyConditionForType(makeNamedType(sortKeyInfo.typeName))
            if (!this.typeExist(sortKeyConditionInput.name.value, ctx)) {
                ctx.addInput(sortKeyConditionInput);
            }
        }
    }

}