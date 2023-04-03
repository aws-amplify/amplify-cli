"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeObjectAsJson = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
function writeObjectAsJson(dest, obj, pretty) {
    amplify_cli_core_1.JSONUtilities.writeJson(dest, obj, {
        minify: !pretty,
    });
}
exports.writeObjectAsJson = writeObjectAsJson;
//# sourceMappingURL=write-object-as-json.js.map