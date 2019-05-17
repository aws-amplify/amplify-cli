import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, Kind, TypeNode } from 'graphql';
import { makeListType, makeNamedType, getBaseType } from './definition';
import { ModelResourceIDs } from './ModelResourceIDs';
import { compoundExpression, block, iff, raw, set, ref, qref, obj, str, printBlock, list, forEach, Expression, newline, ReferenceNode } from 'graphql-mapping-template';

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

/**
* Key conditions materialize as instances of ModelXKeyConditionInput passed via $ctx.args.
* If the arguments with the given sortKey name exists, create a DynamoDB expression that
* implements its logic. Possible operators: eq, le, lt, ge, gt, beginsWith, and between.
* @param argName The name of the argument containing the sort key condition object.
* @param attributeType The type of the DynamoDB attribute in the table.
* @param queryExprReference The name of the variable containing the query expression in the template.
*/
export function  applyKeyConditionExpression(argName: string, attributeType: 'S' | 'N' | 'B' = 'S', queryExprReference: string = 'query', sortKeyName?: string, prefixVariableName?: string) {
    const prefixValue = (value: string): string => prefixVariableName ? `$${prefixVariableName}#${value}` : value;
    const _sortKeyName = sortKeyName ? sortKeyName : argName;
    return block("Applying Key Condition", [
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.beginsWith)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND begins_with(#sortKey, :sortKey)"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.beginsWith`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.between)`),
           compoundExpression([
               iff(
                   raw(`$ctx.args.${argName}.between.size() != 2`),
                   raw(`$util.error("Argument ${argName}.between expects exactly 2 elements.")`)
               ),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey BETWEEN :sortKey0 AND :sortKey1"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey0", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.between[0]`)}" })`),
               qref(`$${queryExprReference}.expressionValues.put(":sortKey1", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.between[1]`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.eq)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey = :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.eq`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.lt)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey < :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.lt`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.le)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey <= :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.le`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.gt)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey > :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.gt`)}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${argName}) && !$util.isNull($ctx.args.${argName}.ge)`),
           compoundExpression([
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey >= :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${_sortKeyName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "${attributeType}": "${prefixValue(`$ctx.args.${argName}.ge`)}" })`)
           ])
       )
   ]);
}


/**
* Key conditions materialize as instances of ModelXKeyConditionInput passed via $ctx.args.
* If the arguments with the given sortKey name exists, create a DynamoDB expression that
* implements its logic. Possible operators: eq, le, lt, ge, gt, beginsWith, and between.
* @param argName The name of the argument containing the sort key condition object.
* @param attributeType The type of the DynamoDB attribute in the table.
* @param queryExprReference The name of the variable containing the query expression in the template.
* @param compositeKeyName When handling a managed composite key from @key the name of the arg and underlying fields are different.
* @param compositeKeyValue When handling a managed composite key from @key the value of the composite key is made up of multiple parts known by the caller.
*/
export function  applyKeyExpressionForCompositeKey(keys: string[], attributeTypes: ('S' | 'N' | 'B')[] = ['S'], queryExprReference: string = 'query') {
    if (keys.length > 2) {
        // In the case of > 2, we condense the composite key, validate inputs at runtime, and wire up the HASH/RANGE expressions.
        // In the case of === 2, we validate inputs at runtime and wire up the HASH/RANGE expressions.
        const hashKeyName = keys[0];
        const hashKeyAttributeType = attributeTypes[0];
        const sortKeys = keys.slice(1);
        const sortKeyTypes = attributeTypes.slice(1);
        return compoundExpression([
            validateKeyArguments(keys),
            setupHashKeyExpression(hashKeyName, hashKeyAttributeType, queryExprReference),
            applyCompositeSortKey(sortKeys, sortKeyTypes, queryExprReference)
        ]);
    } else if (keys.length === 2) {
        // In the case of === 2, we validate inputs at runtime and wire up the HASH/RANGE expressions.
        const hashKeyName = keys[0];
        const hashKeyAttributeType = attributeTypes[0];
        const sortKeyName = keys[1];
        const sortKeyAttributeType = attributeTypes[1];
        return compoundExpression([
            validateKeyArguments(keys),
            setupHashKeyExpression(hashKeyName, hashKeyAttributeType, queryExprReference),
            applyKeyConditionExpression(sortKeyName, sortKeyAttributeType, queryExprReference)
        ]);
    } else if (keys.length === 1) {
        const hashKeyName = keys[0];
        const hashKeyAttributeType = attributeTypes[0];
        return setupHashKeyExpression(hashKeyName, hashKeyAttributeType, queryExprReference);
    }
}

function setupHashKeyExpression(hashKeyName: string, hashKeyAttributeType: string, queryExprReference: string) {
    return iff(
        raw(`!$util.isNull($ctx.args.${hashKeyName})`),
        compoundExpression([
            set(ref(`${queryExprReference}.expression`), str(`#${hashKeyName} = :${hashKeyName}`)),
            set(ref(`${queryExprReference}.expressionNames`), obj({ [`#${hashKeyName}`]: str(hashKeyName) })),
            set(ref(`${queryExprReference}.expressionValues`), obj({ [`:${hashKeyName}`]: obj({ [hashKeyAttributeType]: str(`$ctx.args.${hashKeyName}`) }) })),
        ])
    )
}

/**
 * Applies a composite sort key to the query expression.
 */
function applyCompositeSortKey(sortKeys: string[], sortKeyTypes: ('S'|'N'|'B')[], queryExprReference: string) {
    if (sortKeys.length === 0) {
        return newline();
    }
    // const sortKeyValue = sortKeys.map(key => `$ctx.args.${key}`).join('#')
    const sortKeyValueVariableName = 'sortKeyValue';
    const exprs: Expression[] = [
        set(ref(sortKeyValueVariableName), str(''))
    ];
    const sortKeyAttributeName = sortKeys.join('#');
    for (let index = 0; index < sortKeys.length; index++) {
        const key = sortKeys[index];
        const keyType = sortKeyTypes[index];
        if (index === sortKeys.length - 1) {
            // If this is the last element in the sort key list then handle the full KeyCondition.
            exprs.push(applyKeyConditionExpression(key, keyType, queryExprReference, sortKeyAttributeName, sortKeyValueVariableName));
            // Handle the case where the last element (that contains the DynamoDB operation information) is left undefined.
            // listX and queryX where the first n-1 values are provided should always be handled with a begins_with.
            exprs.push(
                iff(
                    raw(`$util.isNull($ctx.args.${key}) && $sortKeyValue.length() > 0`),
                    compoundExpression([
                        set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND begins_with(#sortKey, :sortKey)"`)),
                        qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
                        // TODO: Handle N & B.
                        qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${sortKeyValueVariableName}" })`)
                    ])
                )
            );
        } else if (index === 0) {
            // If this is the first element then initialize the key value.
            exprs.push(
                iff(
                    raw(`!$util.isNull($ctx.args.${key})`),
                    set(ref('sortKeyValue'), str(`\${ctx.args.${key}}`))
                )
            )
        } else {
            // If this is an element in the middle of the list, concat the element.
            exprs.push(
                iff(
                    raw(`!$util.isNull($ctx.args.${key})`),
                    set(ref('sortKeyValue'), str(`\${sortKeyValue}#\${ctx.args.${key}}`))
                )
            )
        }
    }
    return compoundExpression(exprs);
}

/**
 * When providing keys, you must provide them from left to right.
 * E.G. when providing @key(fields: ["k1", "k2", "k3"]) then you may
 * query by ["k1"] or ["k1", "k2"] or ["k1", "k2", "k3"] BUT you may not
 * query by ["k1", "k3"] as it is impossible to create a key condition without
 * the "k2" value. This snippet fails a query/list operation when invalid
 * argument sets are provided.
 * @param keys 
 */
function validateKeyArguments(keys: string[]) {
    const exprs: Expression[] = [];
    if (keys.length > 1) {
        for (let index = keys.length - 1; index > 0; index--) {
            const rightKey = keys[index];
            const previousKey = keys[index - 1];
            exprs.push(
                iff(
                    raw(`!$util.isNull($ctx.args.${rightKey}) && $util.isNull($ctx.args.${previousKey})`),
                    raw(`$util.error("When providing argument '${rightKey}' you must also provide arguments ${keys.slice(0, index).join(', ')}", "InvalidArgumentsError")`)
                )
            )
        }
        return block('Validate key arguments.', exprs);
    } else {
        return newline();
    }
}
