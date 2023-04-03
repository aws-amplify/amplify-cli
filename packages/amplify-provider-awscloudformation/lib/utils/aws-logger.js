"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileLogger = void 0;
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const mainModule = 'amplify-provider-awscloudformation';
const fileLogger = (file) => (crumb, args) => (error) => {
    const message = `${mainModule}.${file}.${crumb}(${(0, amplify_cli_logger_1.Redactor)(JSON.stringify(args))})`;
    if (!error) {
        (0, amplify_cli_logger_1.getAmplifyLogger)().logInfo({ message });
    }
    else {
        (0, amplify_cli_logger_1.getAmplifyLogger)().logError({
            message,
            error,
        });
    }
};
exports.fileLogger = fileLogger;
//# sourceMappingURL=aws-logger.js.map