"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.message = message;
    }
}
exports.default = ValidationError;
//# sourceMappingURL=validation-error.js.map