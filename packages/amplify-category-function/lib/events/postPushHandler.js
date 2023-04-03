"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postPushHandler = void 0;
const functionSecretsStateManager_1 = require("../provider-utils/awscloudformation/secrets/functionSecretsStateManager");
const postPushHandler = async (context) => {
    await ensureSecretsCleanup(context);
};
exports.postPushHandler = postPushHandler;
const ensureSecretsCleanup = async (context) => {
    const funcSecretsManager = await functionSecretsStateManager_1.FunctionSecretsStateManager.getInstance(context);
    await funcSecretsManager.syncSecretsPendingRemoval();
};
//# sourceMappingURL=postPushHandler.js.map