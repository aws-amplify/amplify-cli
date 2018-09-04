import { Transformer, TransformerContext } from 'graphql-transformer-core'
import { DirectiveNode, ObjectTypeDefinitionNode, NamedTypeNode, InterfaceTypeDefinitionNode, FieldDefinitionNode } from 'graphql'
import { ResourceFactory } from './resources'
import { blankObjectExtension, extensionWithFields, ResolverResourceIDs, toUpper, getDirectiveArgument } from 'graphql-transformer-common'
import Resource from "cloudform/types/resource";

/**
 * custom transformer includes files from custom/resolvers folder
 */
export class CustomTransformer extends Transformer {

    resources: ResourceFactory
    blanks: { [key: string]: any } = {
        Mutation: blankObjectExtension('Mutation'),
        Query: blankObjectExtension('Query'),
        Subscription: blankObjectExtension('Subscription')
    }

    constructor() {
        super(
            'CustomTransformer',
            `directive @custom(name: String) on OBJECT | FIELD_DEFINITION`
        )
        this.resources = new ResourceFactory();
    }

    public after = (ctx: TransformerContext): void => {
        ctx.addObjectExtension(this.blanks.Mutation)
        ctx.addObjectExtension(this.blanks.Query)
        this.linkResolversToFilePath(ctx);
    }

    private linkResolversToFilePath(ctx: TransformerContext): void {

        const templateResources: { [key: string]: Resource } = ctx.template.Resources

        for (const resourceName of Object.keys(templateResources)) {
            const resource: Resource = templateResources[resourceName]
            if (resource.Type === 'AWS::AppSync::Resolver' && resource.Properties.RequestMappingTemplateS3Location) {
                this.updateParameters(resourceName, ctx)
            }
        }
    }

    private updateParameters(resourceName: string, ctx: TransformerContext): void {
        const resolverResource = ctx.template.Resources[resourceName]

        const reqFileName = resolverResource.Properties.RequestMappingTemplateS3Location
        const respFileName = resolverResource.Properties.ResponseMappingTemplateS3Location
        if (reqFileName && respFileName) {
            const reqTypeName = resolverResource.Properties.TypeName
            const reqFieldName = resolverResource.Properties.FieldName
            const reqFileName = `${reqTypeName}.${reqFieldName}.request`
            const reqParam = this.resources.makeResolverParam(reqFileName);
            ctx.mergeParameters(reqParam.Parameters);

            const respTypeName = resolverResource.Properties.TypeName
            const respFieldName = resolverResource.Properties.FieldName
            const respFileName = `${respTypeName}.${respFieldName}.response`
            const respParam = this.resources.makeResolverParam(respFileName);
            ctx.mergeParameters(respParam.Parameters);
        }
    }

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const defName = parent.name.value
        const fieldName = field.name.value
        let typeName = getDirectiveArgument(directive)('name');
        let typeNode = field.type
        while (!typeName) {
            if (typeNode.kind === 'NamedType') {
                typeName = (typeNode as NamedTypeNode).name.value
            } else {
                typeNode = typeNode.type
            }
        }
        const resolver = this.resources.makeCustomResolverWithS3(defName, fieldName, typeName)
        ctx.setResource(ResolverResourceIDs.ResolverResourceID(defName, toUpper(fieldName)), resolver)

        if (defName === 'Mutation') {
            this.blanks.Mutation = extensionWithFields(this.blanks.Mutation, [field])
        } else if (defName === 'Query') {
            this.blanks.Query = extensionWithFields(this.blanks.Query, [field])
        }
    }

    public object = (def: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerContext): void => {
        //no work
    }
}
