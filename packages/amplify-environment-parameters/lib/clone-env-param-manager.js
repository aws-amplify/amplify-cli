"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneEnvParamManager = void 0;
const environment_parameter_manager_1 = require("./environment-parameter-manager");
const cloneEnvParamManager = async (srcEnvParamManager, destEnvName) => {
    const destManager = (await (0, environment_parameter_manager_1.ensureEnvParamManager)(destEnvName)).instance;
    await srcEnvParamManager.cloneEnvParamsToNewEnvParamManager(destManager);
};
exports.cloneEnvParamManager = cloneEnvParamManager;
//# sourceMappingURL=clone-env-param-manager.js.map