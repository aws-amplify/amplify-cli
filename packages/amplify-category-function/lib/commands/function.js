"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../constants");
const help_1 = require("./function/help");
module.exports = {
    name: constants_1.categoryName,
    run: async (context) => {
        if (context.parameters.options.help) {
            (0, help_1.run)(context);
            return;
        }
        if (/^win/.test(process.platform)) {
            try {
                const { run } = require(`./${constants_1.categoryName}/${context.parameters.first}`);
                run(context);
                return;
            }
            catch (e) {
                context.print.error('Command not found');
            }
        }
    },
};
//# sourceMappingURL=function.js.map