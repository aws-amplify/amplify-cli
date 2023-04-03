"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const func_1 = require("../../func");
exports.name = 'function';
const run = async (context) => {
    if (context.parameters.options.help) {
        const header = `amplify mock ${exports.name} \nDescriptions:
    Mock Functions locally`;
        context.amplify.showHelp(header, []);
        return;
    }
    try {
        await (0, func_1.start)(context);
    }
    catch (e) {
        context.print.error(e.message);
    }
};
exports.run = run;
//# sourceMappingURL=function.js.map