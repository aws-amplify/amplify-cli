"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const import_1 = require("../../provider-controllers/import");
exports.name = 'import';
const run = async (context) => {
    try {
        return await (0, import_1.importResource)(context);
    }
    catch (error) {
        if (error.message) {
            amplify_prompts_1.printer.error(error.message);
        }
        amplify_prompts_1.printer.blankLine();
        if (error.stack) {
            amplify_prompts_1.printer.debug(error.stack);
        }
        amplify_prompts_1.printer.error('There was an error importing the geofence collection');
        void context.usageData.emitError(error);
        process.exitCode = 1;
    }
    return undefined;
};
exports.run = run;
//# sourceMappingURL=import.js.map