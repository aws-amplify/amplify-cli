"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAmplifyLogger = exports.LocalLogDirectory = exports.stringMasker = exports.Redactor = void 0;
const AmplifyLogger_1 = require("./AmplifyLogger");
const constants_1 = require("./constants");
var Redactor_1 = require("./Redactor");
Object.defineProperty(exports, "Redactor", { enumerable: true, get: function () { return Redactor_1.Redactor; } });
Object.defineProperty(exports, "stringMasker", { enumerable: true, get: function () { return Redactor_1.stringMasker; } });
exports.LocalLogDirectory = constants_1.constants.LOG_DIRECTORY;
let logger;
const getAmplifyLogger = () => {
    if (!logger) {
        logger = new AmplifyLogger_1.AmplifyLogger();
    }
    return logger;
};
exports.getAmplifyLogger = getAmplifyLogger;
//# sourceMappingURL=index.js.map