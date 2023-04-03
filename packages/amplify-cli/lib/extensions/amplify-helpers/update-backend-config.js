"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBackendConfigAfterResourceRemove = exports.updateBackendConfigAfterResourceUpdate = exports.updateBackendConfigAfterResourceAdd = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
function updateBackendConfigAfterResourceAdd(category, resourceName, options) {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(undefined, {
        throwIfNotExist: false,
        default: {},
    });
    if (!backendConfig[category]) {
        backendConfig[category] = {};
    }
    if (!backendConfig[category][resourceName]) {
        backendConfig[category][resourceName] = {};
    }
    backendConfig[category][resourceName] = options;
    amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
}
exports.updateBackendConfigAfterResourceAdd = updateBackendConfigAfterResourceAdd;
function updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value) {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(undefined, {
        throwIfNotExist: false,
        default: {},
    });
    lodash_1.default.setWith(backendConfig, [category, resourceName, attribute], value);
    amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
}
exports.updateBackendConfigAfterResourceUpdate = updateBackendConfigAfterResourceUpdate;
function updateBackendConfigAfterResourceRemove(category, resourceName) {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig(undefined, {
        throwIfNotExist: false,
        default: {},
    });
    if (backendConfig[category] && backendConfig[category][resourceName] !== undefined) {
        delete backendConfig[category][resourceName];
    }
    amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
}
exports.updateBackendConfigAfterResourceRemove = updateBackendConfigAfterResourceRemove;
//# sourceMappingURL=update-backend-config.js.map