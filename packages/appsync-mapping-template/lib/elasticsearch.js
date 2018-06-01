"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("./ast");
var ElasticSearchMappingTemplate = /** @class */ (function () {
    function ElasticSearchMappingTemplate() {
    }
    ElasticSearchMappingTemplate.search = function (_a) {
        var body = _a.body, pathRef = _a.pathRef;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: ast_1.str('GET'),
            path: ast_1.str("$" + pathRef + ".toLowerCase()"),
            params: ast_1.obj({
                body: body
            })
        });
    };
    return ElasticSearchMappingTemplate;
}());
exports.ElasticSearchMappingTemplate = ElasticSearchMappingTemplate;
//# sourceMappingURL=elasticsearch.js.map