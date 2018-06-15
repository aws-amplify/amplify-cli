"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var GraphQLTransform_1 = require("../GraphQLTransform");
var Transformer_1 = require("../Transformer");
var ValidObjectTransformer = /** @class */ (function (_super) {
    __extends(ValidObjectTransformer, _super);
    function ValidObjectTransformer() {
        var _this = _super.call(this, 'ValidObjectTransformer', 'directive @ObjectDirective on OBJECT') || this;
        _this.object = function (definition, directive, acc) {
            return;
        };
        return _this;
    }
    return ValidObjectTransformer;
}(Transformer_1.default));
var InvalidObjectTransformer = /** @class */ (function (_super) {
    __extends(InvalidObjectTransformer, _super);
    function InvalidObjectTransformer() {
        return _super.call(this, 'InvalidObjectTransformer', 'directive @ObjectDirective on OBJECT') || this;
    }
    return InvalidObjectTransformer;
}(Transformer_1.default));
test('Test graphql transformer validation happy case', function () {
    var validSchema = "type Post @ObjectDirective { id: ID! }";
    var transformer = new GraphQLTransform_1.default({
        transformers: [
            new ValidObjectTransformer()
        ]
    });
    var out = transformer.transform(validSchema);
    expect(out).toBeDefined();
});
test('Test graphql transformer validation. Transformer does not implement required method.', function () {
    var validSchema = "type Post @ObjectDirective { id: ID! }";
    var transformer = new GraphQLTransform_1.default({
        transformers: [
            new InvalidObjectTransformer()
        ]
    });
    try {
        transformer.transform(validSchema);
    }
    catch (e) {
        expect(e.name).toEqual('InvalidTransformerError');
    }
});
test('Test graphql transformer validation. Unknown directive.', function () {
    var invalidSchema = "type Post @UnknownDirective { id: ID! }";
    var transformer = new GraphQLTransform_1.default({
        transformers: [
            new InvalidObjectTransformer()
        ]
    });
    try {
        transformer.transform(invalidSchema);
    }
    catch (e) {
        expect(e.name).toEqual('UnknownDirectiveError');
    }
});
//# sourceMappingURL=GraphQLTransform.test.js.map