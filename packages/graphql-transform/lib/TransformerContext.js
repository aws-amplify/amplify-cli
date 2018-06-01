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
var language_1 = require("graphql/language");
var blankTemplate_1 = require("./util/blankTemplate");
/**
 * The transformer context is responsible for accumulating the resources,
 * types, and parameters necessary to support an AppSync transform.
 */
var TransformerContext = /** @class */ (function () {
    function TransformerContext(inputSDL) {
        this.template = blankTemplate_1.default();
        this.nodeMap = {};
        var doc = language_1.parse(inputSDL);
        for (var _i = 0, _a = doc.definitions; _i < _a.length; _i++) {
            var def = _a[_i];
            if (def.kind === 'OperationDefinition' || def.kind === 'FragmentDefinition') {
                throw new Error("Found a " + def.kind + ". Transformers accept only documents consisting of TypeSystemDefinitions.");
            }
        }
        this.inputDocument = doc;
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
     * Add an object type extension definition node to the context. If a type with this
     * name does not already exist, an exception is thrown.
     * @param obj The object type definition node to add.
     */
    TransformerContext.prototype.addObjectExtension = function (obj) {
        if (!this.nodeMap[obj.name.value]) {
            throw new Error("Cannot extend non-existant type '" + obj.name.value + "'.");
        }
        // AppSync does not yet understand type extensions so fold the types in.
        var oldNode = this.nodeMap[obj.name.value];
        var newDirs = obj.directives || [];
        var oldDirs = oldNode.directives || [];
        var mergedDirs = oldDirs.concat(newDirs);
        // An extension cannot redeclare fields.
        var newFieldMap = obj.fields.reduce(function (acc, field) {
            return (__assign({}, acc, (_a = {}, _a[field.name.value] = field, _a)));
            var _a;
        }, {});
        var oldFields = oldNode.fields || [];
        var mergedFields = oldFields.slice();
        for (var _i = 0, oldFields_1 = oldFields; _i < oldFields_1.length; _i++) {
            var oldField = oldFields_1[_i];
            if (newFieldMap[oldField.name.value]) {
                throw new Error("Object type extension '" + obj.name.value + "' cannot redeclare field " + oldField.name.value);
            }
            mergedFields.push(newFieldMap[oldField.name.value]);
        }
        // An extension cannot redeclare interfaces
        var newInterfaceMap = (obj.interfaces || []).reduce(function (acc, field) {
            return (__assign({}, acc, (_a = {}, _a[field.name.value] = field, _a)));
            var _a;
        }, {});
        var oldInterfaces = oldNode.interfaces || [];
        var mergedInterfaces = oldInterfaces.slice();
        for (var _a = 0, oldInterfaces_1 = oldInterfaces; _a < oldInterfaces_1.length; _a++) {
            var oldInterface = oldInterfaces_1[_a];
            if (newFieldMap[oldInterface.name.value]) {
                throw new Error("Object type extension '" + obj.name.value + "' cannot redeclare interface " + oldInterface.name.value);
            }
            mergedInterfaces.push(newFieldMap[oldInterface.name.value]);
        }
        this.nodeMap[obj.name.value] = __assign({}, oldNode, { interfaces: mergedInterfaces, directives: mergedDirs, fields: mergedFields });
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