import { InputObjectTypeDefinitionNode } from 'graphql'
import { makeInputValueDefinition, makeNonNullType, makeNamedType } from 'graphql-transformer-common';

export function updateCreateInputWithConnectionField(
    input: InputObjectTypeDefinitionNode,
    connectionFieldName: string,
    nonNull: boolean = false
): InputObjectTypeDefinitionNode {
    const updatedFields = [
        ...input.fields,
        makeInputValueDefinition(connectionFieldName, nonNull ? makeNonNullType(makeNamedType('ID')) : makeNamedType('ID'))
    ]
    return {
        ...input,
        fields: updatedFields
    }
}

export function updateUpdateInputWithConnectionField(
    input: InputObjectTypeDefinitionNode,
    connectionFieldName: string
): InputObjectTypeDefinitionNode {
    const updatedFields = [
        ...input.fields,
        makeInputValueDefinition(connectionFieldName, makeNamedType('ID'))
    ]
    return {
        ...input,
        fields: updatedFields
    }
}
