"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const initialize_env_1 = require("../../initialize-env");
const run = async (context) => {
    context.amplify.constructExeInfo(context);
    context.exeInfo.forcePush = false;
    context.exeInfo.restoreBackend = context.parameters.options.restore;
    await (0, initialize_env_1.initializeEnv)(context);
};
exports.run = run;
//# sourceMappingURL=pull.js.map