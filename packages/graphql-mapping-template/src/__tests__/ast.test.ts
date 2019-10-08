import { ref, obj, str, forEach, qref, set, compoundExpression, ifElse, nul, bool } from '../ast';
import { DynamoDBMappingTemplate } from '../dynamodb';
import { print } from '../print';

test('create a put item resolver with the ast', () => {
  const resolver = DynamoDBMappingTemplate.putItem({
    key: obj({
      type: str('Post'),
      id: ref('util.autoId()'),
    }),
    attributeValues: obj({
      value: ref(`util.dynamodb.toMapJson(\${ctx.input})`),
    }),
  });
  const template = print(resolver);
  expect(template).toBeDefined();
});

test('create a query resolver with the ast', () => {
  const resolver = DynamoDBMappingTemplate.query({
    query: obj({
      expression: str('#typename = :typename'),
      expressionNames: obj({
        '#typename': str('__typename'),
      }),
      expressionValues: obj({
        ':typename': obj({
          S: str('test'),
        }),
      }),
    }),
    scanIndexForward: bool(true),
    filter: ifElse(ref('context.args.filter'), ref('util.transform.toDynamoDBFilterExpression($ctx.args.filter)'), nul()),
    limit: ref('limit'),
    nextToken: ifElse(ref('context.args.nextToken'), str('$context.args.nextToken'), nul()),
  });
  const template = print(resolver);
  expect(template).toBeDefined();
});

test('create a response mapping template that merges a nested object', () => {
  const setResult = set(ref('result'), ref('util.map.copyAndRemoveAllKeys($context.result, ["value"])'));
  const mergeLoop = forEach(ref('entry'), ref('context.result.value.entrySet()'), [qref('$result.put($entry.key, $entry.value)')]);
  const returnStatement = ref('util.toJson($result)');
  const template = print(compoundExpression([setResult, mergeLoop, returnStatement]));
  expect(template).toBeDefined();
});
