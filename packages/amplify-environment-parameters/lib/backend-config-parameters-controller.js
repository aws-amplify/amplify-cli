"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParametersControllerInstance = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const ajv_1 = __importDefault(require("ajv"));
const BackendParameters_schema_json_1 = __importDefault(require("./schemas/BackendParameters.schema.json"));
let localBackendParametersController;
const getParametersControllerInstance = () => {
    if (localBackendParametersController === undefined) {
        localBackendParametersController = new LocalBackendParametersController(backendConfigParameterMapSupplier());
    }
    return localBackendParametersController;
};
exports.getParametersControllerInstance = getParametersControllerInstance;
class LocalBackendParametersController {
    constructor(parameterMap) {
        this.parameterMap = parameterMap;
    }
    async save() {
        if (!amplify_cli_core_1.stateManager.backendConfigFileExists()) {
            return;
        }
        const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(undefined, undefined, true);
        if (Object.keys(this.parameterMap).length === 0) {
            delete backendConfig.parameters;
        }
        else {
            backendConfig.parameters = this.parameterMap;
        }
        amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
    }
    addParameter(name, usedBy) {
        this.parameterMap[name] = {
            usedBy,
        };
        return this;
    }
    addAllParameters(parameterMap) {
        Object.entries(parameterMap).forEach(([parameterName, parameterConfig]) => {
            this.parameterMap[parameterName] = parameterConfig;
        });
        return this;
    }
    removeParameter(name) {
        delete this.parameterMap[name];
        return this;
    }
    removeAllParameters() {
        this.parameterMap = {};
        return this;
    }
    getParameters() {
        return this.parameterMap;
    }
}
const backendConfigParameterMapSupplier = () => {
    var _a, _b;
    const uncheckedParamMap = ((_a = amplify_cli_core_1.stateManager.getBackendConfig(undefined, { throwIfNotExist: false }, true)) === null || _a === void 0 ? void 0 : _a.parameters) || {};
    const ajv = new ajv_1.default();
    const validator = ajv.compile(BackendParameters_schema_json_1.default);
    if (!validator(uncheckedParamMap)) {
        throw new amplify_cli_core_1.AmplifyError('BackendConfigValidationError', {
            message: `backend-config.json parameter config is invalid`,
            resolution: 'Correct the errors in the file and retry the command',
            details: (_b = validator.errors) === null || _b === void 0 ? void 0 : _b.map((err) => JSON.stringify(err, undefined, 2)).join('\n'),
        });
    }
    return uncheckedParamMap;
};
//# sourceMappingURL=backend-config-parameters-controller.js.map