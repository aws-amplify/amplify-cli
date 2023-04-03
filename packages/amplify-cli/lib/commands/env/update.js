"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const get_provider_plugins_1 = require("../../extensions/amplify-helpers/get-provider-plugins");
const run = async (context) => {
    await (0, get_provider_plugins_1.executeProviderCommand)(context, 'updateEnv');
};
exports.run = run;
//# sourceMappingURL=update.js.map