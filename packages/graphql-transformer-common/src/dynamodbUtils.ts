import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, Kind, TypeNode } from 'graphql';
import { makeListType, makeNamedType, getBaseType } from './definition';
import { ModelResourceIDs } from './ModelResourceIDs';

// Key conditions
const STRING_KEY_CONDITIONS = ['eq', 'le', 'lt', 'ge', 'gt', 'between', 'beginsWith']
const ID_KEY_CONDITIONS = ['eq', 'le', 'lt', 'ge', 'gt', 'between', 'beginsWith']
const INT_KEY_CONDITIONS = ['eq', 'le', 'lt', 'ge', 'gt', 'between']
const FLOAT_KEY_CONDITIONS = ['eq', 'le', 'lt', 'ge', 'gt', 'between']

function getScalarKeyConditions(type: string): string[] {
    switch (type) {
        case 'String':
            return STRING_KEY_CONDITIONS
        case 'ID':
            return ID_KEY_CONDITIONS
        case 'Int':
            return INT_KEY_CONDITIONS
        case 'Float':
            return FLOAT_KEY_CONDITIONS
        default:
            throw 'Valid types are String, ID, Int, Float, Boolean'
    }
}
export function makeModelStringKeyConditionInputObject(type: string): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelKeyConditionInputTypeName(type)
    const conditions = getScalarKeyConditions(type)
    const fields: InputValueDefinitionNode[] = conditions
        .map((condition: string) => ({
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: { kind: "Name" as "Name", value: condition },
            type: condition === 'between' ? makeListType(makeNamedType(type)) : makeNamedType(type),
            directives: []
        }))
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

const STRING_KEY_CONDITION = makeModelStringKeyConditionInputObject('String');
const ID_KEY_CONDITION = makeModelStringKeyConditionInputObject('ID');
const INT_KEY_CONDITION = makeModelStringKeyConditionInputObject('Int');
const FLOAT_KEY_CONDITION = makeModelStringKeyConditionInputObject('Float');
const SCALAR_KEY_CONDITIONS = [STRING_KEY_CONDITION, ID_KEY_CONDITION, INT_KEY_CONDITION, FLOAT_KEY_CONDITION];
export function makeScalarKeyConditionInputs(): InputObjectTypeDefinitionNode[] {
    return SCALAR_KEY_CONDITIONS;
}
export function makeScalarKeyConditionForType(type: TypeNode): InputObjectTypeDefinitionNode {
    const inputName = ModelResourceIDs.ModelKeyConditionInputTypeName(getBaseType(type));
    for (const key of SCALAR_KEY_CONDITIONS) {
        if (key.name.value === inputName) {
            return key;
        }
    }
}