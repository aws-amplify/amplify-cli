import {
    ObjectTypeDefinitionNode, InputValueDefinitionNode, InputObjectTypeDefinitionNode,
    FieldDefinitionNode, NamedTypeNode, Kind
} from 'graphql'
import {
    toUpper, graphqlName, makeField, makeNamedType, unwrapNonNull, isScalar
} from 'appsync-transformer-common'

const searchableStringQueryInputName = 'SearchableStringQueryInput';
const searchableIntRangeInputName = 'SearchableIntRangeInput';
const searchableFloatRangeInputName = 'SearchableFloatRangeInput'

export function makeSearchableStringQueryInput(): ObjectTypeDefinitionNode {
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: searchableStringQueryInputName
        },
        fields: [
            makeField("eq", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }),

            // The standard query for performing full text queries, including fuzzy matching and phrase or proximity queries.
            makeField("match", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }),

            // Like the match query but used for matching exact phrases or word proximity matches.
            makeField("matchPhrase", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } }),

            // Find documents where the field specified contains any non-null value.
            makeField("exists", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Boolean' } }),

            // Find documents where the field specified contains terms which match the regular expression specified.
            makeField("regexp", [], { kind: 'NamedType', name: { kind: 'Name', value: 'String' } })
        ],
        directives: [],
        interfaces: []
    }
}

export function makeSearchableIntRangeInput(): ObjectTypeDefinitionNode {
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: searchableIntRangeInputName
        },
        fields: [
            makeField("gt", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
            makeField("lt", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
            makeField("gte", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
            makeField("lte", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } }),
        ],
        directives: [],
        interfaces: []
    }
}

export function makeSearchableFloatRangeInput(): ObjectTypeDefinitionNode {
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: searchableFloatRangeInputName
        },
        fields: [
            makeField("gt", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } }),
            makeField("lt", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } }),
            makeField("gte", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } }),
            makeField("lte", [], { kind: 'NamedType', name: { kind: 'Name', value: 'Float' } }),
        ],
        directives: [],
        interfaces: []
    }
}

export function makeStaticFields(): ReadonlyArray<ObjectTypeDefinitionNode> {
    return new Array(
        makeSearchableStringQueryInput(),
        makeSearchableIntRangeInput(),
        makeSearchableFloatRangeInput()
    );
}

export function getSearchableNamedType(namedType: NamedTypeNode): NamedTypeNode {
    switch (namedType.name.value) {
        case 'String':
            return makeNamedType(searchableStringQueryInputName);
        case 'Int':
        return makeNamedType(searchableIntRangeInputName);
        case 'Float':
        return makeNamedType(searchableFloatRangeInputName);
        case 'Boolean':
            return makeNamedType('Boolean') // TODO
        default:
            throw `Found ${namedType.name.value}. Valid types are String, Int, Float, Boolean`
    }
}

export function makeSearchInputObject(obj: NamedTypeNode): InputObjectTypeDefinitionNode {
    const name = graphqlName('Searchable' + toUpper(obj.name.value) + 'QueryInput')
    // const pluckFieldName = (field: FieldDefinitionNode) => field.name.value
    const fields: InputValueDefinitionNode[] = (obj.fields || [])
        .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
        .filter((field: FieldDefinitionNode) => field.name.value !== 'id')
        .filter((field: FieldDefinitionNode) => unwrapNonNull(field.type).kind !== 'ListType') // TODO: Need to support String[]
        .map(
            (field: FieldDefinitionNode) => ({
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: getSearchableNamedType(unwrapNonNull(field.type)),
                directives: [],
                interfaces: []
            })
        )
    return {
        kind: Kind.INPUT_OBJECT_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        fields,
        directives: [],
        interfaces: []
    }
}

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
