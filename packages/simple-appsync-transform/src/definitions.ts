import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode,
    TypeNode, SchemaDefinitionNode, OperationTypeNode, OperationTypeDefinitionNode,
    ObjectTypeExtensionDefinitionNode, NamedTypeNode
} from 'graphql'
import { toUpper, graphqlName } from './util'

export function makeCreateInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Create` + toUpper(obj.name.value) + 'Input')
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => field.name.value !== 'id')
        .map(
            (field: FieldDefinitionNode) => ({
                kind: 'InputValueDefinition',
                name: field.name,
                type: field.type,
                description: field.description,
                directives: []
            })
        )
    return {
        kind: 'InputObjectTypeDefinition',
        description: `Input type for ${obj.name.value} mutations`,
        name: {
            kind: 'Name',
            value: name
        },
        fields,
        directives: []
    }
}

export function makeUpdateInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName('Update' + toUpper(obj.name.value) + 'Input')
    const fields: InputValueDefinitionNode[] = obj.fields
        .map(
            (field: FieldDefinitionNode) => ({
                kind: 'InputValueDefinition',
                name: field.name,
                type: field.name.value === 'id' ?
                    wrapNonNull(field.type) :
                    unwrapNonNull(field.type),
                description: field.description,
                directives: []
            })
        )
    return {
        kind: 'InputObjectTypeDefinition',
        description: `Input type for ${obj.name.value} mutations`,
        name: {
            kind: 'Name',
            value: name
        },
        fields,
        directives: []
    }
}

export function makeDeleteInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName('Delete' + toUpper(obj.name.value) + 'Input')
    return {
        kind: 'InputObjectTypeDefinition',
        description: `Input type for ${obj.name.value} delete mutations`,
        name: {
            kind: 'Name',
            value: name
        },
        fields: [{
            kind: 'InputValueDefinition',
            name: { kind: 'Name', value: 'id' },
            type: makeNamedType('ID'),
            description: `The id of the ${obj.name.value} to delete.`,
            directives: []
        }],
        directives: []
    }
}

export function unwrapNonNull(type: TypeNode) {
    if (type.kind === 'NonNullType') {
        return unwrapNonNull(type.type)
    }
    return type
}

export function wrapNonNull(type: TypeNode) {
    if (type.kind !== 'NonNullType') {
        return makeNonNullType(type)
    }
    return type
}

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