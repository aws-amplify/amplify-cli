"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const storage_1 = require("../../storage");
exports.name = 'storage';
const run = async (context) => {
    if (context.parameters.options.help) {
        const header = `amplify mock ${exports.name} \nDescriptions:
    Mock Storage locally`;
        context.amplify.showHelp(header, []);
        return;
    }
    try {
        await (0, storage_1.start)(context);
    }
    catch (e) {
        context.print.error(e.message);
    }
};
exports.run = run;
//# sourceMappingURL=storage.js.map