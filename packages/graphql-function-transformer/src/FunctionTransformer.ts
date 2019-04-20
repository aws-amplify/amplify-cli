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

    private lambdaDataSourceName = (name: string) => toUpper(name.replace(/-?_?\${[^}]*}/g, ''));
    private lambdaDataSourceID = (name: string) => this.lambdaDataSourceName(name) + "LambdaDataSource";

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
                const functionName: string = getDirectiveArgument(directive)("name")
                if (!functionName) {
                    throw new InvalidDirectiveError('@function directive must provide lambda function name')
                }

                const dataSourceName = this.lambdaDataSourceName(functionName)
                const dataSourceID = this.lambdaDataSourceID(functionName)
                const iamRoleID = dataSourceID + "Role"
                if(!ctx.getResource(dataSourceID)){
                    ctx.setResource(
                        dataSourceID,
                        this.resources.makeLambdaDataSource(functionName, dataSourceName, iamRoleID)
                    )
                    ctx.setResource(
                        iamRoleID,
                        this.resources.makeInvokeLambdaIAMRole(functionName, iamRoleID + '-${env}')
                    )
                }
            })

    public field = (
        parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
        field: FieldDefinitionNode,
        directive: DirectiveNode,
        ctx: TransformerContext
    ): void => {
        const incompatible = field.directives.find((dir) => dir.name.value === 'connection' || dir.name.value === 'http')
        if (incompatible) {
            throw new InvalidDirectiveError('@function directive cannot be used alongside other directive that creates a resolver. (Only one resolver is allowed per field)')
        }

        const functionName: string = getDirectiveArgument(directive)("name")
        const resolverID = ResolverResourceIDs.ResolverResourceID(toUpper(parent.name.value), toUpper(field.name.value))
        const lambdaDataSourceID = this.lambdaDataSourceID(functionName)
        ctx.setResource(
            resolverID,
            this.resources.makeResolver(lambdaDataSourceID, parent.name.value, field.name.value)
        )
    }
}