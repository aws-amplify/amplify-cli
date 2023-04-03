"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const api_1 = require("../../api");
exports.name = 'api';
const run = async (context) => {
    if (context.parameters.options.help) {
        const header = `amplify mock ${exports.name} \nDescription:
    Mock GraphQL API locally`;
        context.amplify.showHelp(header, []);
        return;
    }
    try {
        await (0, api_1.start)(context);
    }
    catch (e) {
        context.print.error(e.message);
    }
};
exports.run = run;
//# sourceMappingURL=api.js.map