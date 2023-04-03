"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.collectFiles = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const glob = __importStar(require("glob"));
const parametersJson = 'parameters.json';
const buildParametersJson = path.join('build', parametersJson);
const cliInputs = 'cli-inputs.json';
const rootStackFileName = 'root-cloudformation-stack.json';
const files = [
    'user-pool-group-precedence.json',
    'schema.graphql',
    buildParametersJson,
    'override.ts',
    parametersJson,
    'cli-inputs.json',
    'transfer.conf.json',
    'amplify.state',
    'custom-policies.json',
    path.join('src', 'package.json'),
    'layer-configuration.json',
    path.join('lib', 'nodejs', 'package.json'),
];
const redactSet = new Set();
redactSet.add(parametersJson);
redactSet.add(buildParametersJson);
redactSet.add(cliInputs);
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
const collectFiles = (resources, rootPath) => {
    const filePaths = [];
    resources.reduce((arr, resource) => {
        const resourceDirectory = amplify_cli_core_1.pathManager.getResourceDirectoryPath(rootPath, resource.category, resource.resourceName);
        files
            .map((r) => {
            return {
                filePath: path.join(resourceDirectory, r),
                redact: redactSet.has(r),
            };
        })
            .filter((r) => fs.existsSync(r.filePath))
            .forEach((file) => arr.push(file));
        if (resource.service === 'AppSync' && !fs.existsSync(path.join(resourceDirectory, 'schema.graphql'))) {
            const schemaDirectoryPath = path.join(resourceDirectory, 'schema');
            if (fs.existsSync(schemaDirectoryPath)) {
                const schemaFiles = glob
                    .sync('**/*.graphql', { cwd: schemaDirectoryPath })
                    .map((fileName) => path.join(schemaDirectoryPath, fileName));
                schemaFiles
                    .map((r) => ({
                    filePath: r,
                    redact: false,
                }))
                    .forEach((file) => arr.push(file));
            }
        }
        const cfnFiles = getCfnFiles(resourceDirectory);
        cfnFiles
            .map((r) => ({
            filePath: r,
            redact: false,
        }))
            .forEach((file) => arr.push(file));
        return arr;
    }, filePaths);
    const rootStackPath = path.join(amplify_cli_core_1.pathManager.getRootStackBuildDirPath(rootPath), rootStackFileName);
    if (fs.existsSync(rootStackPath)) {
        filePaths.push({
            filePath: rootStackPath,
            redact: false,
        });
    }
    const cliJsonFile = amplify_cli_core_1.pathManager.getCLIJSONFilePath(rootPath);
    if (fs.existsSync(cliJsonFile)) {
        filePaths.push({
            filePath: cliJsonFile,
            redact: false,
        });
    }
    const backendConfigFile = amplify_cli_core_1.pathManager.getBackendConfigFilePath(rootPath);
    if (fs.existsSync(backendConfigFile)) {
        filePaths.push({
            filePath: backendConfigFile,
            redact: false,
        });
    }
    return filePaths;
};
exports.collectFiles = collectFiles;
const getCfnFiles = (resourceDir) => {
    const resourceBuildDir = path.join(resourceDir, 'build');
    if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
        const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
            cwd: resourceBuildDir,
            absolute: true,
            ignore: [parametersJson],
        });
        if (cfnFiles.length > 0) {
            return cfnFiles;
        }
    }
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
        cwd: resourceDir,
        absolute: true,
        ignore: [parametersJson],
    });
    return cfnFiles;
};
//# sourceMappingURL=collect-files.js.map