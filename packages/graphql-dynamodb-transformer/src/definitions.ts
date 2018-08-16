import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode, Kind, TypeNode,
    EnumTypeDefinitionNode, ObjectTypeExtensionNode
} from 'graphql'
import {
    wrapNonNull, unwrapNonNull, makeNamedType, toUpper, graphqlName, makeListType,
    isScalar, getBaseType, blankObjectExtension, extensionWithFields, makeField,
    makeArg,
    ModelResourceIDs
} from 'graphql-transformer-common'

const STRING_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith']
const ID_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith']
const INT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between']
const FLOAT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between']
const BOOLEAN_CONDITIONS = ['ne', 'eq']

export function makeCreateInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelCreateInputObjectName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => field.name.value !== 'id' && isScalar(field.type))
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
    const name = ModelResourceIDs.ModelUpdateInputObjectName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter(f => isScalar(f.type))
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
    const name = ModelResourceIDs.ModelDeleteInputObjectName(obj.name.value)
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

export function makeModelXFilterInputObject(obj: ObjectTypeDefinitionNode): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelFilterInputTypeName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => isScalar(field.type) === true)
        .map(
            (field: FieldDefinitionNode) => ({
                kind: Kind.INPUT_VALUE_DEFINITION,
                name: field.name,
                type: makeNamedType('Model' + getBaseType(field.type) + 'FilterInput'),
                // TODO: Service does not support new style descriptions so wait.
                // description: field.description,
                directives: []
            })
        )

    fields.push(
        {
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: {
                kind: 'Name',
                value: 'and'
            },
            type: makeListType(makeNamedType(name)),
            // TODO: Service does not support new style descriptions so wait.
            // description: field.description,
            directives: []
        },
        {
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: {
                kind: 'Name',
                value: 'or'
            },
            type: makeListType(makeNamedType(name)),
            // TODO: Service does not support new style descriptions so wait.
            // description: field.description,
            directives: []
        },
        {
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: {
                kind: 'Name',
                value: 'not'
            },
            type: makeNamedType(name),
            // TODO: Service does not support new style descriptions so wait.
            // description: field.description,
            directives: []
        }
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

export function makeModelSortDirectionEnumObject(): EnumTypeDefinitionNode {
    const name = graphqlName('ModelSortDirection')
    return {
        kind: Kind.ENUM_TYPE_DEFINITION,
        name: {
            kind: 'Name',
            value: name
        },
        values: [
            {
                kind: Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'ASC' },
                directives: []
            },
            {
                kind: Kind.ENUM_VALUE_DEFINITION,
                name: { kind: 'Name', value: 'DESC' },
                directives: []
            }
        ],
        directives: []
    }
}

export function makeModelScalarFilterInputObject(type: string): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelFilterInputTypeName(type)
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

export function makeModelConnectionType(typeName: string): ObjectTypeExtensionNode {
    const connectionName = ModelResourceIDs.ModelConnectionTypeName(typeName)
    let connectionTypeExtension = blankObjectExtension(connectionName)
    connectionTypeExtension = extensionWithFields(
        connectionTypeExtension,
        [makeField(
            'items',
            [],
            makeListType(makeNamedType(typeName))
        )]
    )
    connectionTypeExtension = extensionWithFields(
        connectionTypeExtension,
        [makeField(
            'nextToken',
            [],
            makeNamedType('String')
        )]
    )
    return connectionTypeExtension
}

export function makeModelScanField(fieldName: string, returnTypeName: string): FieldDefinitionNode {
    return makeField(
        fieldName,
        [
            makeArg('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(returnTypeName))),
            makeArg('limit', makeNamedType('Int')),
            makeArg('nextToken', makeNamedType('String'))
        ],
        makeNamedType(ModelResourceIDs.ModelConnectionTypeName(returnTypeName))
    )
}

export function makeModelConnectionField(fieldName: string, returnTypeName: string): FieldDefinitionNode {
    return makeField(
        fieldName,
        [
            makeArg('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(returnTypeName))),
            makeArg('sortDirection', makeNamedType('ModelSortDirection')),
            makeArg('limit', makeNamedType('Int')),
            makeArg('nextToken', makeNamedType('String'))
        ],
        makeNamedType(ModelResourceIDs.ModelConnectionTypeName(returnTypeName))
    )
}

export function makeScalarFilterInputs(): InputObjectTypeDefinitionNode[] {
    return [
        makeModelScalarFilterInputObject('String'),
        makeModelScalarFilterInputObject('ID'),
        makeModelScalarFilterInputObject('Int'),
        makeModelScalarFilterInputObject('Float'),
        makeModelScalarFilterInputObject('Boolean')
    ];
}