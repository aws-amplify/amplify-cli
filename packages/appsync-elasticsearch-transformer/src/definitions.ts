import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode,
    TypeNode, SchemaDefinitionNode, OperationTypeNode, OperationTypeDefinitionNode,
    ObjectTypeExtensionDefinitionNode, NamedTypeNode
} from 'graphql'
import { toUpper, graphqlName } from './util'

export function makeOperationType(
    operation: OperationTypeNode,
    type: string
): OperationTypeDefinitionNode {
    return {
        kind: 'OperationTypeDefinition',
        operation,
        type: {
            kind: 'NamedType',
            name: {
                kind: 'Name',
                value: type
            }
        }
    }
}

export function makeSchema(operationTypes: OperationTypeDefinitionNode[]): SchemaDefinitionNode {
    return {
        kind: 'SchemaDefinition',
        operationTypes
    }
}

export function blankObject(name: string): ObjectTypeDefinitionNode {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function blankObjectExtension(name: string): ObjectTypeExtensionDefinitionNode {
    return {
        kind: 'ObjectTypeExtensionDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function makeField(name: string, args: InputValueDefinitionNode[], type: TypeNode): ObjectTypeDefinitionNode {
    return {
        kind: 'FieldDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        arguments: args,
        type,
        directives: []
    }
}

export function makeArg(name: string, type: TypeNode): InputValueDefinitionNode {
    return {
        kind: 'InputValueDefinition',
        name: {
            kind: 'Name',
            value: name
        },
        type,
        directives: []
    }
}

export function makeNamedType(name: string): TypeNode {
    return {
        kind: 'NamedType',
        name: {
            kind: 'Name',
            value: name
        }
    }
}

export function makeNonNullType(type: TypeNode): TypeNode {
    return {
        kind: 'NonNullType',
        type
    }
}

export function makeListType(type: TypeNode): TypeNode {
    return {
        kind: 'ListType',
        type
    }
}

export function makeConnection(type: NamedTypeNode): ObjectTypeDefinitionNode {
    return {
        kind: 'ObjectTypeDefinition',
        name: {
            kind: 'Name',
            value: graphqlName(`${toUpper(type.name.value)}Connection`)
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