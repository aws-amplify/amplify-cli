import { Transformer, TransformerContext, InvalidDirectiveError } from "graphql-transformer-core"
import { Kind, FieldDefinitionNode, ObjectTypeDefinitionNode, DirectiveNode, InterfaceTypeDefinitionNode } from "graphql";
import { getDirectiveArgument, ResolverResourceIDs } from 'graphql-transformer-common'
import { ResourceFactory } from './resources'
import { toUpper, toCamelCase } from 'graphql-transformer-common'

// const LAMBDA_STACK_NAME = 'LambdaStack'

export class FunctionTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'FunctionTransformer',
            'directive @function(name: String!, region: String) on FIELD_DEFINITION'
        )
        this.resources = new ResourceFactory();
    }

    // TODO: should be under graphql-transformer-common for consistency 
    private lambdaDataSourceID = (fieldName: string) => toUpper(fieldName) + "LambdaDataSource";

    // collects all function directives and creates associated datasources
    public before = (ctx: TransformerContext) => 
        ctx.inputDocument.definitions
            .filter(def => def.kind == Kind.OBJECT_TYPE_DEFINITION)
            .map((def: ObjectTypeDefinitionNode) => def.fields || [])
            .reduce((allFields, fields) => [...allFields, ...fields], [])
            .map(field => ({
                directive: field.directives.find(dir => dir.name.value === "function"),
                fieldName: field.name.value
            }))
            .filter(({directive, }) => directive)
            .forEach(({directive, fieldName}) => {
                const name: string = getDirectiveArgument(directive)("name")
                if (!name) {
                    throw new InvalidDirectiveError('@function directive must provide lambda function name')
                }

                const dataSourceID = this.lambdaDataSourceID(fieldName)
                const iamRoleID = dataSourceID + "Role"
                if(!ctx.getResource(dataSourceID)){
                    ctx.setResource(
                        dataSourceID,
                        this.resources.makeLambdaDataSource(name, iamRoleID)
                    )
                    ctx.setResource(
                        iamRoleID,
                        this.resources.makeInvokeLambdaIAMRole(name, iamRoleID + '-${env}')
                    )
                }
            })

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const resolverID = ResolverResourceIDs.ResolverResourceID(toUpper(parent.name.value), toUpper(field.name.value))
        const lambdaDataSourceID = this.lambdaDataSourceID(field.name.value)
        ctx.setResource(
            resolverID,
            this.resources.makeResolver(lambdaDataSourceID, parent.name.value, field.name.value)
        )
    }
}