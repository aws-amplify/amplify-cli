import { InputObjectTypeDefinitionNode, InputValueDefinitionNode, Kind, TypeNode, FieldDefinitionNode } from 'graphql';
import { makeListType, makeNamedType, getBaseType, makeInputValueDefinition, DEFAULT_SCALARS, makeInputObjectDefinition, isScalar } from './definition';
import { ModelResourceIDs } from './ModelResourceIDs';
import { compoundExpression, block, iff, raw, set, ref, qref, obj, str, printBlock, list, forEach, Expression, newline, ReferenceNode, ifElse } from 'graphql-mapping-template';
import { toCamelCase } from './util';

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
export function makeModelScalarKeyConditionInputObject(type: string): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelKeyConditionInputTypeName(type)
    const conditions = getScalarKeyConditions(type)
    const fields: InputValueDefinitionNode[] = conditions
        .map((condition: string) => ({
            kind: Kind.INPUT_VALUE_DEFINITION,
            name: { kind: "Name" as "Name", value: condition },
            type: condition === 'between' ? makeListType(makeNamedType(type)) : makeNamedType(type),
            directives: []
        }))
    return makeInputObjectDefinition(name, fields);
}

const STRING_KEY_CONDITION = makeModelScalarKeyConditionInputObject('String');
const ID_KEY_CONDITION = makeModelScalarKeyConditionInputObject('ID');
const INT_KEY_CONDITION = makeModelScalarKeyConditionInputObject('Int');
const FLOAT_KEY_CONDITION = makeModelScalarKeyConditionInputObject('Float');
const SCALAR_KEY_CONDITIONS = [STRING_KEY_CONDITION, ID_KEY_CONDITION, INT_KEY_CONDITION, FLOAT_KEY_CONDITION];
export function makeScalarKeyConditionInputs(): InputObjectTypeDefinitionNode[] {
    return SCALAR_KEY_CONDITIONS;
}
export function makeScalarKeyConditionForType(type: TypeNode,
    nonScalarTypeResolver: (baseType: string) => string = undefined): InputObjectTypeDefinitionNode {
    const baseType = getBaseType(type);
    let resolvedScalarName: string;
    if (isScalar(type)) {
        resolvedScalarName = baseType;
    } else if (nonScalarTypeResolver) {
        resolvedScalarName = nonScalarTypeResolver(baseType);
    }

    const inputName = ModelResourceIDs.ModelKeyConditionInputTypeName(resolvedScalarName);
    for (const key of SCALAR_KEY_CONDITIONS) {
        if (key.name.value === inputName) {
            return key;
        }
    }
}

/**
 * Given a list of key fields, create a composite key input type for the sort key condition.
 * Given, 
 * type User @model @key(fields: ["a", "b", "c"]) { a: String, b: String, c: String }
 * a composite key will be formed over "a" and "b". This will output:
 * input UserPrimaryCompositeKeyConditionInput {
 *   beginsWith: UserPrimaryCompositeKeyInput,
 *   between: [UserPrimaryCompositeKeyInput],
 *   eq, le, lt, gt, ge: UserPrimaryCompositeKeyInput
 * }
 * input UserPrimaryCompositeKeyInput {
 *   b: String
 *   c: String
 * }
 */
export function makeCompositeKeyConditionInputForKey(modelName: string, keyName: string, fields: FieldDefinitionNode[]): InputObjectTypeDefinitionNode {
    const name = ModelResourceIDs.ModelCompositeKeyConditionInputTypeName(modelName, keyName)
    const conditions = STRING_KEY_CONDITIONS;
    const inputValues: InputValueDefinitionNode[] = conditions
        .map((condition: string) => {
            // Between takes a list of comosite key nodes.
            const typeNode = condition === 'between' ?
                makeListType(makeNamedType(ModelResourceIDs.ModelCompositeKeyInputTypeName(modelName, keyName))) :
                makeNamedType(ModelResourceIDs.ModelCompositeKeyInputTypeName(modelName, keyName));
            return makeInputValueDefinition(condition, typeNode);
        });
    return makeInputObjectDefinition(name, inputValues);
}

export function makeCompositeKeyInputForKey(modelName: string, keyName: string, fields: FieldDefinitionNode[]): InputObjectTypeDefinitionNode {
    const inputValues = fields.map(
        (field: FieldDefinitionNode, idx) => {
            const baseTypeName = getBaseType(field.type);
            const nameOverride = DEFAULT_SCALARS[baseTypeName]
            let typeNode = null;
            if (idx === fields.length -1 && nameOverride) {
                typeNode = makeNamedType(nameOverride)
            } else {
                typeNode = makeNamedType(baseTypeName)
            }
            return makeInputValueDefinition(field.name.value, typeNode);
        });
    const inputName = ModelResourceIDs.ModelCompositeKeyInputTypeName(modelName, keyName);
    return makeInputObjectDefinition(inputName, inputValues);
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
*/
export function  applyCompositeKeyConditionExpression(keyNames: string[], queryExprReference: string = 'query', sortKeyArgumentName: string, sortKeyAttributeName: string) {
    const accumulatorVar1 = 'sortKeyValue';
    const accumulatorVar2 = 'sortKeyValue2';
    const sep = ModelResourceIDs.ModelCompositeKeySeparator();
    return block("Applying Key Condition", [
        set(ref(accumulatorVar1), str("")),
        set(ref(accumulatorVar2), str("")),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.beginsWith)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.beginsWith.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.beginsWith.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.beginsWith.${keyName}`)),
                        true
                        )
                    ),
                set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND begins_with(#sortKey, :sortKey)"`)),
                qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
                // TODO: Handle N & B.
                qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.between)`),
           compoundExpression([
                iff(
                    raw(`$ctx.args.${sortKeyArgumentName}.between.size() != 2`),
                    raw(`$util.error("Argument ${sortKeyArgumentName}.between expects exactly 2 elements.")`)
                ),
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.between[0].${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.between[0].${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.between[0].${keyName}`)),
                        true
                    )),
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.between[1].${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar2), str(`$ctx.args.${sortKeyArgumentName}.between[1].${keyName}`)) :
                            set(ref(accumulatorVar2), str(`$${accumulatorVar2}${sep}$ctx.args.${sortKeyArgumentName}.between[1].${keyName}`)),
                        true
                    )),
                set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey BETWEEN :sortKey0 AND :sortKey1"`)),
                qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
                // TODO: Handle N & B.
                qref(`$${queryExprReference}.expressionValues.put(":sortKey0", { "S": "$${accumulatorVar1}" })`),
                qref(`$${queryExprReference}.expressionValues.put(":sortKey1", { "S": "$${accumulatorVar2}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.eq)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.eq.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.eq.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.eq.${keyName}`)),
                        true
                    )),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey = :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.lt)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.lt.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.lt.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.lt.${keyName}`)),
                        true
                    )),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey < :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.le)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.le.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.le.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.le.${keyName}`)),
                        true
                    )),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey <= :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.gt)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.gt.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.gt.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.gt.${keyName}`)),
                            true
                    )),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey > :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       iff(
           raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && !$util.isNull($ctx.args.${sortKeyArgumentName}.ge)`),
           compoundExpression([
                ...keyNames.map(
                    (keyName, idx) => iff(
                        raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}.ge.${keyName})`),
                        idx === 0 ?
                            set(ref(accumulatorVar1), str(`$ctx.args.${sortKeyArgumentName}.ge.${keyName}`)) :
                            set(ref(accumulatorVar1), str(`$${accumulatorVar1}${sep}$ctx.args.${sortKeyArgumentName}.ge.${keyName}`)),
                        true
                    )),
               set(ref(`${queryExprReference}.expression`), raw(`"$${queryExprReference}.expression AND #sortKey >= :sortKey"`)),
               qref(`$${queryExprReference}.expressionNames.put("#sortKey", "${sortKeyAttributeName}")`),
               // TODO: Handle N & B.
               qref(`$${queryExprReference}.expressionValues.put(":sortKey", { "S": "$${accumulatorVar1}" })`)
           ])
       ),
       newline()
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
            validateCompositeKeyArguments(keys),
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
    // E.g. status#date
    const sortKeyAttributeName = ModelResourceIDs.ModelCompositeAttributeName(sortKeys);
    const sortKeyArgumentName = ModelResourceIDs.ModelCompositeKeyArgumentName(sortKeys);
    return compoundExpression([
        applyCompositeKeyConditionExpression(sortKeys, queryExprReference, sortKeyArgumentName, sortKeyAttributeName)
    ])
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

function invalidArgumentError(err: string) {
    return raw(`$util.error("${err}", "InvalidArgumentsError")`);
}

function validateCompositeKeyArguments(keys: string[]) {
    const sortKeys = keys.slice(1);
    const hashKey = keys[0];
    const sortKeyArgumentName = ModelResourceIDs.ModelCompositeKeyArgumentName(sortKeys);
    const exprs: Expression[] = [
        iff(
            raw(`!$util.isNull($ctx.args.${sortKeyArgumentName}) && $util.isNullOrBlank($ctx.args.${hashKey})`),
            invalidArgumentError(`When providing argument '${sortKeyArgumentName}' you must also provide '${hashKey}'.`)
        )
    ];
    if (sortKeys.length > 1) {
        const loopOverKeys = (fn: (rKey: string, pKey: string) => Expression) => {
            const exprs = [];
            for (let index = sortKeys.length - 1; index > 0; index--) {
                const rightKey = sortKeys[index];
                const previousKey = sortKeys[index - 1];
                exprs.push(fn(rightKey, previousKey))
            }
            return compoundExpression(exprs);
        }
        const validateBetween = () => compoundExpression([
            iff(
                raw(`$ctx.args.${sortKeyArgumentName}.between.size() != 2`),
                invalidArgumentError(`Argument '${sortKeyArgumentName}.between' expects exactly two elements.`)
            ),
            loopOverKeys((rightKey: string, previousKey: string) => compoundExpression([
                iff(
                    raw(`!$util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.between[0].${rightKey}) && $util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.between[0].${previousKey})`),
                    invalidArgumentError(`When providing argument '${sortKeyArgumentName}.between[0].${rightKey}' you must also provide '${sortKeyArgumentName}.between[0].${previousKey}'.`)
                ),
                iff(
                    raw(`!$util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.between[1].${rightKey}) && $util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.between[1].${previousKey})`),
                    invalidArgumentError(`When providing argument '${sortKeyArgumentName}.between[1].${rightKey}' you must also provide '${sortKeyArgumentName}.between[1].${previousKey}'.`)
                )
            ]))
        ]);
        const validateOtherOperation = () => loopOverKeys((rightKey: string, previousKey: string) => iff(
            raw(`!$util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.get("$operation").${rightKey}) && $util.isNullOrBlank($ctx.args.${sortKeyArgumentName}.get("$operation").${previousKey})`),
            invalidArgumentError(`When providing argument '${sortKeyArgumentName}.$operation.${rightKey}' you must also provide '${sortKeyArgumentName}.$operation.${previousKey}'.`)
        ));
        exprs.push(
            iff(
                raw(`!$util.isNull($ctx.args.${sortKeyArgumentName})`),
                compoundExpression([
                    set(ref('sortKeyArgumentOperations'), raw(`$ctx.args.${sortKeyArgumentName}.keySet()`)),
                    iff(
                        raw(`$sortKeyArgumentOperations.size() > 1`),
                        invalidArgumentError(`Argument ${sortKeyArgumentName} must specify at most one key condition operation.`)
                    ),
                    forEach(ref('operation'), ref('sortKeyArgumentOperations'), [
                        ifElse(
                            raw(`$operation == "between"`),
                            validateBetween(),
                            validateOtherOperation()
                        )
                    ])
                ])
            )
        )
        return block('Validate key arguments.', exprs);
    } else {
        return newline();
    }
}
