import {
    ObjectTypeDefinitionNode, NamedTypeNode
} from 'graphql'
import { toUpper, graphqlName, makeField } from 'appsync-transformer-common'

export function makeSearchConnection(type: NamedTypeNode): ObjectTypeDefinitionNode {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: graphqlName(`${toUpper(type.name.value)}SearchConnection`)
        },
        fields: [
            makeField("items", [], { kind: 'ListType', type: type }),
            makeField("total", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
            makeField("nextToken", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } })
        ],
        directives: [],
        interfaces: []
    }
}