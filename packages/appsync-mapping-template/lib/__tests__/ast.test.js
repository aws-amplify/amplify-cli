"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("../ast");
var dynamodb_1 = require("../dynamodb");
var print_1 = require("../print");
test('create a put item resolver with the ast', function () {
    var resolver = dynamodb_1.DynamoDBMappingTemplate.putItem({
        key: ast_1.obj({
            type: ast_1.str('Post'),
            id: ast_1.ref('util.autoId()')
        }),
        attributeValues: ast_1.obj({
            value: ast_1.ref("util.dynamodb.toMapJson(${ctx.input})")
        })
    });
    var template = print_1.print(resolver);
    console.log(template);
    expect(template).toBeDefined();
});
test('create a response mapping template that merges a nested object', function () {
    var setResult = ast_1.set(ast_1.ref('result'), ast_1.ref('util.map.copyAndRemoveAllKeys($context.result, ["value"])'));
    var mergeLoop = ast_1.forEach(ast_1.ref('entry'), ast_1.ref('context.result.value.entrySet()'), [
        ast_1.qref('$result.put($entry.key, $entry.value)')
    ]);
    var returnStatement = ast_1.ref('util.toJson($result)');
    var template = print_1.print(ast_1.compoundExpression([setResult, mergeLoop, returnStatement]));
    console.log(template);
    expect(template).toBeDefined();
});
//# sourceMappingURL=ast.test.js.map