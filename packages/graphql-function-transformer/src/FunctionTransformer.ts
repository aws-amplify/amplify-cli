import { Transformer, TransformerContext } from "graphql-transformer-core"
import { Kind, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { getDirectiveArgument } from 'graphql-transformer-common'
import { ResourceFactory } from './resources'
import { toUpper } from 'graphql-transformer-common'

export class FunctionTransformer extends Transformer {

    resources: ResourceFactory

    constructor() {
        super(
            'FunctionTransformer',
            'directive @function(name: String!, region: String) on FIELD_DEFINITION'
        )
        this.resources = new ResourceFactory();
    }

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
                const dataSourceID = toUpper(fieldName) + "LambdaDataSource"
                const iamRoleID = dataSourceID + "Role"
                ctx.setResource(
                    dataSourceID,
                    this.resources.makeLambdaDataSource(name, iamRoleID)
                )
            })
}