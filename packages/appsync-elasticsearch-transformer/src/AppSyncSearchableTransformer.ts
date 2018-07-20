import { Transformer, TransformerContext } from "graphql-transform";
import {
    DirectiveNode,
    ObjectTypeDefinitionNode
} from "graphql";
import { ResourceFactory } from "./resources";
import { makeSearchableScalarInputObject, makeSearchableXFilterInputObject } from "./definitions";
import {
    makeNamedType,
    blankObjectExtension,
    makeField,
    extensionWithFields,
    blankObject,
    makeListType,
    makeArg,
    makeNonNullType
} from "appsync-transformer-common";

/**
 * Handles the @searchable directive on OBJECT types.
 */
export class AppSyncSearchableTransformer extends Transformer {
    resources: ResourceFactory;

    constructor() {
        super(
            `AppSyncSearchableTransformer`,
            `directive @searchable on OBJECT`);
        this.resources = new ResourceFactory();
    }

    public before = (ctx: TransformerContext): void => {
        const template = this.resources.initTemplate();
        ctx.mergeResources(template.Resources);
        ctx.mergeParameters(template.Parameters);
        ctx.mergeOutputs(template.Outputs);
    };

    /**
     * Given the initial input and context manipulate the context to handle this object directive.
     * @param initial The input passed to the transform.
     * @param ctx The accumulated context for the transform.
     */
    public object = (
        def: ObjectTypeDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        this.generateSearchableInputs(ctx, def)
        this.generateSearchableXConnectionType(ctx, def)

        let queryType = blankObjectExtension('Query')

        // Create getX
        const getResolver = this.resources.makeGetResolver(def.name.value)
        ctx.setResource(`Get${def.name.value}Resolver`, getResolver)
        queryType = extensionWithFields(
            queryType,
            [
                makeField(
                    getResolver.Properties.FieldName,
                    [
                        makeArg('id', makeNonNullType(makeNamedType('ID')))
                    ],
                    makeNamedType(def.name.value)
                )
            ]
        )

        // Create listX
        const searchResolver = this.resources.makeSearchResolver(def.name.value)
        ctx.setResource(`Search${def.name.value}Resolver`, searchResolver)
        queryType = extensionWithFields(
            queryType,
            [
                makeField(
                    searchResolver.Properties.FieldName,
                    [
                        makeArg('filter', makeNamedType(`Searchable${def.name.value}FilterInput`)),
                        makeArg('limit', makeNamedType('Int')),
                        makeArg('nextToken', makeNamedType('String'))
                    ],
                    makeNamedType(`Searchable${def.name.value}Connection`)
                )
            ]
        )

        ctx.addObjectExtension(queryType)
    };

    private generateSearchableXConnectionType(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {
        const searchableXConnectionName = `Searchable${def.name.value}Connection`
        if (this.typeExist(searchableXConnectionName, ctx)) {
            return
        }

        // Create the TableXConnection
        const connectionType = blankObject(searchableXConnectionName)
        ctx.addObject(connectionType)

        // Create TableXConnection type with items and nextToken
        let connectionTypeExtension = blankObjectExtension(searchableXConnectionName)
        connectionTypeExtension = extensionWithFields(
            connectionTypeExtension,
            [makeField(
                'items',
                [],
                makeListType(makeNamedType(def.name.value))
            )]
        )
        connectionTypeExtension = extensionWithFields(
            connectionTypeExtension,
            [makeField(
                'nextToken',
                [],
                makeNamedType('String')
            )]
        )
        ctx.addObjectExtension(connectionTypeExtension)
    }

    private typeExist(type: string, ctx: TransformerContext): boolean {
        return Boolean(type in ctx.nodeMap);
    }

    private generateSearchableInputs(ctx: TransformerContext, def: ObjectTypeDefinitionNode): void {

        // Create the Scalar filter inputs
        if (!this.typeExist('SearchableStringFilterInput', ctx)) {
            const searchableStringFilterInput = makeSearchableScalarInputObject('String')
            ctx.addInput(searchableStringFilterInput)
        }

        if (!this.typeExist('SearchableIDFilterInput', ctx)) {
            const searchableIDFilterInput = makeSearchableScalarInputObject('ID')
            ctx.addInput(searchableIDFilterInput)
        }

        if (!this.typeExist('SearchableIntFilterInput', ctx)) {
            const searchableIntFilterInput = makeSearchableScalarInputObject('Int')
            ctx.addInput(searchableIntFilterInput)
        }

        if (!this.typeExist('SearchableFloatFilterInput', ctx)) {
            const searchableFloatFilterInput = makeSearchableScalarInputObject('Float')
            ctx.addInput(searchableFloatFilterInput)
        }

        if (!this.typeExist('SearchableBooleanFilterInput', ctx)) {
            const searchableBooleanFilterInput = makeSearchableScalarInputObject('Boolean')
            ctx.addInput(searchableBooleanFilterInput)
        }

        // Create the SearchableXFilterInput
        if (!this.typeExist(`Searchable${def.name.value}FilterInput`, ctx)) {
            const searchableXQueryFilterInput = makeSearchableXFilterInputObject(def)
            ctx.addInput(searchableXQueryFilterInput)
        }
    }
}
