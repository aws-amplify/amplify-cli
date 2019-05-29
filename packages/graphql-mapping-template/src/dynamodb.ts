import {
    obj, ref, Expression, ReferenceNode, StringNode,
    IntNode, FloatNode, str, ObjectNode, compoundExpression,
    set, list, forEach, ifElse, qref, iff, raw,
    CompoundExpressionNode
} from './ast';

export class DynamoDBMappingTemplate {
    /**
     * Create a put item resolver template.
     * @param keys A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    public static putItem({ key, attributeValues, condition }: {
        key: ObjectNode | Expression,
        attributeValues: Expression,
        condition?: ObjectNode
    }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('PutItem'),
            key,
            attributeValues,
            condition
        })
    }

    /**
     * Create a get item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    public static getItem({ key }: {
        key: ObjectNode | Expression
    }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('GetItem'),
            key
        })
    }

    /**
     * Create a query resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    public static query({ query, filter, scanIndexForward, limit, nextToken, index }: {
        query: ObjectNode | Expression;
        scanIndexForward: Expression;
        filter: ObjectNode | Expression;
        limit: Expression;
        nextToken?: Expression;
        index?: StringNode;
    }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('Query'),
            query,
            scanIndexForward,
            filter,
            limit,
            nextToken,
            index
        })
    }

    /**
     * Create a list item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    public static listItem({ filter, limit, nextToken, scanIndexForward, query, index }: {
        filter: ObjectNode | Expression,
        limit: Expression,
        nextToken?: Expression,
        scanIndexForward?: Expression;
        query?: ObjectNode | Expression,
        index?: StringNode,
    }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('Scan'),
            filter,
            limit,
            nextToken,
            query,
            index,
            scanIndexForward,
        })
    }

    /**
     * Create a delete item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    public static deleteItem({ key, condition }: {
        key: ObjectNode | Expression,
        condition: ObjectNode | ReferenceNode
    }): ObjectNode {
        return obj({
            version: str('2017-02-28'),
            operation: str('DeleteItem'),
            key,
            condition,
        })
    }

    /**
     * Create an update item resolver template.
     * @param key
     */
    public static updateItem({ key, condition, objectKeyVariable, nameOverrideMap }: {
        key: ObjectNode | Expression,
        condition: ObjectNode | ReferenceNode,
        objectKeyVariable: string,
        nameOverrideMap?: string
    }): CompoundExpressionNode {
        // const keyFields = key.attributes.map((attr: [string, Expression]) => attr[0])
        // Auto timestamp
        // qref('$input.put("updatedAt", "$util.time.nowISO8601()")'),
        const entryKeyAttributeNameVar = 'entryKeyAttributeName';
        const handleRename = (keyVar: string) => ifElse(
            raw(`!$util.isNull($${nameOverrideMap}) && $${nameOverrideMap}.containsKey("${keyVar}")`),
            set(ref(entryKeyAttributeNameVar), raw(`$${nameOverrideMap}.get("${keyVar}")`)),
            set(ref(entryKeyAttributeNameVar), raw(keyVar)),
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
                    forEach(ref('entry'), ref(`${objectKeyVariable}.entrySet()`),[
                        qref('$keyFields.add("$entry.key")')
                    ]),
                ]),
                set(ref('keyFields'), list([str('id')])),
            ),
            forEach(
                ref('entry'),
                ref(`util.map.copyAndRemoveAllKeys($context.args.input, $keyFields).entrySet()`),
                [
                    handleRename('$entry.key'),
                    ifElse(
                        ref('util.isNull($entry.value)'),
                        compoundExpression([
                            set(ref('discard'), ref(`expRemove.add("#$${entryKeyAttributeNameVar}")`)),
                            qref(`$expNames.put("#$${entryKeyAttributeNameVar}", "$entry.key")`)
                        ]),
                        compoundExpression([
                            qref(`$expSet.put("#$${entryKeyAttributeNameVar}", ":$${entryKeyAttributeNameVar}")`),
                            qref(`$expNames.put("#$${entryKeyAttributeNameVar}", "$entry.key")`),
                            qref(`$expValues.put(":$${entryKeyAttributeNameVar}", $util.dynamodb.toDynamoDB($entry.value))`)
                        ])
                    )
                ]
            ),
            set(ref('expression'), str('')),
            iff(raw('!$expSet.isEmpty()'), compoundExpression([
                set(ref('expression'), str('SET')),
                forEach(ref('entry'), ref('expSet.entrySet()'), [
                    set(ref('expression'), str('$expression $entry.key = $entry.value')),
                    iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,')))
                ])
            ])),
            iff(raw('!$expAdd.isEmpty()'), compoundExpression([
                set(ref('expression'), str('$expression ADD')),
                forEach(ref('entry'), ref('expAdd.entrySet()'), [
                    set(ref('expression'), str('$expression $entry.key $entry.value')),
                    iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,')))
                ])
            ])),
            iff(raw('!$expRemove.isEmpty()'), compoundExpression([
                set(ref('expression'), str('$expression REMOVE')),
                forEach(ref('entry'), ref('expRemove'), [
                    set(ref('expression'), str('$expression $entry')),
                    iff(ref('foreach.hasNext()'), set(ref('expression'), str('$expression,')))
                ])
            ])),
            set(ref('update'), obj({})),
            qref('$update.put("expression", "$expression")'),
            iff(
                raw('!$expNames.isEmpty()'),
                qref('$update.put("expressionNames", $expNames)')
            ),
            iff(
                raw('!$expValues.isEmpty()'),
                qref('$update.put("expressionValues", $expValues)')
            ),
            obj({
                version: str('2017-02-28'),
                operation: str('UpdateItem'),
                key,
                update: ref('util.toJson($update)'),
                condition
            })
        ])
    }

    public static stringAttributeValue(value: Expression): ObjectNode {
        return {
            kind: 'Object', attributes: [
                ['S', { kind: 'Quotes', expr: value }]
            ]
        };
    }

    public static numericAttributeValue(value: Expression): ObjectNode {
        return {
            kind: 'Object', attributes: [
                ['N', { kind: 'Quotes', expr: value }]
            ]
        };
    }

    public static binaryAttributeValue(value: Expression): ObjectNode {
        return {
            kind: 'Object', attributes: [
                ['B', { kind: 'Quotes', expr: value }]
            ]
        };
    }

    public static paginatedResponse(): ObjectNode {
        return obj({
            items: ref('util.toJson($ctx.result.items)'),
            nextToken: ref('util.toJson($util.defaultIfNullOrBlank($context.result.nextToken, null))')
        })
    }
}
