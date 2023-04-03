"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const run = async (context) => {
    if (Array.isArray(context.parameters.array) && context.parameters.array.length > 0) {
        throw new amplify_cli_core_1.AmplifyError('CommandNotSupportedError', {
            message: 'The "delete" command does not expect additional arguments.',
            details: 'Perhaps you meant to use the "remove" command instead of "delete"?',
            resolution: 'If you intend to delete this project and all backend resources, try the "delete" command again without any additional arguments.',
        });
    }
    await context.amplify.deleteProject(context);
};
exports.run = run;
//# sourceMappingURL=delete.js.map