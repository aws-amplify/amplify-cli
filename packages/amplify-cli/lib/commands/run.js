"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const run = async (context) => {
    context.amplify.constructExeInfo(context);
    await context.amplify.pushResources(context);
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
    await frontendHandlerModule.run(context);
};
exports.run = run;
//# sourceMappingURL=run.js.map