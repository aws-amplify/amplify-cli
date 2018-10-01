import {
    ObjectTypeDefinitionNode, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode, FieldDefinitionNode, Kind, TypeNode,
    EnumTypeDefinitionNode, ObjectTypeExtensionNode,
    TypeDefinitionNode
} from 'graphql'
import {
    wrapNonNull, unwrapNonNull, makeNamedType, toUpper, graphqlName, makeListType,
    isScalar, getBaseType, blankObjectExtension, extensionWithFields, makeField,
    makeInputValueDefinition,
    ModelResourceIDs,
    makeDirective,
    makeArgument,
    makeValueNode,
    withNamedNodeNamed
} from 'graphql-transformer-common'
import { TransformerContext } from 'graphql-transformer-core';

const STRING_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith']
const ID_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between', 'beginsWith']
const INT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between']
const FLOAT_CONDITIONS = ['ne', 'eq', 'le', 'lt', 'ge', 'gt', 'contains', 'notContains', 'between']
const BOOLEAN_CONDITIONS = ['ne', 'eq']

export function getNonModelObjectArray(
    obj: ObjectTypeDefinitionNode,
    ctx: TransformerContext,
    pMap: Map<string, ObjectTypeDefinitionNode>
): ObjectTypeDefinitionNode[] {

    // loop over all fields in the object, picking out all nonscalars that are not @model types
    for (const field of obj.fields) {
        if (!isScalar(field.type)) {
            const def = ctx.getType(getBaseType(field.type))

            if (
                def &&
                def.kind === Kind.OBJECT_TYPE_DEFINITION &&
                !def.directives.find(e => e.name.value === 'model') &&
                pMap.get(def.name.value) === undefined
            ) {
                // recursively find any non @model types referenced by the current
                // non @model type
                pMap.set(def.name.value, def)
                getNonModelObjectArray(def, ctx, pMap)
            }
        }
    }

    return Array.from(pMap.values())
}

export function makeNonModelInputObject(
    obj: ObjectTypeDefinitionNode,
    nonModelTypes: ObjectTypeDefinitionNode[],
    ctx: TransformerContext
): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.NonModelInputObjectName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => {
            const fieldType = ctx.getType(getBaseType(field.type))
            if (field.name.value === 'id') {
                return false;
            }
            if (
                isScalar(field.type) ||
                nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ||
                (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
            ) {
                return true;
            }
            return false;
        })
        .map(
            (field: FieldDefinitionNode) => {
                const type = nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ?
                    withNamedNodeNamed(field.type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type))) :
                    field.type
                return {
                    kind: Kind.INPUT_VALUE_DEFINITION,
                    name: field.name,
                    type: type,
                    // TODO: Service does not support new style descriptions so wait.
                    // description: field.description,
                    directives: []
                }
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

export function makeCreateInputObject(
    obj: ObjectTypeDefinitionNode,
    nonModelTypes: ObjectTypeDefinitionNode[],
    ctx: TransformerContext
): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelCreateInputObjectName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter((field: FieldDefinitionNode) => {
            const fieldType = ctx.getType(getBaseType(field.type))
            if (field.name.value === 'id') {
                return false;
            }
            if (
                isScalar(field.type) ||
                nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ||
                (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
            ) {
                return true;
            }
            return false;
        })
        .map(
            (field: FieldDefinitionNode) => {
                const type = nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ?
                    withNamedNodeNamed(field.type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type))) :
                    field.type
                return {
                    kind: Kind.INPUT_VALUE_DEFINITION,
                    name: field.name,
                    type: type,
                    // TODO: Service does not support new style descriptions so wait.
                    // description: field.description,
                    directives: []
                }
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

export function makeUpdateInputObject(
    obj: ObjectTypeDefinitionNode,
    nonModelTypes: ObjectTypeDefinitionNode[],
    ctx: TransformerContext
): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelUpdateInputObjectName(obj.name.value)
    const fields: InputValueDefinitionNode[] = obj.fields
        .filter(f => {
            const fieldType = ctx.getType(getBaseType(f.type))
            if (
                isScalar(f.type) ||
                nonModelTypes.find(e => e.name.value === getBaseType(f.type)) ||
                (fieldType && fieldType.kind === Kind.ENUM_TYPE_DEFINITION)
            ) {
                return true
            } else {
                return false
            }
        })
        .map(
            (field: FieldDefinitionNode) => {
                let type;
                if (field.name.value === 'id') {
                    type = wrapNonNull(field.type)
                } else {
                    type = unwrapNonNull(field.type)
                }
                type = nonModelTypes.find(e => e.name.value === getBaseType(field.type)) ?
                    withNamedNodeNamed(type, ModelResourceIDs.NonModelInputObjectName(getBaseType(field.type))) :
                    type
                return {
                    kind: Kind.INPUT_VALUE_DEFINITION,
                    name: field.name,
                    type: type,
                    // TODO: Service does not support new style descriptions so wait.
                    // description: field.description,
                    directives: []
                }
            }
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
                type: makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(getBaseType(field.type))),
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

export function makeSubscriptionField(fieldName: string, returnTypeName: string, mutations: string[]): FieldDefinitionNode {
    return makeField(
        fieldName,
        [],
        makeNamedType(returnTypeName),
        [
            makeDirective(
                'aws_subscribe',
                [makeArgument('mutations', makeValueNode(mutations))]
            )
        ]
    )
}

export function makeModelScanField(fieldName: string, returnTypeName: string): FieldDefinitionNode {
    return makeField(
        fieldName,
        [
            makeInputValueDefinition('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(returnTypeName))),
            makeInputValueDefinition('limit', makeNamedType('Int')),
            makeInputValueDefinition('nextToken', makeNamedType('String'))
        ],
        makeNamedType(ModelResourceIDs.ModelConnectionTypeName(returnTypeName))
    )
}

export function makeModelConnectionField(fieldName: string, returnTypeName: string): FieldDefinitionNode {
    return makeField(
        fieldName,
        [
            makeInputValueDefinition('filter', makeNamedType(ModelResourceIDs.ModelFilterInputTypeName(returnTypeName))),
            makeInputValueDefinition('sortDirection', makeNamedType('ModelSortDirection')),
            makeInputValueDefinition('limit', makeNamedType('Int')),
            makeInputValueDefinition('nextToken', makeNamedType('String'))
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