"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const getLogger = (moduleName, fileName) => {
    return {
        info: (message, args = {}) => {
            (0, amplify_cli_logger_1.getAmplifyLogger)().logInfo({ message: `${moduleName}.${fileName}.${message}(${(0, amplify_cli_logger_1.Redactor)(JSON.stringify(args))}` });
        },
        error: (message, error) => {
            (0, amplify_cli_logger_1.getAmplifyLogger)().logError({ message: `${moduleName}.${fileName}.${message}`, error });
        },
    };
};
exports.getLogger = getLogger;
//# sourceMappingURL=index.js.map