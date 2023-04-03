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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCloudFormationFromCDK = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const path = __importStar(require("path"));
const constants_1 = require("./constants");
async function generateCloudFormationFromCDK(resourceName) {
    const targetDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, resourceName);
    const { cdkStack } = await (_a = path.resolve(path.join(targetDir, 'build', 'cdk-stack.js')), Promise.resolve().then(() => __importStar(require(_a))));
    const amplifyResourceProps = { category: constants_1.categoryName, resourceName };
    const customStack = new cdkStack(undefined, undefined, undefined, amplifyResourceProps);
    amplify_cli_core_1.JSONUtilities.writeJson(path.join(targetDir, 'build', `${resourceName}-cloudformation-template.json`), customStack._toCloudFormation());
}
exports.generateCloudFormationFromCDK = generateCloudFormationFromCDK;
//# sourceMappingURL=generate-cfn-from-cdk.js.map