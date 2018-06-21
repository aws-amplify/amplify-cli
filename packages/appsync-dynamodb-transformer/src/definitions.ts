import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode,
    TypeNode, SchemaDefinitionNode, OperationTypeNode, OperationTypeDefinitionNode,
    ObjectTypeExtensionNode, NamedTypeNode, Kind, NonNullTypeNode, ListTypeNode
} from 'graphql'
import { toUpper, graphqlName } from './util'

export function makeCreateInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Create` + toUpper(obj.name.value) + 'Input')
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => field.name.value !== 'id')
        .map(
            (field: FieldDefinitionNode) => ({
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: field.type,
                // TODO: Service does not support new style descriptions so wait.
                // description: field.description,
                directives: []
            })
        )
    return {
        kind: 'InputObjectTypeDefinition',
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
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
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: field.name.value === 'id' ?
                    wrapNonNull(field.type) :
                    unwrapNonNull(field.type),
                // TODO: Service does not support new style descriptions so wait.
                // description: field.description,
                directives: []
            })
        )
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} mutations`
        // },
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
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        // TODO: Service does not support new style descriptions so wait.
        // description: {
        //     kind: 'StringValue',
        //     value: `Input type for ${obj.name.value} delete mutations`
        // },
        name: {
            kind: 'Name',
            value: name
        },
        fields: [{
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: { kind: 'Name', value: 'id' },
            type: makeNamedType('ID'),
            // TODO: Service does not support new style descriptions so wait.
            // description: {
            //     kind: 'StringValue',
            //     value: `The id of the ${obj.name.value} to delete.`
            // },
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
        kind: Kind.SCHEMA_DEFINITION,
        operationTypes,
        directives: []
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

export function blankObjectExtension(name: string): ObjectTypeExtensionNode {
    return {
        kind: Kind.OBJECT_TYPE_EXTENSION,
        name: {
            kind: 'Name',
            value: name
        },
        fields: [],
        directives: [],
        interfaces: []
    }
}

export function extensionWithFields(object: ObjectTypeExtensionNode, fields: FieldDefinitionNode[]): ObjectTypeExtensionNode {
    return {
        ...object,
        fields: [...object.fields, ...fields]
    }
}

export function makeField(name: string, args: InputValueDefinitionNode[], type: TypeNode): FieldDefinitionNode {
    return {
        kind: Kind.FIELD_DEFINITION,
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

export function makeNamedType(name: string): NamedTypeNode {
    return {
        kind: 'NamedType',
        name: {
            kind: 'Name',
            value: name
        }
    }
}

export function makeNonNullType(type: NamedTypeNode | ListTypeNode): NonNullTypeNode {
    return {
        kind: Kind.NON_NULL_TYPE,
        type
    }
}

export function makeListType(type: TypeNode): TypeNode {
    return {
        kind: 'ListType',
        type
    }
}
