"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const subcommand = 'push';
module.exports = {
    name: subcommand,
    run: async (context) => {
        const { amplify, parameters } = context;
        const resourceName = parameters.first;
        context.amplify.constructExeInfo(context);
        return amplify.pushResources(context, constants_1.categoryName, resourceName).catch((err) => {
            context.print.info(err.stack);
            context.print.error('An error occurred when pushing the function resource');
            context.usageData.emitError(err);
            process.exitCode = 1;
        });
    },
};
//# sourceMappingURL=push.js.map