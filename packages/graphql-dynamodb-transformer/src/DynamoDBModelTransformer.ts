import { Transformer, TransformerContext } from 'graphql-transformer-core'
import {
    DirectiveNode, ObjectTypeDefinitionNode
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeCreateInputObject, makeUpdateInputObject, makeDeleteInputObject,
    makeModelScalarFilterInputObject, makeModelXFilterInputObject, makeModelSortDirectionEnumObject,
    makeModelConnectionType, makeModelConnectionField,
    makeScalarFilterInputs, makeModelScanField
} from './definitions'
import {
    blankObject, makeField, makeArg, makeNamedType,
    makeNonNullType, makeSchema, makeOperationType, blankObjectExtension,
    extensionWithFields, ResourceConstants, makeListType
} from 'graphql-transformer-common'
import { ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common'

interface QueryNameMap {
    get?: string;
    list?: string;
    query?: string;
}

interface MutationNameMap {
    create?: string;
    update?: string;
    delete?: string;
}

interface ModelDirectiveArgs {
    queries?: QueryNameMap,
    mutations?: MutationNameMap
}

/**
 * The simple transform.
 *
 * This transform creates a single DynamoDB table for all of your application's
 * data. It uses a standard key structure and nested map to store object values.
 * A relationKey field
 *
 * {
 *  type (HASH),
 *  id (SORT),
 *  value (MAP),
 *  createdAt, (LSI w/ type)
 *  updatedAt (LSI w/ type)
 * }
 */
export class DynamoDBModelTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'DynamoDBModelTransformer',
            `
            directive @model(
                queries: ModelQueryMap,
                mutations: ModelMutationMap
            ) on OBJECT
            input ModelMutationMap { create: String, update: String, delete: String }
            input ModelQueryMap { get: String, list: String }
            `
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
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        // Create the object type.
        ctx.addObject(def)

        // Create the dynamodb table to hold the @model type
        // TODO: Handle types with more than a single "id" hash key
        const typeName = def.name.value
        const tableLogicalID = ModelResourceIDs.ModelTableResourceID(typeName)
        const iamRoleLogicalID = ModelResourceIDs.ModelTableIAMRoleID(typeName)
        ctx.setResource(
            tableLogicalID,
            this.resources.makeModelTable(typeName)
        )
        ctx.setResource(
            iamRoleLogicalID,
            this.resources.makeIAMRole(tableLogicalID)
        )
        ctx.setResource(
            ModelResourceIDs.ModelTableDataSourceID(typeName),
            this.resources.makeDynamoDBDataSource(tableLogicalID, iamRoleLogicalID)
        )

        // Create the input types.
        const createInput = makeCreateInputObject(def)
        const updateInput = makeUpdateInputObject(def)
        const deleteInput = makeDeleteInputObject(def)
        ctx.addInput(createInput)
        ctx.addInput(updateInput)
        ctx.addInput(deleteInput)

        // Create the mutation & query extension
        let mutationType = blankObjectExtension('Mutation')
        let queryType = blankObjectExtension('Query')

        // Get any name overrides provided by the user. If an empty map it provided
        // then we do not generate those fields.
        const directiveArguments: ModelDirectiveArgs = super.getDirectiveArgumentMap(directive)

        let shouldMakeCreate = true;
        let shouldMakeUpdate = true;
        let shouldMakeDelete = true;
        let shouldMakeGet = true;
        // TODO: Re-enable this if needed but its redundant as of now.
        let shouldMakeQuery = false;
        let shouldMakeList = true;
        let createFieldNameOverride = undefined;
        let updateFieldNameOverride = undefined;
        let deleteFieldNameOverride = undefined;
        let getFieldNameOverride = undefined;
        let listFieldNameOverride = undefined;
        let queryFieldNameOverride = undefined;

        // Figure out which queries to make and if they have name overrides.
        // If queries is undefined (default), create all queries
        // If queries is explicetly set to null, do not create any
        // else if queries is defined, check overrides
        if (directiveArguments.queries === null) {
            shouldMakeGet = false;
            shouldMakeList = false;
        } else if (directiveArguments.queries) {
            if (!directiveArguments.queries.get) {
                shouldMakeGet = false;
            } else {
                getFieldNameOverride = directiveArguments.queries.get
            }
            if (!directiveArguments.queries.query) {
                shouldMakeQuery = false;
            } else {
                queryFieldNameOverride = directiveArguments.queries.query
            }
            if (!directiveArguments.queries.list) {
                shouldMakeList = false;
            } else {
                listFieldNameOverride = directiveArguments.queries.list
            }
        }

        // Figure out which mutations to make and if they have name overrides
        if (directiveArguments.mutations === null) {
            shouldMakeCreate = false
            shouldMakeUpdate = false
            shouldMakeDelete = false
        } else if (directiveArguments.mutations) {
            if (!directiveArguments.mutations.create) {
                shouldMakeCreate = false;
            } else {
                createFieldNameOverride = directiveArguments.mutations.create
            }
            if (!directiveArguments.mutations.update) {
                shouldMakeUpdate = false;
            } else {
                updateFieldNameOverride = directiveArguments.mutations.update
            }
            if (!directiveArguments.mutations.delete) {
                shouldMakeDelete = false;
            } else {
                deleteFieldNameOverride = directiveArguments.mutations.delete
            }
        }

        const queryNameMap: QueryNameMap = directiveArguments.queries
        const mutationNameMap: MutationNameMap = directiveArguments.mutations

        // Create the mutations.
        if (shouldMakeCreate) {
            const createResolver = this.resources.makeCreateResolver(def.name.value, createFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName), createResolver)
            mutationType = extensionWithFields(
                mutationType,
                [makeField(
                    createResolver.Properties.FieldName,
                    [makeArg('input', makeNonNullType(makeNamedType(createInput.name.value)))],
                    makeNamedType(def.name.value)
                )]
            )
        }

        if (shouldMakeUpdate) {
            const updateResolver = this.resources.makeUpdateResolver(def.name.value, updateFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName), updateResolver)
            mutationType = extensionWithFields(
                mutationType,
                [makeField(
                    updateResolver.Properties.FieldName,
                    [makeArg('input', makeNonNullType(makeNamedType(updateInput.name.value)))],
                    makeNamedType(def.name.value)
                )]
            )
        }

        if (shouldMakeDelete) {
            const deleteResolver = this.resources.makeDeleteResolver(def.name.value, deleteFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName), deleteResolver)
            mutationType = extensionWithFields(
                mutationType,
                [makeField(
                    deleteResolver.Properties.FieldName,
                    [makeArg('input', makeNonNullType(makeNamedType(deleteInput.name.value)))],
                    makeNamedType(def.name.value)
                )]
            )
        }
        ctx.addObjectExtension(mutationType)

        if (shouldMakeQuery || shouldMakeList) {
            if (!this.typeExist('ModelSortDirection', ctx)) {
                const tableSortDirection = makeModelSortDirectionEnumObject()
                ctx.addEnum(tableSortDirection)
            }
        }

        // Create query queries
        if (shouldMakeQuery) {
            this.generateModelXConnectionType(ctx, def)

            const queryResolver = this.resources.makeQueryResolver(def.name.value, queryFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBQueryResolverResourceID(typeName), queryResolver)

            queryType = extensionWithFields(
                queryType,
                [makeModelConnectionField(queryResolver.Properties.FieldName, def.name.value)]
            )

            this.generateFilterInputs(ctx, def)
        }

        // Create get queries
        if (shouldMakeGet) {
            const getResolver = this.resources.makeGetResolver(def.name.value, getFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName), getResolver)

            queryType = extensionWithFields(
                queryType,
                [makeField(
                    getResolver.Properties.FieldName,
                    [makeArg('id', makeNonNullType(makeNamedType('ID')))],
                    makeNamedType(def.name.value)
                )]
            )
        }

        if (shouldMakeList) {

            this.generateModelXConnectionType(ctx, def)

            // Create the list resolver
            const listResolver = this.resources.makeListResolver(def.name.value, listFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBListResolverResourceID(typeName), listResolver)

            this.generateFilterInputs(ctx, def)

            // Extend the query type to include listX
            queryType = extensionWithFields(
                queryType,
                [makeModelScanField(listResolver.Properties.FieldName, def.name.value)]
            )
        }

        ctx.addObjectExtension(queryType)
    }

    private typeExist(type: string, ctx: TransformerContext): boolean {
        return Boolean(type in ctx.nodeMap);
    }

    private generateModelXConnectionType(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
        const tableXConnectionName = ModelResourceIDs.ModelConnectionTypeName(def.name.value)
        if (this.typeExist(tableXConnectionName, ctx)) {
            return
        }

        // Create the ModelXConnection
        const connectionType = blankObject(tableXConnectionName)
        ctx.addObject(connectionType)

        ctx.addObjectExtension(makeModelConnectionType(def.name.value))
    }

    private generateFilterInputs(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
        const scalarFilters = makeScalarFilterInputs()
        for (const filter of scalarFilters) {
            if (!this.typeExist(filter.name.value, ctx)) {
                ctx.addInput(filter)
            }
        }

        // Create the ModelXFilterInput
        const tableXQueryFilterInput = makeModelXFilterInputObject(def)
        if (!this.typeExist(tableXQueryFilterInput.name.value, ctx)) {
            ctx.addInput(tableXQueryFilterInput)
        }
    }
}
