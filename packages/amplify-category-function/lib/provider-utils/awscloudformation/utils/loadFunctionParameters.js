"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFunctionParameters = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const loadFunctionParameters = (resourcePath) => {
    const funcParams = amplify_cli_core_1.JSONUtilities.readJson(path.join(resourcePath, constants_1.functionParametersFileName), { throwIfNotExist: false }) || {};
    if (funcParams.mutableParametersState) {
        lodash_1.default.assign(funcParams, { ...funcParams.mutableParametersState });
        delete funcParams.mutableParametersState;
    }
    return funcParams;
};
exports.loadFunctionParameters = loadFunctionParameters;
//# sourceMappingURL=loadFunctionParameters.js.map