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
exports.getPackageAssetPaths = exports.functionRuntimeContributorFactory = void 0;
const fs = __importStar(require("fs-extra"));
const constants_1 = require("./constants");
const buildUtils_1 = require("./util/buildUtils");
const invokeUtil_1 = require("./util/invokeUtil");
const depUtils_1 = require("./util/depUtils");
const packageUtils_1 = require("./util/packageUtils");
const functionRuntimeContributorFactory = (context) => {
    return {
        contribute: async (request) => {
            const selection = request.selection;
            if (selection !== 'python') {
                throw new Error(`Unknown selection ${selection}`);
            }
            return {
                runtime: {
                    name: 'Python',
                    value: 'python',
                    cloudTemplateValue: 'python3.8',
                    defaultHandler: 'index.handler',
                    layerExecutablePath: 'python',
                    layerDefaultFiles: [
                        {
                            path: 'python',
                            filename: 'Pipfile',
                            content: fs.readFileSync(constants_1.layerPythonPipFile, 'utf-8'),
                        },
                    ],
                },
            };
        },
        checkDependencies: depUtils_1.checkDeps,
        package: (request) => (0, packageUtils_1.pythonPackage)(context, request),
        build: buildUtils_1.pythonBuild,
        invoke: (request) => (0, invokeUtil_1.pythonInvoke)(context, request),
    };
};
exports.functionRuntimeContributorFactory = functionRuntimeContributorFactory;
const getPackageAssetPaths = async () => [constants_1.relativeShimPath];
exports.getPackageAssetPaths = getPackageAssetPaths;
//# sourceMappingURL=index.js.map