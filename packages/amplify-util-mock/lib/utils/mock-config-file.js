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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockConfig = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
function getMockConfig(context) {
    var _a;
    const { projectPath } = context.amplify.getEnvInfo();
    const mockConfigPath = path.join(projectPath, 'amplify', 'mock.json');
    return (_a = amplify_cli_core_1.JSONUtilities.readJson(mockConfigPath, { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : {};
}
exports.getMockConfig = getMockConfig;
//# sourceMappingURL=mock-config-file.js.map