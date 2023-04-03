"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvVarFormatError = void 0;
class EnvVarFormatError extends Error {
    constructor(variableName) {
        let normalizedName = variableName;
        if (variableName === undefined || variableName.trim().length === 0) {
            normalizedName = '<unknown>';
        }
        super(`Invalid variable name format: '${normalizedName}'`);
        this.name = 'EnvVarFormatError';
    }
}
exports.EnvVarFormatError = EnvVarFormatError;
//# sourceMappingURL=envVarFormatError.js.map