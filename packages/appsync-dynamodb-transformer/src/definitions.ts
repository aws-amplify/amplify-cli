import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode, Kind
} from 'graphql'
import { wrapNonNull, unwrapNonNull, makeNamedType, toUpper, graphqlName } from 'appsync-transformer-common'

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
