"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var blankTemplate_1 = require("./util/blankTemplate");
/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
var TransformerContext = /** @class */ (function () {
    function TransformerContext() {
        this.template = blankTemplate_1.default();
        this.nodeMap = {};
    }
    TransformerContext.prototype.mergeResources = function (resources) {
        for (var _i = 0, _a = Object.keys(resources); _i < _a.length; _i++) {
            var resourceId = _a[_i];
            if (this.template.Resources[resourceId]) {
                throw new Error("Conflicting CloudFormation resource logical id: " + resourceId);
            }
        }
        this.template.Resources = __assign({}, this.template.Resources, resources);
    };
    TransformerContext.prototype.mergeParameters = function (params) {
        for (var _i = 0, _a = Object.keys(params); _i < _a.length; _i++) {
            var parameterName = _a[_i];
            if (this.template.Parameters[parameterName]) {
                throw new Error("Conflicting CloudFormation parameter name: " + parameterName);
            }
        }
        this.template.Parameters = __assign({}, this.template.Parameters, params);
    };
    TransformerContext.prototype.getResource = function (resource) {
        return this.template.Resources[resource];
    };
    TransformerContext.prototype.setResource = function (key, resource) {
        this.template.Resources[key] = resource;
    };
    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    TransformerContext.prototype.addSchema = function (obj) {
        if (this.nodeMap.__schema) {
            throw new Error("Conflicting schema type found.");
        }
        this.nodeMap.__schema = obj;
    };
    /**
     * Add an object type definition node to the context. If the type already
     * exists an error will be thrown.
     * @param obj The object type definition node to add.
     */
    TransformerContext.prototype.addObject = function (obj) {
        if (this.nodeMap[obj.name.value]) {
            throw new Error("Conflicting type '" + obj.name.value + "' found.");
        }
        this.nodeMap[obj.name.value] = obj;
    };
    /**
     * Add an input type definition node to the context.
     * @param inp The input type definition node to add.
     */
    TransformerContext.prototype.addInput = function (inp) {
        if (this.nodeMap[inp.name.value]) {
            throw new Error("Conflicting input type '" + inp.name.value + "' found.");
        }
        this.nodeMap[inp.name.value] = inp;
    };
    return TransformerContext;
}());
exports.default = TransformerContext;
//# sourceMappingURL=TransformerContext.js.map