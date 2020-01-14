import {
  obj,
  ref,
  Expression,
  ReferenceNode,
  StringNode,
  str,
  ObjectNode,
  compoundExpression,
  set,
  list,
  forEach,
  ifElse,
  qref,
  iff,
  raw,
  CompoundExpressionNode,
} from './ast';

const RESOLVER_VERSION_ID = '2017-02-28';

export class DynamoDBMappingTemplate {
  /**
   * Create a put item resolver template.
   * @param keys A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
   */
  public static putItem(
    {
      key,
      attributeValues,
      condition,
    }: {
      key: ObjectNode | Expression;
      attributeValues: Expression;
      condition?: ObjectNode | ReferenceNode;
    },
    version: string = RESOLVER_VERSION_ID
  ): ObjectNode {
    return obj({
      version: str(version),
      operation: str('PutItem'),
      key,
      attributeValues,
      condition,
    });
  }

  /**
   * Create a get item resolver template.
   * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
   */
  public static getItem({ key, isSyncEnabled }: { key: ObjectNode | Expression; isSyncEnabled?: boolean }): ObjectNode {
    let version = RESOLVER_VERSION_ID;
    if (isSyncEnabled) {
      version = '2018-05-29';
    }
    return obj({
      version: str(version),
      operation: str('GetItem'),
      key,
    });
  }

  /**
   * Create a query resolver template.
   * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
   */
  public static query({
    query,
    scanIndexForward,
    filter,
    limit,
    nextToken,
    index,
    isSyncEnabled,
  }: {
    query: ObjectNode | Expression;
    scanIndexForward: Expression;
    filter: ObjectNode | Expression;
    limit: Expression;
    nextToken?: Expression;
    index?: StringNode;
    isSyncEnabled?: boolean;
  }): ObjectNode {
    const version = isSyncEnabled ? '2018-05-29' : RESOLVER_VERSION_ID;

    return obj({
      version: str(version),
      operation: str('Query'),
      query,
      scanIndexForward,
      filter,
      limit,
      ...(nextToken ? { nextToken } : {}),
      ...(index ? { index } : {}),
    });
  }

  /**
   * Create a list item resolver template.
   * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
   */
  public static listItem(
    {
      filter,
      limit,
      nextToken,
      scanIndexForward,
      query,
      index,
    }: {
      filter: ObjectNode | Expression;
      limit: Expression;
      nextToken?: Expression;
      scanIndexForward?: Expression;
      query?: ObjectNode | Expression;
      index?: StringNode;
    },
    version: string = RESOLVER_VERSION_ID
  ): ObjectNode {
    return obj({
      version: str(version),
      operation: str('Scan'),
      filter,
      limit,
      nextToken,
      query,
      index,
      scanIndexForward,
    });
  }

  /**
   * Creates a sync resolver template
   * @param param An object used when creating the operation request to appsync
   */
  public static syncItem({
    filter,
    limit,
    nextToken,
    lastSync,
  }: {
    filter?: ObjectNode | Expression;
    limit?: Expression;
    nextToken?: Expression;
    lastSync?: Expression;
  }): ObjectNode {
    return obj({
      version: str('2018-05-29'),
      operation: str('Sync'),
      limit,
      nextToken,
      lastSync,
      filter,
    });
  }

  /**
   * Create a delete item resolver template.
   * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
   */
  public static deleteItem({
    key,
    condition,
    isSyncEnabled,
  }: {
    key: ObjectNode | Expression;
    condition: ObjectNode | ReferenceNode;
    isSyncEnabled: boolean;
  }): ObjectNode {
    const version: string = isSyncEnabled ? '2018-05-29' : RESOLVER_VERSION_ID;

    return obj({
      version: str(version),
      operation: str('DeleteItem'),
      key,
      condition,
      ...(isSyncEnabled && { _version: ref('util.defaultIfNull($ctx.args.input["_version"], "0")') }),
    });
  }

  /**
   * Create an update item resolver template.
   * @param key
   */
  public static updateItem({
    key,
    condition,
    objectKeyVariable,
    nameOverrideMap,
    isSyncEnabled,
  }: {
    key: ObjectNode | Expression;
    condition: ObjectNode | ReferenceNode;
    objectKeyVariable: string;
    nameOverrideMap?: string;
    isSyncEnabled?: boolean;
  }): CompoundExpressionNode {
    // const keyFields = key.attributes.map((attr: [string, Expression]) => attr[0])
    // Auto timestamp
    // qref('$input.put("updatedAt", "$util.time.nowISO8601()")'),
    const entryKeyAttributeNameVar = 'entryKeyAttributeName';
    let keyFields: StringNode[] = [str('id')];
    let version = RESOLVER_VERSION_ID;
    // sync changes made to the resolver
    if (isSyncEnabled) {
      keyFields = [...keyFields, str('_version'), str('_deleted'), str('_lastChangedAt')];
      version = '2018-05-29';
    }
    const handleRename = (keyVar: string) =>
      ifElse(
        raw(`!$util.isNull($${nameOverrideMap}) && $${nameOverrideMap}.containsKey("${keyVar}")`),
        set(ref(entryKeyAttributeNameVar), raw(`$${nameOverrideMap}.get("${keyVar}")`)),
        set(ref(entryKeyAttributeNameVar), raw(keyVar))
      );
    return compoundExpression([
      set(ref('expNames'), obj({})),
      set(ref('expValues'), obj({})),
      set(ref('expSet'), obj({})),
      set(ref('expAdd'), obj({})),
      set(ref('expRemove'), list([])),
      ifElse(
        ref(objectKeyVariable),
        compoundExpression([
          set(ref('keyFields'), list([])),
          forEach(ref('entry'), ref(`${objectKeyVariable}.entrySet()`), [qref('$keyFields.add("$entry.key")')]),
        ]),
        set(ref('keyFields'), list(keyFields))
      ),
      forEach(ref('entry'), ref(`util.map.copyAndRemoveAllKeys($context.args.input, $keyFields).entrySet()`), [
        handleRename('$entry.key'),
        ifElse(
          ref('util.isNull($entry.value)'),
          compoundExpression([
            set(ref('discard'), ref(`expRemove.add("#$${entryKeyAttributeNameVar}")`)),
            qref(`$expNames.put("#$${entryKeyAttributeNameVar}", "$entry.key")`),
          ]),
          compoundExpression([
            qref(`$expSet.put("#$${entryKeyAttributeNameVar}", ":$${entryKeyAttributeNameVar}")`),
            qref(`$expNames.put("#$${entryKeyAttributeNameVar}", "$entry.key")`),
            qref(`$expValues.put(":$${entryKeyAttributeNameVar}", $util.dynamodb.toDynamoDB($entry.value))`),
          ])
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
        ])
      ),
      iff(
        raw('!$expAdd.isEmpty()'),
        compoundExpression([
          set(ref('expression'), str('$expression ADD')),
          forEach(ref('entry'), ref('expAdd.entrySet()'), [
            set(ref('expression'), str('$expression $entry.key $entry.value')),
            iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,'))),
          ]),
        ])
      ),
      iff(
        raw('!$expRemove.isEmpty()'),
        compoundExpression([
          set(ref('expression'), str('$expression REMOVE')),
          forEach(ref('entry'), ref('expRemove'), [
            set(ref('expression'), str('$expression $entry')),
            iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,'))),
          ]),
        ])
      ),
      set(ref('update'), obj({})),
      qref('$update.put("expression", "$expression")'),
      iff(raw('!$expNames.isEmpty()'), qref('$update.put("expressionNames", $expNames)')),
      iff(raw('!$expValues.isEmpty()'), qref('$update.put("expressionValues", $expValues)')),
      obj({
        version: str(version),
        operation: str('UpdateItem'),
        key,
        update: ref('util.toJson($update)'),
        condition,
        ...(isSyncEnabled && { _version: ref('util.defaultIfNull($ctx.args.input["_version"], "0")') }),
      }),
    ]);
  }

  public static dynamoDBResponse(
    expression: Expression = ref('util.error($ctx.error.message, $ctx.error.type, $ctx.result)')
  ): CompoundExpressionNode {
    return compoundExpression([ifElse(ref('ctx.error'), expression, ref('util.toJson($ctx.result)'))]);
  }

  public static stringAttributeValue(value: Expression): ObjectNode {
    return {
      kind: 'Object',
      attributes: [['S', { kind: 'Quotes', expr: value }]],
    };
  }

  public static numericAttributeValue(value: Expression): ObjectNode {
    return {
      kind: 'Object',
      attributes: [['N', { kind: 'Quotes', expr: value }]],
    };
  }

  public static binaryAttributeValue(value: Expression): ObjectNode {
    return {
      kind: 'Object',
      attributes: [['B', { kind: 'Quotes', expr: value }]],
    };
  }

  public static paginatedResponse(): ObjectNode {
    return obj({
      items: ref('util.toJson($ctx.result.items)'),
      nextToken: ref('util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))'),
    });
  }
}
