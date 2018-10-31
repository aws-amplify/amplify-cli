import { Transformer, TransformerContext, InvalidDirectiveError } from 'graphql-transformer-core'
import Table from 'cloudform/types/dynamoDb/table'
import {
    DirectiveNode, ObjectTypeDefinitionNode,
    Kind, FieldDefinitionNode, InterfaceTypeDefinitionNode,
    InputObjectTypeDefinitionNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeModelConnectionType,
    makeModelConnectionField,
    makeScalarFilterInputs,
    makeModelXFilterInputObject,
    makeModelSortDirectionEnumObject,
} from 'graphql-dynamodb-transformer'
import {
    getBaseType, isListType, getDirectiveArgument, blankObject,
    isScalar, STANDARD_SCALARS,
    toCamelCase, isNonNullType
} from 'graphql-transformer-common'
import { ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common'
import { updateCreateInputWithConnectionField, updateUpdateInputWithConnectionField } from './definitions';

function makeConnectionAttributeName(type: string, field?: string) {
    return field ? toCamelCase([type, field, 'id']) : toCamelCase([type, 'id'])
}

function validateKeyField(field: FieldDefinitionNode): void {
    if (!field) {
        return
    }
    const baseType = getBaseType(field.type);
    const isAList = isListType(field.type)
    // The only valid key fields are single String and ID fields.
    if (
        (baseType === 'ID' || baseType === 'String') &&
        (!isAList)
    ) {
        return;
    }
    throw new InvalidDirectiveError(`If you define a field and specify it as a 'keyField', it must be of type 'ID' or 'String'.`)
}

/**
 * The @connection transform.
 *
 * This transform configures the GSIs and resolvers needed to implement
 * relationships at the GraphQL level.
 */
export class ModelConnectionTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'ModelConnectionTransformer',
            `directive @connection(name: String, keyField: String, sortField: String) on FIELD_DEFINITION`
        )
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources)
        ctx.mergeParameters(template.Parameters)
        ctx.mergeOutputs(template.Outputs)
    }

    /**
     * Create a 1-1, 1-M, or M-1 connection between two model types.
     * Throws an error if the related type is not an object type annotated with @model.
     */
    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const parentTypeName = parent.name.value;
        const fieldName = field.name.value;
        const parentModelDirective = parent.directives.find((dir: DirectiveNode) => dir.name.value === 'model')
        if (!parentModelDirective) {
            throw new InvalidDirectiveError(`@connection must be on an @model object type field.`)
        }

        const relatedTypeName = getBaseType(field.type)
        const relatedType = ctx.inputDocument.definitions.find(
            d => d.kind === Kind.OBJECT_TYPE_DEFINITION && d.name.value === relatedTypeName
        ) as ObjectTypeDefinitionNode | undefined
        if (!relatedType) {
            throw new InvalidDirectiveError(`Could not find an object type named ${relatedTypeName}.`)
        }
        const modelDirective = relatedType.directives.find((dir: DirectiveNode) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError(`Object type ${relatedTypeName} must be annotated with @model.`)
        }

        let connectionName = getDirectiveArgument(directive)("name")
        let associatedSortFieldName = null
        let sortType = null
        // Find the associated connection field if one exists.
        const associatedConnectionField = relatedType.fields.find(
            (f: FieldDefinitionNode) => {
                const relatedDirective = f.directives.find((dir: DirectiveNode) => dir.name.value === 'connection');
                if (relatedDirective) {
                    const relatedDirectiveName = getDirectiveArgument(relatedDirective)("name")
                    if (connectionName && relatedDirectiveName && relatedDirectiveName === connectionName) {
                        associatedSortFieldName = getDirectiveArgument(relatedDirective)('sortField')
                        return true
                    }
                }
                return false
            }
        )

        if (connectionName && !associatedConnectionField) {
            throw new InvalidDirectiveError(
                `Found one half of connection "${connectionName}" at ${parentTypeName}.${fieldName} but no related field on type ${relatedTypeName}`
            )
        }

        connectionName = connectionName || `${parentTypeName}.${fieldName}`
        const leftConnectionIsList = isListType(field.type)
        const leftConnectionIsNonNull = isNonNullType(field.type)
        const rightConnectionIsList = associatedConnectionField ? isListType(associatedConnectionField.type) : undefined
        const rightConnectionIsNonNull = associatedConnectionField ? isNonNullType(associatedConnectionField.type) : undefined

        let connectionAttributeName = getDirectiveArgument(directive)("keyField")
        const associatedSortField = associatedSortFieldName &&
            parent.fields.find((f: FieldDefinitionNode) => f.name.value === associatedSortFieldName)

        if (associatedSortField) {
            if (isListType(associatedSortField.type)) {
                throw new InvalidDirectiveError(
                    `sortField "${associatedSortFieldName}" is a list. It should be a scalar.`
                )
            }
            sortType = getBaseType(associatedSortField.type)
            if (!isScalar(associatedSortField.type) || sortType === STANDARD_SCALARS.Boolean) {
                throw new InvalidDirectiveError(
                    `sortField "${associatedSortFieldName}" is of type "${sortType}". ` +
                    `It should be a scalar that maps to a DynamoDB "String", "Number", or "Binary"`
                )
            }
        }

        // Relationship Cardinalities:
        // 1. [] to []
        // 2. [] to {}
        // 3. {} to []
        // 4. [] to ?
        // 5. {} to ?
        if (leftConnectionIsList && rightConnectionIsList) {
            // 1. TODO.
            // Use an intermediary table or other strategy like embedded string sets for many to many.
            throw new InvalidDirectiveError(`Many to Many connections are not yet supported.`)
        } else if (leftConnectionIsList && rightConnectionIsList === false) {
            // 2. [] to {} when the association exists. Note: false and undefined are not equal.
            // Store a foreign key on the related table and wire up a Query resolver.
            // This is the inverse of 3.
            if (!connectionAttributeName) {
                connectionAttributeName = makeConnectionAttributeName(relatedTypeName, associatedConnectionField.name.value)
            }
            // Validate the provided key field is legit.
            const existingKeyField = relatedType.fields.find(f => f.name.value === connectionAttributeName)
            validateKeyField(existingKeyField);

            const queryResolver = this.resources.makeQueryConnectionResolver(
                parentTypeName,
                fieldName,
                relatedTypeName,
                connectionAttributeName,
                connectionName
            )
            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver)

            this.extendTypeWithConnection(ctx, parent, field, relatedType)
        } else if (!leftConnectionIsList && rightConnectionIsList) {
            // 3. {} to [] when the association exists.
            // Store foreign key on this table and wire up a GetItem resolver.
            // This is the inverse of 2.

            // if the sortField is not defined as a field, throw an error
            // Cannot assume the required type of the field
            if (associatedSortFieldName && !associatedSortField) {
                throw new InvalidDirectiveError(
                    `sortField "${associatedSortFieldName}" not found on type "${parent.name.value}", other half of connection "${connectionName}".`
                )
            }

            if (!connectionAttributeName) {
                connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName)
            }
            // Validate the provided key field is legit.
            const existingKeyField = parent.fields.find(f => f.name.value === connectionAttributeName)
            validateKeyField(existingKeyField);

            const tableLogicalId = ModelResourceIDs.ModelTableResourceID(parentTypeName)
            const table = ctx.getResource(tableLogicalId) as Table
            const sortField = associatedSortField ? { name: associatedSortFieldName, type: sortType } : null
            const updated = this.resources.updateTableForConnection(table, connectionName, connectionAttributeName,
                sortField)
            ctx.setResource(tableLogicalId, updated)

            const getResolver = this.resources.makeGetItemConnectionResolver(
                parentTypeName,
                fieldName,
                relatedTypeName,
                connectionAttributeName
            )
            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver)

            // Update the create & update input objects for this
            const createInputName = ModelResourceIDs.ModelCreateInputObjectName(parentTypeName)
            const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode
            if (createInput) {
                const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, leftConnectionIsNonNull)
                ctx.putType(updated)
            }
            const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(parentTypeName)
            const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode
            if (updateInput) {
                const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName)
                ctx.putType(updated)
            }

        } else if (leftConnectionIsList) {
            // 4. [] to ?
            // Store foreign key on the related table and wire up a Query resolver.
            // This has no inverse and has limited knowlege of the connection.
            if (!connectionAttributeName) {
                connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName)
            }

            // Validate the provided key field is legit.
            const existingKeyField = relatedType.fields.find(f => f.name.value === connectionAttributeName)
            validateKeyField(existingKeyField);

            const tableLogicalId = ModelResourceIDs.ModelTableResourceID(relatedTypeName)
            const table = ctx.getResource(tableLogicalId) as Table
            const updated = this.resources.updateTableForConnection(table, connectionName, connectionAttributeName)
            ctx.setResource(tableLogicalId, updated)

            const queryResolver = this.resources.makeQueryConnectionResolver(
                parentTypeName,
                fieldName,
                relatedTypeName,
                connectionAttributeName,
                connectionName
            )
            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), queryResolver)

            this.extendTypeWithConnection(ctx, parent, field, relatedType)

            // Update the create & update input objects for the related type
            const createInputName = ModelResourceIDs.ModelCreateInputObjectName(relatedTypeName)
            const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode
            if (createInput) {
                const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName)
                ctx.putType(updated)
            }
            const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(relatedTypeName)
            const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode
            if (updateInput) {
                const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName)
                ctx.putType(updated)
            }
        } else {
            // 5. {} to ?
            // Store foreign key on this table and wire up a GetItem resolver.
            // This has no inverse and has limited knowlege of the connection.
            if (!connectionAttributeName) {
                connectionAttributeName = makeConnectionAttributeName(parentTypeName, fieldName)
            }

            // Validate the provided key field is legit.
            const existingKeyField = parent.fields.find(f => f.name.value === connectionAttributeName)
            validateKeyField(existingKeyField);

            const getResolver = this.resources.makeGetItemConnectionResolver(
                parentTypeName,
                fieldName,
                relatedTypeName,
                connectionAttributeName
            )
            ctx.setResource(ResolverResourceIDs.ResolverResourceID(parentTypeName, fieldName), getResolver)

            // Update the create & update input objects for this type
            const createInputName = ModelResourceIDs.ModelCreateInputObjectName(parentTypeName)
            const createInput = ctx.getType(createInputName) as InputObjectTypeDefinitionNode
            if (createInput) {
                const updated = updateCreateInputWithConnectionField(createInput, connectionAttributeName, leftConnectionIsNonNull)
                ctx.putType(updated)
            }
            const updateInputName = ModelResourceIDs.ModelUpdateInputObjectName(parentTypeName)
            const updateInput = ctx.getType(updateInputName) as InputObjectTypeDefinitionNode
            if (updateInput) {
                const updated = updateUpdateInputWithConnectionField(updateInput, connectionAttributeName)
                ctx.putType(updated)
            }
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
        returnType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode
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
                        const updated = makeModelConnectionField(field.name.value, returnType.name.value)
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

            this.generateFilterInputs(ctx, returnType)
        } else {
            throw new InvalidDirectiveError(`Could not find a object or interface type named ${parent.name.value}.`)
        }
    }

    private generateFilterInputs(ctx: TransformerContext, field: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): void {
        const scalarFilters = makeScalarFilterInputs()
        for (const filter of scalarFilters) {
            if (!this.typeExist(filter.name.value, ctx)) {
                ctx.addInput(filter)
            }
        }

        // Create the ModelXFilterInput
        const tableXQueryFilterInput = makeModelXFilterInputObject(field)
        if (!this.typeExist(tableXQueryFilterInput.name.value, ctx)) {
            ctx.addInput(tableXQueryFilterInput)
        }
    }
}
