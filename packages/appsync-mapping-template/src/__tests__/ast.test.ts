import { ref, obj, str, forEach, qref, set, compoundExpression } from '../ast'
import { DynamoDBMappingTemplate } from '../dynamodb'
import { print } from '../print'

test('create a put item resolver with the ast', () => {
    const resolver = DynamoDBMappingTemplate.putItem({
        key: obj({
            type: str('Post'),
            id: ref('util.autoId()')
        }),
        attributeValues: obj({
            value: ref(`util.dynamodb.toMapJson(\${ctx.input})`)
        })
    })
    const template = print(resolver)
    expect(template).toBeDefined()
});

test('create a response mapping template that merges a nested object', () => {
    const setResult = set(ref('result'), ref('util.map.copyAndRemoveAllKeys($context.result, ["value"])'))
    const mergeLoop = forEach(ref('entry'), ref('context.result.value.entrySet()'), [
        qref('$result.put($entry.key, $entry.value)')
    ]);
    const returnStatement = ref('util.toJson($result)')
    const template = print(compoundExpression([setResult, mergeLoop, returnStatement]))
    expect(template).toBeDefined()
})