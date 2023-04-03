"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exitOnNextTick = void 0;
const amplify_cli_logger_1 = require("@aws-amplify/amplify-cli-logger");
const exitOnNextTick = (code) => {
    (0, amplify_cli_logger_1.getAmplifyLogger)().loggerEnd();
    process.exit(code);
};
exports.exitOnNextTick = exitOnNextTick;
//# sourceMappingURL=exitOnNextTick.js.map