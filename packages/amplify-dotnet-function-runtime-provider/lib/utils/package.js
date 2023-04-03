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
exports.packageAssemblies = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const execa = __importStar(require("execa"));
const constants_1 = require("../constants");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const packageAssemblies = async (request, context) => {
    const distPath = path_1.default.join(request.srcRoot, 'dist');
    const sourcePath = path_1.default.join(request.srcRoot, 'src');
    if (fs_extra_1.default.existsSync(request.dstFilename)) {
        fs_extra_1.default.removeSync(request.dstFilename);
    }
    const packageHash = (await context.amplify.hashDir(distPath, []));
    const framework = request.runtime === constants_1.dotnetcore31 ? 'netcoreapp3.1' : 'net6.0';
    try {
        const result = execa.sync(constants_1.executableName, ['lambda', 'package', '--framework', framework, '--configuration', 'Release', '--output-package', request.dstFilename], {
            cwd: sourcePath,
        });
        if (result.exitCode !== 0) {
            throw new Error(`Packaging failed. Exit code was ${result.exitCode}`);
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('PackagingLambdaFunctionError', { message: `Packaging failed, error message was ${err.message}` }, err);
    }
    return {
        packageHash: packageHash,
    };
};
exports.packageAssemblies = packageAssemblies;
//# sourceMappingURL=package.js.map