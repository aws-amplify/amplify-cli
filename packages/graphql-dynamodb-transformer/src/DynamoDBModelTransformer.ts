import { Transformer, TransformerContext, TransformerContractError } from 'graphql-transformer-core'
import {
    DirectiveNode, ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode, print
} from 'graphql'
import { ResourceFactory } from './resources'
import {
    makeCreateInputObject, makeUpdateInputObject, makeDeleteInputObject,
    makeModelScalarFilterInputObject, makeModelXFilterInputObject, makeModelSortDirectionEnumObject,
    makeModelConnectionType, makeModelConnectionField,
    makeScalarFilterInputs, makeModelScanField, makeSubscriptionField, getNonModelObjectArray, makeNonModelInputObject
} from './definitions'
import {
    blankObject, makeField, makeInputValueDefinition, makeNamedType,
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

interface SubscriptionNameMap {
    onCreate?: string[];
    onUpdate?: string[];
    onDelete?: string[];
}

interface ModelDirectiveArgs {
    queries?: QueryNameMap,
    mutations?: MutationNameMap,
    subscriptions?: SubscriptionNameMap
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
                mutations: ModelMutationMap,
                subscriptions: ModelSubscriptionMap
            ) on OBJECT
            input ModelMutationMap { create: String, update: String, delete: String }
            input ModelQueryMap { get: String, list: String }
            input ModelSubscriptionMap {
                onCreate: [String]
                onUpdate: [String]
                onDelete: [String]
            }
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
        // ctx.addObject(def)

        let nonModelArray: ObjectTypeDefinitionNode[] = getNonModelObjectArray(
            def,
            ctx,
            new Map<string, ObjectTypeDefinitionNode>()
        )

        nonModelArray.forEach(
            (value: ObjectTypeDefinitionNode) => {
                let nonModelObject = makeNonModelInputObject(value, nonModelArray, ctx)
                if (!this.typeExist(nonModelObject.name.value, ctx)) {
                    ctx.addInput(nonModelObject)
                }
            }
        )

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

        this.createQueries(def, directive, ctx)
        this.createMutations(def, directive, ctx, nonModelArray)
        this.createSubscriptions(def, directive, ctx)
    }

    private createMutations = (
        def: ObjectTypeDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext,
        nonModelArray: ObjectTypeDefinitionNode[]
    ) => {
        const typeName = def.name.value
        // Create the input types.
        const createInput = makeCreateInputObject(def, nonModelArray, ctx)
        const updateInput = makeUpdateInputObject(def, nonModelArray, ctx)
        const deleteInput = makeDeleteInputObject(def)
        ctx.addInput(createInput)
        ctx.addInput(updateInput)
        ctx.addInput(deleteInput)

        const mutationFields = [];
        // Get any name overrides provided by the user. If an empty map it provided
        // then we do not generate those fields.
        const directiveArguments: ModelDirectiveArgs = super.getDirectiveArgumentMap(directive)

        // Configure mutations based on *mutations* argument
        let shouldMakeCreate = true;
        let shouldMakeUpdate = true;
        let shouldMakeDelete = true;
        let createFieldNameOverride = undefined;
        let updateFieldNameOverride = undefined;
        let deleteFieldNameOverride = undefined;


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

        // Create the mutations.
        if (shouldMakeCreate) {
            const createResolver = this.resources.makeCreateResolver(def.name.value, createFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName), createResolver)
            mutationFields.push(makeField(
                createResolver.Properties.FieldName,
                [makeInputValueDefinition('input', makeNonNullType(makeNamedType(createInput.name.value)))],
                makeNamedType(def.name.value)
            ));
        }

        if (shouldMakeUpdate) {
            const updateResolver = this.resources.makeUpdateResolver(def.name.value, updateFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName), updateResolver)
            mutationFields.push(makeField(
                updateResolver.Properties.FieldName,
                [makeInputValueDefinition('input', makeNonNullType(makeNamedType(updateInput.name.value)))],
                makeNamedType(def.name.value)
            ));
        }

        if (shouldMakeDelete) {
            const deleteResolver = this.resources.makeDeleteResolver(def.name.value, deleteFieldNameOverride)
            ctx.setResource(ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName), deleteResolver)
            mutationFields.push(makeField(
                deleteResolver.Properties.FieldName,
                [makeInputValueDefinition('input', makeNonNullType(makeNamedType(deleteInput.name.value)))],
                makeNamedType(def.name.value)
            ));
        }
        ctx.addMutationFields(mutationFields)
    }

    private createQueries = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const typeName = def.name.value
        const queryFields = []
        const directiveArguments: ModelDirectiveArgs = this.getDirectiveArgumentMap(directive)

        // Configure queries based on *queries* argument
        let shouldMakeGet = true;
        let shouldMakeList = true;
        let getFieldNameOverride = undefined;
        let listFieldNameOverride = undefined;

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
            if (!directiveArguments.queries.list) {
                shouldMakeList = false;
            } else {
                listFieldNameOverride = directiveArguments.queries.list
            }
        }

        if (shouldMakeList) {
            if (!this.typeExist('ModelSortDirection', ctx)) {
                const tableSortDirection = makeModelSortDirectionEnumObject()
                ctx.addEnum(tableSortDirection)
            }
        }

        // Create get queries
        if (shouldMakeGet) {
            const getResolver = this.resources.makeGetResolver(def.name.value, getFieldNameOverride, ctx.getQueryTypeName())
            ctx.setResource(ResolverResourceIDs.DynamoDBGetResolverResourceID(typeName), getResolver)

            queryFields.push(makeField(
                getResolver.Properties.FieldName,
                [makeInputValueDefinition('id', makeNonNullType(makeNamedType('ID')))],
                makeNamedType(def.name.value)
            ))
        }

        if (shouldMakeList) {

            this.generateModelXConnectionType(ctx, def)

            // Create the list resolver
            const listResolver = this.resources.makeListResolver(def.name.value, listFieldNameOverride, ctx.getQueryTypeName())
            ctx.setResource(ResolverResourceIDs.DynamoDBListResolverResourceID(typeName), listResolver)

            this.generateFilterInputs(ctx, def)

            queryFields.push(makeModelScanField(listResolver.Properties.FieldName, def.name.value))
        }

        ctx.addQueryFields(queryFields)
    }

    /**
     * Creates subscriptions for a @model object type. By default creates a subscription for
     * create, update, and delete mutations.
     *
     * Subscriptions are one to many in that a subscription may subscribe to multiple mutations.
     * You may thus provide multiple names of the subscriptions that will be triggered by each
     * mutation.
     *
     * type Post @model(subscriptions: { onCreate: ["onPostCreated", "onFeedUpdated"] }) {
     *      id: ID!
     *      title: String!
     * }
     *
     * will create two subscription fields:
     *
     * type Subscription {
     *      onPostCreated: Post @aws_subscribe(mutations: ["createPost"])
     *      onFeedUpdated: Post @aws_subscribe(mutations: ["createPost"])
     * }
     */
    private createSubscriptions = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const typeName = def.name.value
        const subscriptionFields = []

        const directiveArguments: ModelDirectiveArgs = this.getDirectiveArgumentMap(directive)

        const subscriptionsArgument = directiveArguments.subscriptions
        const createResolver = ctx.getResource(ResolverResourceIDs.DynamoDBCreateResolverResourceID(typeName))
        const updateResolver = ctx.getResource(ResolverResourceIDs.DynamoDBUpdateResolverResourceID(typeName))
        const deleteResolver = ctx.getResource(ResolverResourceIDs.DynamoDBDeleteResolverResourceID(typeName))
        if (subscriptionsArgument === null) {
            return;
        } else if (subscriptionsArgument) {
            // Add the custom subscriptions
            const subscriptionToMutationsMap: { [subField: string]: string[] } = {}
            const onCreate = subscriptionsArgument.onCreate || []
            const onUpdate = subscriptionsArgument.onUpdate || []
            const onDelete = subscriptionsArgument.onDelete || []
            const subFields = [...onCreate, ...onUpdate, ...onDelete]
            // initialize the reverse lookup
            for (const field of subFields) {
                subscriptionToMutationsMap[field] = []
            }
            // Add the correct mutation to the lookup
            for (const field of Object.keys(subscriptionToMutationsMap)) {
                if (onCreate.includes(field) && createResolver) {
                    subscriptionToMutationsMap[field].push(createResolver.Properties.FieldName)
                }
                if (onUpdate.includes(field) && updateResolver) {
                    subscriptionToMutationsMap[field].push(updateResolver.Properties.FieldName)
                }
                if (onDelete.includes(field) && deleteResolver) {
                    subscriptionToMutationsMap[field].push(deleteResolver.Properties.FieldName)
                }
            }
            for (const subFieldName of Object.keys(subscriptionToMutationsMap)) {
                const subField = makeSubscriptionField(
                    subFieldName,
                    typeName,
                    subscriptionToMutationsMap[subFieldName]
                )
                subscriptionFields.push(subField)
            }
        } else {
            // Add the default subscriptions
            if (createResolver) {
                const onCreateField = makeSubscriptionField(
                    ModelResourceIDs.ModelOnCreateSubscriptionName(typeName),
                    typeName,
                    [createResolver.Properties.FieldName]
                )
                subscriptionFields.push(onCreateField)
            }
            if (updateResolver) {
                const onUpdateField = makeSubscriptionField(
                    ModelResourceIDs.ModelOnUpdateSubscriptionName(typeName),
                    typeName,
                    [updateResolver.Properties.FieldName]
                )
                subscriptionFields.push(onUpdateField)
            }
            if (deleteResolver) {
                const onDeleteField = makeSubscriptionField(
                    ModelResourceIDs.ModelOnDeleteSubscriptionName(typeName),
                    typeName,
                    [deleteResolver.Properties.FieldName]
                )
                subscriptionFields.push(onDeleteField)
            }
        }

        ctx.addSubscriptionFields(subscriptionFields)
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
