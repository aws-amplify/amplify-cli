import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode, Kind, TypeNode
} from 'graphql'
import {
    wrapNonNull, unwrapNonNull, makeNamedType, toUpper, graphqlName, makeListType,
    isScalar, getBaseType
} from 'appsync-transformer-common'

const STRING_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith', 'and', 'or']
const ID_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith', 'and', 'or']
const INT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'and', 'or']
const FLOAT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'and', 'or']
const BOOLEAN_CONDITIONS = ['ne', 'eq', 'and', 'or']

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

export function makeTableXFilterInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Table${obj.name.value}FilterInput`)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
        .map(
            (field: FieldDefinitionNode) => ({
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: makeNamedType('Table' + getBaseType(field.type) + 'FilterInput'),
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

export function makeTableScalarFilterInputObject(type: string): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Table${type}FilterInput`)
    let conditions = getScalarConditions(type)
    const fields: InputValueDefinitionNode[] = conditions
        .map((condition: string) => ({
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: { kind: "Name" as "Name", value: condition },
            type: getScalarFilterInputType(condition, type, name),
            // TODO: Service does not support new style descriptions so wait.
            // description: field.description,
            directives: []
        }))
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

function getScalarFilterInputType(condition: string, type: string, filterInputName: string): TypeNode {
    switch (condition) {
        case 'between':
            return makeListType(makeNamedType(type))
        case 'and':
        case 'or':
            return makeNamedType(filterInputName)
        default:
            return makeNamedType(type)
    }
}

function getScalarConditions(type: string): string[] {
    switch (type) {
        case 'String':
            return STRING_CONDITIONS
        case 'ID':
            return ID_CONDITIONS
        case 'Int':
            return INT_CONDITIONS
        case 'Float':
            return FLOAT_CONDITIONS
        case 'Boolean':
            return BOOLEAN_CONDITIONS
        default:
            throw 'Valid types are String, ID, Int, Float, Boolean'
    }
}
