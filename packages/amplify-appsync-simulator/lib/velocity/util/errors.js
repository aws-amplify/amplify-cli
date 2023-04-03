"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateError = exports.Unauthorized = exports.TemplateSentError = void 0;
class TemplateSentError extends Error {
    constructor(message, errorType, data, errorInfo, info) {
        super(message);
        this.message = message;
        this.errorType = errorType;
        this.data = data;
        this.errorInfo = errorInfo;
        Object.setPrototypeOf(this, TemplateSentError.prototype);
        const fieldName = info.fieldName;
        let path = info.path;
        const pathArray = [];
        do {
            pathArray.splice(0, 0, path.key);
            path = path.prev;
        } while (path);
        const fieldNode = info.fieldNodes.find((f) => f.name.value === fieldName);
        const filedLocation = (fieldNode && fieldNode.loc.startToken) || null;
        this.extensions = {
            message: message,
            errorType,
            data,
            errorInfo,
            path: pathArray,
            locations: [
                filedLocation
                    ? {
                        line: filedLocation.line,
                        column: filedLocation.column,
                        sourceName: fieldNode.loc.source.name,
                    }
                    : [],
            ],
        };
    }
}
exports.TemplateSentError = TemplateSentError;
class Unauthorized extends TemplateSentError {
    constructor(gqlMessage, info) {
        super(gqlMessage, 'Unauthorized', {}, {}, info);
        Object.setPrototypeOf(this, Unauthorized.prototype);
    }
}
exports.Unauthorized = Unauthorized;
class ValidateError extends TemplateSentError {
    constructor(message, info, type = 'CustomTemplateException', data = null) {
        super(message, type, {}, {}, info);
        this.message = message;
        this.type = type;
        this.data = data;
        Object.setPrototypeOf(this, ValidateError.prototype);
    }
}
exports.ValidateError = ValidateError;
//# sourceMappingURL=errors.js.map