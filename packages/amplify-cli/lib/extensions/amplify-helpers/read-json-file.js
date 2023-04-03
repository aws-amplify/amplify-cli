"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readJsonFile = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function readJsonFile(jsonFilePath, encoding = 'utf8', throwOnError = true) {
    return amplify_cli_core_1.JSONUtilities.readJson(jsonFilePath, {
        throwIfNotExist: throwOnError,
    });
}
exports.readJsonFile = readJsonFile;
//# sourceMappingURL=read-json-file.js.map