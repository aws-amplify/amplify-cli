import {
  StringNode,
  str,
  Expression,
  comment,
  set,
  ref,
  methodCall,
  obj,
  qref,
  list,
  ifElse,
  compoundExpression,
  forEach,
  iff,
  raw,
  bool,
  toJson,
  printBlock,
} from 'graphql-mapping-template';
import { ModelDirectiveConfiguration } from '../graphql-model-transformer';
import { generateConditionSlot } from './common';

/**
 * Generates VTL template in update mutation
 * @param modelName Name of the model
 */
export const generateUpdateRequestTemplate = (modelName: string, isSyncEnabled: boolean): string => {
  const objectKeyVariable = 'ctx.stash.metadata.modelObjectKey';
  const keyFields: StringNode[] = [str('id')];
  if (isSyncEnabled) {
    keyFields.push(str('_version'));
    keyFields.push(str('_deleted'));
    keyFields.push(str('_lastChangedAt'));
  }
  const statements: Expression[] = [
    comment('Set the default values to put request'),
    set(ref('mergedValues'), methodCall(ref('util.defaultIfNull'), ref('ctx.stash.defaultValues'), obj({}))),
    comment('copy the values from input'),
    qref(methodCall(ref('mergedValues.putAll'), methodCall(ref('util.defaultIfNull'), ref('ctx.args.input'), obj({})))),
    comment('set the typename'),
    // Initialize object as placeholder for expressions
    comment('Initialize the vars for creating ddb expression'),
    set(ref('expNames'), obj({})),
    set(ref('expValues'), obj({})),
    set(ref('expSet'), obj({})),
    set(ref('expAdd'), obj({})),
    set(ref('expRemove'), list([])),

    ifElse(
      ref(objectKeyVariable),
      set(ref('Key'), ref(objectKeyVariable)),
      set(ref('Key'), obj({ id: methodCall(ref('util.dynamodb.toDynamoDB'), ref('ctx.args.input.id')) })),
    ),
    comment('Model key'),
    ifElse(
      ref(objectKeyVariable),
      compoundExpression([
        set(ref('keyFields'), isSyncEnabled ? list([str('_version'), str('_deleted'), str('_lastChangedAt')]) : list([])),
        forEach(ref('entry'), ref(`${objectKeyVariable}.entrySet()`), [qref('$keyFields.add("$entry.key")')]),
      ]),
      set(ref('keyFields'), list(keyFields)),
    ),

    forEach(ref('entry'), ref(`util.map.copyAndRemoveAllKeys($mergedValues, $keyFields).entrySet()`), [
      ifElse(
        raw(
          '!$util.isNull($ctx.stash.metadata.dynamodbNameOverrideMap) && $ctx.stash.metadata.dynamodbNameOverrideMap.containsKey("$entry.key")',
        ),
        set(ref('entryKeyAttributeName'), raw('$ctx.stash.metadata.dynamodbNameOverrideMap.get("$entry.key")')),
        set(ref('entryKeyAttributeName'), raw('$entry.key')),
      ),
      ifElse(
        ref('util.isNull($entry.value)'),
        compoundExpression([
          set(ref('discard'), ref(`expRemove.add("#$entryKeyAttributeName")`)),
          qref(`$expNames.put("#$entryKeyAttributeName", "$entry.key")`),
        ]),
        compoundExpression([
          qref('$expSet.put("#$entryKeyAttributeName", ":$entryKeyAttributeName")'),
          qref('$expNames.put("#$entryKeyAttributeName", "$entry.key")'),
          qref('$expValues.put(":$entryKeyAttributeName", $util.dynamodb.toDynamoDB($entry.value))'),
        ]),
      ),
    ]),
    set(ref('expression'), str('')),
    iff(
      raw('!$expSet.isEmpty()'),
      compoundExpression([
        set(ref('expression'), str('SET')),
        forEach(ref('entry'), ref('expSet.entrySet()'), [
          set(ref('expression'), str('$expression $entry.key = $entry.value')),
          iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,'))),
        ]),
      ]),
    ),
    iff(
      raw('!$expAdd.isEmpty()'),
      compoundExpression([
        set(ref('expression'), str('$expression ADD')),
        forEach(ref('entry'), ref('expAdd.entrySet()'), [
          set(ref('expression'), str('$expression $entry.key $entry.value')),
          iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,'))),
        ]),
      ]),
    ),
    iff(
      raw('!$expRemove.isEmpty()'),
      compoundExpression([
        set(ref('expression'), str('$expression REMOVE')),
        forEach(ref('entry'), ref('expRemove'), [
          set(ref('expression'), str('$expression $entry')),
          iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,'))),
        ]),
      ]),
    ),
    set(ref('update'), obj({})),
    qref('$update.put("expression", "$expression")'),
    iff(raw('!$expNames.isEmpty()'), qref('$update.put("expressionNames", $expNames)')),
    iff(raw('!$expValues.isEmpty()'), qref('$update.put("expressionValues", $expValues)')),
    // add conditions
    // set key the condition
    ...generateKeyConditionTemplate(true),
    iff(ref('context.args.condition'), qref(methodCall(ref('ctx.stash.conditions.add'), ref('context.args.condition')))),
    // Generate conditions
    generateConditionSlot('ctx.stash.conditions', 'Conditions'),
    set(
      ref('UpdateItem'),
      obj({
        version: str('2018-05-29'),
        operation: str('UpdateItem'),
        key: ref('Key'),
        update: ref('update'),
        ...(isSyncEnabled && { _version: ref('util.defaultIfNull($ctx.args.input["_version"], "0")') }),
      }),
    ),
    iff(
      ref('Conditions'),
      compoundExpression([
        iff(ref('keyConditionExprNames'), qref(methodCall(ref('Conditions.expressionNames.putAll'), ref('keyConditionExprNames')))),
        qref(methodCall(ref('UpdateItem.put'), str('condition'), ref('Conditions'))),
      ]),
    ),
    toJson(ref('UpdateItem')),
  ];
  return printBlock(`${modelName} Update resolver`)(compoundExpression(statements));
};

/**
 * Generates VTL template in create mutation
 * @param modelName Name of the model
 */
export const generateCreateRequestTemplate = (modelName: string): string => {
  const statements: Expression[] = [
    // Generate conditions
    comment('Set the default values to put request'),
    set(ref('mergedValues'), methodCall(ref('util.defaultIfNull'), ref('ctx.stash.defaultValues'), obj({}))),
    comment('copy the values from input'),
    qref(methodCall(ref('mergedValues.putAll'), methodCall(ref('util.defaultIfNull'), ref('ctx.args.input'), obj({})))),
    comment('set the typename'),
    qref(methodCall(ref('mergedValues.put'), str('__typename'), str(modelName))),

    // Set PutObject
    set(
      ref('PutObject'),
      obj({
        version: str('2018-05-29'),
        operation: str('PutItem'),
        attributeValues: methodCall(ref('util.dynamodb.toMapValues'), ref('mergedValues')),
        condition: ref('condition'),
      }),
    ),

    // add conditions
    iff(ref('context.args.condition'), qref(methodCall(ref('ctx.stash.conditions.add'), ref('context.args.condition')))),
    // key conditions
    ...generateKeyConditionTemplate(false),
    // Generate conditions
    generateConditionSlot('ctx.stash.conditions', 'Conditions'),
    iff(
      ref('Conditions'),
      compoundExpression([
        iff(ref('keyConditionExprNames'), qref(methodCall(ref('Conditions.expressionNames.putAll'), ref('keyConditionExprNames')))),
        qref(methodCall(ref('PutObject.put'), str('condition'), ref('Conditions'))),
      ]),
    ),
    ifElse(
      ref('ctx.stash.metadata.modelObjectKey'),
      qref(methodCall(ref('PutObject.put'), str('key'), ref('ctx.stash.metadata.modelObjectKey'))),
      compoundExpression([
        set(
          ref('Key'),
          obj({
            id: methodCall(ref('util.dynamodb.toDynamoDB'), ref('mergedValues.id')),
          }),
        ),
        qref(methodCall(ref('PutObject.put'), str('key'), ref('Key'))),
      ]),
    ),
    toJson(ref('PutObject')),
  ];
  return printBlock('Create Request template')(compoundExpression(statements));
};

/**
 * Generate mapping template that sets default values for create mutation
 * @param name modelName
 * @param modelConfig directive configuration
 */
export const generateCreateInitSlotTemplate = (name: string, modelConfig: ModelDirectiveConfiguration): string => {
  const statements: Expression[] = [
    // initalize defaultVaules
    qref(
      methodCall(
        ref('ctx.stash.put'),
        str('defaultValues'),
        methodCall(ref('util.defaultIfNull'), ref('ctx.stash.defaultValues'), obj({})),
      ),
    ),
  ];

  if (modelConfig?.timestamps) {
    statements.push(set(ref('createdAt'), methodCall(ref('util.time.nowISO8601'))));
    statements.push(qref(methodCall(ref('ctx.stash.defaultValues.put'), str('id'), methodCall(ref('util.autoId')))));
    if (modelConfig.timestamps.createdAt) {
      statements.push(qref(methodCall(ref('ctx.stash.defaultValues.put'), str(modelConfig.timestamps.createdAt), ref('createdAt'))));
    }
    if (modelConfig.timestamps.updatedAt) {
      statements.push(qref(methodCall(ref('ctx.stash.defaultValues.put'), str(modelConfig.timestamps.updatedAt), ref('createdAt'))));
    }
  }
  statements.push(
    toJson(
      obj({
        version: str('2018-05-29'),
        payload: obj({}),
      }),
    ),
  );
  return printBlock('Initialization default values')(compoundExpression(statements));
};
/**
 * Generates VTL template in delete mutation
 *
 */
export const generateDeleteRequestTemplate = (isSyncEnabled: boolean): string => {
  const statements: Expression[] = [
    set(
      ref('DeleteRequest'),
      obj({
        version: str('2018-05-29'),
        operation: str('DeleteItem'),
      }),
    ),
    ifElse(
      ref('ctx.stash.metadata.modelObjectKey'),
      set(ref('Key'), ref('ctx.stash.metadata.modelObjectKey')),
      set(ref('Key'), obj({ id: methodCall(ref('util.dynamodb.toDynamoDB'), ref('ctx.args.input.id')) })),
    ),
    qref(methodCall(ref('DeleteRequest.put'), str('key'), ref('Key'))),
    ...generateKeyConditionTemplate(true),
    iff(ref('context.args.condition'), qref(methodCall(ref('ctx.stash.conditions.add'), ref('context.args.condition')))),
    // Generate conditions
    generateConditionSlot('ctx.stash.conditions', 'Conditions'),
    iff(
      ref('Conditions'),
      compoundExpression([
        iff(ref('keyConditionExprNames'), qref(methodCall(ref('Conditions.expressionNames.putAll'), ref('keyConditionExprNames')))),
        qref(methodCall(ref('DeleteRequest.put'), str('condition'), ref('Conditions'))),
      ]),
    ),
  ];
  if (isSyncEnabled) {
    statements.push(
      qref(methodCall(ref('DeleteRequest.put'), str('_version'), ref('util.defaultIfNull($ctx.args.input["_version"], "0")'))),
    );
  }

  statements.push(toJson(ref('DeleteRequest')));

  return printBlock('Delete Request template')(compoundExpression(statements));
};

/**
 * Generate VTL template that sets the default values for Update mutation
 * @param modelName Name of the model
 * @param modelConfig model directive configuration
 */
export const generateUpdateInitSlotTemplate = (modelName: string, modelConfig: ModelDirectiveConfiguration): string => {
  const statements: Expression[] = [
    // initalize defaultVaules
    qref(
      methodCall(
        ref('ctx.stash.put'),
        str('defaultValues'),
        methodCall(ref('util.defaultIfNull'), ref('ctx.stash.defaultValues'), obj({})),
      ),
    ),
  ];
  if (modelConfig?.timestamps) {
    if (modelConfig.timestamps.updatedAt) {
      statements.push(set(ref('updatedAt'), methodCall(ref('util.time.nowISO8601'))));
      statements.push(qref(methodCall(ref('ctx.stash.defaultValues.put'), str(modelConfig.timestamps.updatedAt), ref('updatedAt'))));
    }
  }
  statements.push(
    toJson(
      obj({
        version: str('2018-05-29'),
        payload: obj({}),
      }),
    ),
  );
  return printBlock('Initialization default values')(compoundExpression(statements));
};

export function generateApplyDefaultsToInputTemplate(target: string): Expression {
  return compoundExpression([
    set(ref(target), methodCall(ref('util.defaultIfNull'), ref('ctx.stash.defaultValues'), obj({}))),
    qref(methodCall(ref(`${target}.putAll`), methodCall(ref('util.defaultIfNull'), ref('ctx.args.input'), obj({})))),
  ]);
}

function generateKeyConditionTemplate(attributeExistsValue: boolean): Expression[] {
  const statements: Expression[] = [
    comment('Begin - key condition'),
    ifElse(
      ref('ctx.stash.metadata.modelObjectKey'),
      compoundExpression([
        set(ref('keyConditionExpr'), obj({})),
        set(ref('keyConditionExprNames'), obj({})),
        forEach(ref('entry'), ref('ctx.stash.metadata.modelObjectKey.entrySet()'), [
          qref(
            methodCall(
              ref('keyConditionExpr.put'),
              str('keyCondition$velocityCount'),
              obj({ attributeExists: bool(attributeExistsValue) }),
            ),
          ),
          qref(methodCall(ref('keyConditionExprNames.put'), str('#keyCondition$velocityCount'), str('$entry.key'))),
        ]),
        qref(methodCall(ref('ctx.stash.conditions.add'), ref('keyConditionExpr'))),
      ]),
      compoundExpression([
        qref(methodCall(ref('ctx.stash.conditions.add'), obj({ id: obj({ attributeExists: bool(attributeExistsValue) }) }))),
      ]),
    ),
    comment('End - key condition'),
  ];

  return statements;
}
