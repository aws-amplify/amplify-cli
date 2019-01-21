import { Transformer, TransformerContext, InvalidDirectiveError } from "graphql-transformer-core";
import {
    ObjectTypeDefinitionNode,
    DirectiveNode,
} from "graphql";
import { ResourceFactory } from './resources'
import {
    ResolverResourceIDs,
    makeNamedType,
    makeField,
    ModelResourceIDs
} from "graphql-transformer-common";
import Table from "cloudform/types/glue/table";

interface ViewerDirectiveArgs {
    // Name of the viewer field appearing in the Query
    viewerField?: string,
    // Field to use for searching on the model
    modelField?: string,
    // Field to use in the $ctx.identity obj for searching (eg: sub or username)
    identityField?: string,
}

export class ViewerTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'ViewerTransformer',
            'directive @viewer(viewerField: String = "viewer") on OBJECT'
        )
        this.resources = new ResourceFactory();
    }

    /**
     * When a type is annotated with @viewer it appends to the query as a viewer.
     *
     * Usage:
     *
     * type User @model @viewer(viewerField: "viewer", modelField: "email", identityField: "username") {
     *   id: ID!
     *   name: String
     * }
     * 
     * type Query {
     *   viewer: User
     * }
     *
     * Enabling viewer queries
     * 
     */
    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        // @viewer may only be used on types that are also @model
        const modelDirective = def.directives.find((dir) => dir.name.value === 'model')
        if (!modelDirective) {
            throw new InvalidDirectiveError('Types annotated with @viewer must also be annotated with @model.')
        }

        this.createViewerQuery(def, directive, ctx)
    }

    private createViewerQuery = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext) => {
        const typeName = def.name.value
        const queryFields = []
        const directiveArguments: ViewerDirectiveArgs = this.getDirectiveArgumentMap(directive)

        const viewerField = directiveArguments.viewerField || "viewer";
        const modelField = directiveArguments.modelField || "email";
        const identityField = directiveArguments.identityField || "username";

        const viewerResolver = this.resources.makeViewerResolver(typeName, viewerField,
            modelField,
            identityField,
            ctx.getQueryTypeName())
        // Create the index

        const tableLogicalId = ModelResourceIDs.ModelTableResourceID(typeName)
        const table = ctx.getResource(tableLogicalId) as Table
        const updated = this.resources.updateTableForConnection(table, viewerField, modelField, null)

        ctx.setResource(tableLogicalId, updated)
        ctx.setResource("ViewerResolver", viewerResolver)
        queryFields.push(makeField(
            viewerField,
            [],
            makeNamedType(def.name.value)
        ))
        ctx.addQueryFields(queryFields)
    }
}
