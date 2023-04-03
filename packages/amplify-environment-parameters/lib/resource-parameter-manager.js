"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceParameterManager = void 0;
class ResourceParameterManager {
    constructor() {
        this.params = {};
    }
    getParam(name) {
        return this.params[name];
    }
    setParam(name, value) {
        if (value === undefined) {
            delete this.params[name];
        }
        else {
            this.params[name] = value;
        }
    }
    setParams(params) {
        Object.entries(params).forEach(([key, value]) => {
            this.setParam(key, value);
        });
    }
    deleteParam(name) {
        delete this.params[name];
    }
    getAllParams() {
        return { ...this.params };
    }
    setAllParams(params) {
        this.params = {};
        this.setParams(params);
    }
    hasParam(name) {
        return !!this.params[name];
    }
    hasAnyParams() {
        return Object.keys(this.params).length > 0;
    }
}
exports.ResourceParameterManager = ResourceParameterManager;
//# sourceMappingURL=resource-parameter-manager.js.map