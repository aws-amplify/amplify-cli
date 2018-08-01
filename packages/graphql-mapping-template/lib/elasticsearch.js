"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_1 = require("./ast");
var ElasticSearchMappingTemplate = /** @class */ (function () {
    function ElasticSearchMappingTemplate() {
    }
    /**
     * Create a mapping template for ES.
     */
    ElasticSearchMappingTemplate.genericTemplte = function (_a) {
        var operation = _a.operation, path = _a.path, params = _a.params;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: operation,
            path: path,
            params: params
        });
    };
    /**
     * Create a search item resolver template.
     * @param size the size limit
     * @param from the next token
     * @param query the query
     */
    ElasticSearchMappingTemplate.searchItem = function (_a) {
        var query = _a.query, size = _a.size, from = _a.from, path = _a.path, sort = _a.sort;
        return ast_1.obj({
            version: ast_1.str('2017-02-28'),
            operation: ast_1.str('GET'),
            path: path,
            params: ast_1.obj({
                body: ast_1.obj({
                    from: from,
                    size: size,
                    sort: sort,
                    query: query
                })
            })
        });
    };
    return ElasticSearchMappingTemplate;
}());
exports.ElasticSearchMappingTemplate = ElasticSearchMappingTemplate;
//# sourceMappingURL=elasticsearch.js.map