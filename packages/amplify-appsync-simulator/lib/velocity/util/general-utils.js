"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalUtils = void 0;
const uuid_1 = require("uuid");
const js_string_escape_1 = __importDefault(require("js-string-escape"));
const ulid_1 = require("ulid");
const errors_1 = require("./errors");
const string_1 = require("../value-mapper/string");
const array_1 = require("../value-mapper/array");
const map_1 = require("../value-mapper/map");
const integer_1 = require("../value-mapper/integer");
const decimal_1 = require("../value-mapper/decimal");
exports.generalUtils = {
    errors: [],
    quiet: () => '',
    qr: () => '',
    escapeJavaScript(value) {
        return (0, js_string_escape_1.default)(value);
    },
    urlEncode(value) {
        return encodeURIComponent(value).replace(/[!'()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    },
    urlDecode(value) {
        return decodeURIComponent(value);
    },
    base64Encode(value) {
        return Buffer.from(value).toString('base64');
    },
    base64Decode(value) {
        return Buffer.from(value, 'base64').toString('ascii');
    },
    parseJson(value) {
        try {
            return JSON.parse(value);
        }
        catch (_) {
            return null;
        }
    },
    toJson(value) {
        return value !== undefined ? JSON.stringify(value) : JSON.stringify(null);
    },
    autoId() {
        return (0, uuid_1.v4)();
    },
    autoUlid: () => (0, ulid_1.ulid)(),
    unauthorized() {
        const err = new errors_1.Unauthorized('Unauthorized', this.info);
        this.errors.push(err);
        throw err;
    },
    error(message, type = null, data = null, errorInfo = null) {
        data = filterData(this.info, data);
        const err = new errors_1.TemplateSentError(message, type, data, errorInfo, this.info);
        this.errors.push(err);
        throw err;
    },
    appendError(message, type = null, data = null, errorInfo = null) {
        data = filterData(this.info, data);
        this.errors.push(new errors_1.TemplateSentError(message, type, data, errorInfo, this.info));
        return '';
    },
    getErrors() {
        return this.errors;
    },
    validate(allGood, message, errorType, data) {
        if (allGood)
            return '';
        const error = new errors_1.ValidateError(message, this.info, errorType, data);
        this.errors.push(error);
        throw error;
    },
    isNull(value) {
        return value === null || typeof value === 'undefined';
    },
    isNullOrEmpty(value) {
        if (this.isNull(value))
            return true;
        if (value instanceof map_1.JavaMap) {
            return Object.keys(value.toJSON()).length === 0;
        }
        if (value instanceof array_1.JavaArray || value instanceof string_1.JavaString) {
            return value.toJSON().length === 0;
        }
        if (value instanceof integer_1.JavaInteger) {
            return this.isNull(value === null || value === void 0 ? void 0 : value.value);
        }
        if (value instanceof decimal_1.JavaDecimal) {
            return this.isNull(value === null || value === void 0 ? void 0 : value.value);
        }
        return !!value;
    },
    isNullOrBlank(value) {
        return this.isNullOrEmpty(value);
    },
    defaultIfNull(value, defaultValue = '') {
        if (value !== null && value !== undefined)
            return value;
        return defaultValue;
    },
    defaultIfNullOrEmpty(value, defaultValue) {
        if (value)
            return value;
        return defaultValue;
    },
    defaultIfNullOrBlank(value, defaultValue) {
        if (value)
            return value;
        return defaultValue;
    },
    isString(value) {
        return value instanceof string_1.JavaString;
    },
    isNumber(value) {
        return typeof value === 'number';
    },
    isBoolean(value) {
        return typeof value === 'boolean';
    },
    isList(value) {
        return Array.isArray(value) || value instanceof array_1.JavaArray;
    },
    isMap(value) {
        if (value instanceof Map)
            return value;
        return value != null && typeof value === 'object';
    },
    typeOf(value) {
        if (value === null)
            return 'Null';
        if (this.isList(value))
            return 'List';
        if (this.isMap(value))
            return 'Map';
        switch (typeof value) {
            case 'number':
                return 'Number';
            case 'string':
                return 'String';
            case 'boolean':
                return 'Boolean';
            default:
                return 'Object';
        }
    },
    matches(pattern, value) {
        return new RegExp(pattern).test(value);
    },
};
const filterData = (info, data = null) => {
    if (data instanceof map_1.JavaMap) {
        const filteredData = {};
        info.operation.selectionSet.selections
            .map((selection) => selection)
            .find((selection) => selection.name.value === info.fieldName)
            .selectionSet.selections.map((fieldNode) => fieldNode.name.value)
            .forEach((field) => {
            filteredData[field] = data.get(field);
        });
        data = filteredData;
    }
    return data;
};
//# sourceMappingURL=general-utils.js.map