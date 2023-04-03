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
exports.generateTsConfigforProject = exports.generateAmplifyOverrideProjectBuildFiles = exports.buildOverrideDir = exports.generateOverrideSkeleton = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const index_1 = require("../index");
const jsonUtilities_1 = require("../jsonUtilities");
const generateOverrideSkeleton = async (context, srcResourceDirPath, destDirPath) => {
    const backendDir = index_1.pathManager.getBackendDirPath();
    const overrideFile = path.join(destDirPath, 'override.ts');
    if (fs.existsSync(overrideFile)) {
        await context.amplify.openEditor(context, overrideFile);
        return;
    }
    (0, exports.generateAmplifyOverrideProjectBuildFiles)(backendDir, srcResourceDirPath);
    fs.ensureDirSync(destDirPath);
    (0, exports.generateTsConfigforProject)(srcResourceDirPath, destDirPath);
    await (0, exports.buildOverrideDir)(backendDir, destDirPath);
    amplify_prompts_1.printer.success(`Successfully generated "override.ts" folder at ${destDirPath}`);
    const isOpen = await amplify_prompts_1.prompter.yesOrNo('Do you want to edit override.ts file now?', true);
    if (isOpen) {
        await context.amplify.openEditor(context, overrideFile);
    }
};
exports.generateOverrideSkeleton = generateOverrideSkeleton;
const buildOverrideDir = async (cwd, destDirPath) => {
    const overrideFileName = path.join(destDirPath, 'override.ts');
    if (!fs.existsSync(overrideFileName)) {
        return false;
    }
    const overrideBackendPackageJson = path.join(index_1.pathManager.getBackendDirPath(), 'package.json');
    if (!fs.existsSync(overrideBackendPackageJson)) {
        const overrideSamplePackageJsonPath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'package.json');
        fs.writeFileSync(overrideBackendPackageJson, fs.readFileSync(overrideSamplePackageJsonPath));
    }
    const overrideBackendTsConfigJson = path.join(index_1.pathManager.getBackendDirPath(), 'tsconfig.json');
    if (!fs.existsSync(overrideBackendTsConfigJson)) {
        const overrideSampleTsconfigJsonPath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'tsconfig.json');
        fs.writeFileSync(overrideBackendTsConfigJson, fs.readFileSync(overrideSampleTsconfigJsonPath));
    }
    const packageManager = (0, index_1.getPackageManager)(cwd);
    if (packageManager === null) {
        throw new index_1.AmplifyError('MissingOverridesInstallationRequirementsError', {
            message: 'No package manager found.',
            resolution: 'Please install npm or yarn to compile overrides for this project.',
        });
    }
    try {
        execa_1.default.sync(packageManager.executable, ['install'], {
            cwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        const tsConfigDir = path.join(destDirPath, 'build');
        fs.ensureDirSync(tsConfigDir);
        const tsConfigDestFilePath = path.join(tsConfigDir, 'tsconfig.resource.json');
        const tsConfigSampleFilePath = path.join(__dirname, '..', '..', 'resources', 'overrides-resource', 'tsconfig.resource.json');
        fs.writeFileSync(tsConfigDestFilePath, fs.readFileSync(tsConfigSampleFilePath));
        const localTscExecutablePath = path.join(cwd, 'node_modules', '.bin', 'tsc');
        if (!fs.existsSync(localTscExecutablePath)) {
            throw new index_1.AmplifyError('MissingOverridesInstallationRequirementsError', {
                message: 'TypeScript executable not found.',
                resolution: 'Please add it as a dev-dependency in the package.json file for this resource.',
            });
        }
        execa_1.default.sync(localTscExecutablePath, [`--project`, `${tsConfigDestFilePath}`], {
            cwd: tsConfigDir,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return true;
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new index_1.AmplifyError('MissingOverridesInstallationRequirementsError', {
                message: `Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`,
            });
        }
        else {
            throw new index_1.AmplifyError('InvalidOverrideError', {
                message: `Packaging overrides failed.`,
                details: error.message,
                resolution: 'There may be errors in your overrides file. If so, fix the errors and try again.',
            }, error);
        }
    }
};
exports.buildOverrideDir = buildOverrideDir;
const generateAmplifyOverrideProjectBuildFiles = (backendDir, srcResourceDirPath) => {
    const packageJSONFilePath = path.join(backendDir, 'package.json');
    const tsConfigFilePath = path.join(backendDir, 'tsconfig.json');
    if (!fs.existsSync(packageJSONFilePath)) {
        const packageJson = jsonUtilities_1.JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json'));
        jsonUtilities_1.JSONUtilities.writeJson(packageJSONFilePath, packageJson);
    }
    if (!fs.existsSync(tsConfigFilePath)) {
        const tsConfigJson = jsonUtilities_1.JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json'));
        jsonUtilities_1.JSONUtilities.writeJson(tsConfigFilePath, tsConfigJson);
    }
};
exports.generateAmplifyOverrideProjectBuildFiles = generateAmplifyOverrideProjectBuildFiles;
const generateTsConfigforProject = (srcResourceDirPath, destDirPath) => {
    const overrideFileName = path.join(destDirPath, 'override.ts');
    fs.ensureDirSync(path.join(destDirPath, 'build'));
    const resourceTsConfigFileName = path.join(destDirPath, 'build', 'tsconfig.resource.json');
    fs.writeFileSync(overrideFileName, fs.readFileSync(path.join(srcResourceDirPath, 'override.ts.sample')));
    fs.writeFileSync(resourceTsConfigFileName, fs.readFileSync(path.join(srcResourceDirPath, 'tsconfig.resource.json')));
};
exports.generateTsConfigforProject = generateTsConfigforProject;
//# sourceMappingURL=override-skeleton-generator.js.map