import {
    ObjectTypeDefinitionNode, InputValueDefinitionNode, InputObjectTypeDefinitionNode,
    FieldDefinitionNode, Kind, TypeNode
} from 'graphql'
import {
    graphqlName, makeNamedType, isScalar,
    makeListType, getBaseType
} from 'appsync-transformer-common'

const STRING_CONDITIONS = ['eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp']
const ID_CONDITIONS = ['eq', 'match', 'matchPhrase', 'matchPhrasePrefix', 'multiMatch', 'exists', 'wildcard', 'regexp']
const INT_CONDITIONS = ['gt', 'lt', 'gte', 'lte', 'eq', 'range']
const FLOAT_CONDITIONS = ['gt', 'lt', 'gte', 'lte', 'eq', 'range']
const BOOLEAN_CONDITIONS = ['eq', 'ne']

export function makeSearchableScalarInputObject(type: string): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Searchable${type}FilterInput`)
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

export function makeSearchableXFilterInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = graphqlName(`Searchable${obj.name.value}FilterInput`)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
        .map(
            (field: FieldDefinitionNode) => ({
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: makeNamedType('Searchable' + getBaseType(field.type) + 'FilterInput'),
                // TODO: Service does not support new style descriptions so wait.
                // description: field.description,
                directives: []
            })
        )
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
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
        case 'range':
            return makeListType(makeNamedType(type))
        case 'exists':
            return makeNamedType('Boolean')
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

