"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("./ast");
var DynamoDBMappingTemplate = /** @class */ (function () {
    function DynamoDBMappingTemplate() {
    }
    /**
     * Create a put item resolver template.
     * @param keys A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    DynamoDBMappingTemplate.putItem = function (_a) {
        var key = _a.key, attributeValues = _a.attributeValues, condition = _a.condition;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: ast_1.str('PutItem'),
            key: key,
            attributeValues: attributeValues,
            condition: condition
        });
    };
    /**
     * Create a get item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    DynamoDBMappingTemplate.getItem = function (_a) {
        var key = _a.key;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: ast_1.str('GetItem'),
            key: key
        });
    };
    /**
     * Create a delete item resolver template.
     * @param key A list of strings pointing to the key value locations. E.G. ctx.args.x (note no $)
     */
    DynamoDBMappingTemplate.deleteItem = function (_a) {
        var key = _a.key;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: ast_1.str('DeleteItem'),
            key: key
        });
    };
    /**
     * Create an update item resolver template.
     * @param key
     */
    DynamoDBMappingTemplate.updateItem = function (_a) {
        var key = _a.key;
        var keyNames = key.attributes.map(function (attr) { return attr[0]; });
        return ast_1.compoundExpression([
            ast_1.set(ast_1.ref('expNames'), ast_1.obj({})),
            ast_1.set(ast_1.ref('expValues'), ast_1.obj({})),
            ast_1.set(ast_1.ref('expSet'), ast_1.obj({})),
            ast_1.set(ast_1.ref('expAdd'), ast_1.obj({})),
            ast_1.set(ast_1.ref('expRemove'), ast_1.list([])),
            ast_1.forEach(ast_1.ref('entry'), ast_1.ref("util.map.copyAndRemoveAllKeys($ctx.args.input, [" + keyNames.map(function (k) { return "\"" + k + "\""; }).join(', ') + "]).entrySet()"), [
                ast_1.ifElse(ast_1.ref('util.isNull($entry.value)'), ast_1.compoundExpression([
                    ast_1.set(ast_1.ref('discard'), ast_1.ref('expRemove.add("#${entry.key}")')),
                    ast_1.qref('$expNames.put("#${entry.key}", "${entry.key}")')
                ]), ast_1.compoundExpression([
                    ast_1.qref('$expSet.put("#${entry.key}", ":${entry.key}")'),
                    ast_1.qref('$expNames.put("#${entry.key}", "${entry.key}")'),
                    ast_1.qref('$expValues.put(":${entry.key}", $util.dynamodb.toDynamoDB($entry.value))')
                ]))
            ]),
            ast_1.set(ast_1.ref('expression'), ast_1.str('')),
            ast_1.iff(ast_1.raw('!$expSet.isEmpty()'), ast_1.compoundExpression([
                ast_1.set(ast_1.ref('expression'), ast_1.str('SET')),
                ast_1.forEach(ast_1.ref('entry'), ast_1.ref('expSet.entrySet()'), [
                    ast_1.set(ast_1.ref('expression'), ast_1.str('$expression $entry.key = $entry.value')),
                    ast_1.iff(ast_1.ref('foreach.hasNext()'), ast_1.set(ast_1.ref('expression'), ast_1.str('$expression,')))
                ])
            ])),
            ast_1.iff(ast_1.raw('!$expAdd.isEmpty()'), ast_1.compoundExpression([
                ast_1.set(ast_1.ref('expression'), ast_1.str('${expression} ADD')),
                ast_1.forEach(ast_1.ref('entry'), ast_1.ref('expAdd.entrySet()'), [
                    ast_1.set(ast_1.ref('expression'), ast_1.str('$expression $entry.key $entry.value')),
                    ast_1.iff(ast_1.ref('foreach.hasNext()'), ast_1.set(ast_1.ref('expression'), ast_1.str('$expression,')))
                ])
            ])),
            ast_1.iff(ast_1.raw('!$expRemove.isEmpty()'), ast_1.compoundExpression([
                ast_1.set(ast_1.ref('expression'), ast_1.str('${expression} REMOVE')),
                ast_1.forEach(ast_1.ref('entry'), ast_1.ref('expRemove'), [
                    ast_1.set(ast_1.ref('expression'), ast_1.str('$expression $entry')),
                    ast_1.iff(ast_1.ref('foreach.hasNext()'), ast_1.set(ast_1.ref('expression'), ast_1.str('$expression,')))
                ])
            ])),
            ast_1.set(ast_1.ref('update'), ast_1.obj({})),
            ast_1.qref('$update.put("expression", "$expression")'),
            ast_1.iff(ast_1.raw('!${expNames.isEmpty()}'), ast_1.qref('$update.put("expressionNames", $expNames)')),
            ast_1.iff(ast_1.raw('!${expValues.isEmpty()}'), ast_1.qref('$update.put("expressionValues", $expValues)')),
            ast_1.obj({
                version: ast_1.str('2017-02-28'),
                operation: ast_1.str('UpdateItem'),
                key: key,
                update: ast_1.ref('util.toJson($update)')
            })
        ]);
    };
    DynamoDBMappingTemplate.stringAttributeValue = function (value) {
        return {
            kind: 'Object', attributes: [
                ['S', { kind: 'Quotes', expr: value }]
            ]
        };
    };
    DynamoDBMappingTemplate.numericAttributeValue = function (value) {
        return {
            kind: 'Object', attributes: [
                ['N', { kind: 'Quotes', expr: value }]
            ]
        };
    };
    DynamoDBMappingTemplate.binaryAttributeValue = function (value) {
        return {
            kind: 'Object', attributes: [
                ['B', { kind: 'Quotes', expr: value }]
            ]
        };
    };
    return DynamoDBMappingTemplate;
}());
exports.DynamoDBMappingTemplate = DynamoDBMappingTemplate;
//# sourceMappingURL=dynamodb.js.map