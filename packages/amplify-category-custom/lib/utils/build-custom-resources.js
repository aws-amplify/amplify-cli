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
exports.generateDependentResourcesType = exports.buildCustomResources = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const execa_1 = __importDefault(require("execa"));
const fs = __importStar(require("fs-extra"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
const constants_1 = require("./constants");
const dependency_management_utils_1 = require("./dependency-management-utils");
const generate_cfn_from_cdk_1 = require("./generate-cfn-from-cdk");
const buildCustomResources = async (context, resourceName) => {
    const spinner = (0, ora_1.default)('Building custom resources');
    try {
        spinner.start();
        const resourcesToBuild = (await getSelectedResources(context, resourceName)).filter((resource) => resource.service === 'customCDK');
        for await (const resource of resourcesToBuild) {
            await buildResource(resource);
        }
    }
    catch (err) {
        throw new amplify_cli_core_1.AmplifyError('InvalidCustomResourceError', {
            message: `There was an error building the custom resources`,
            details: err.message,
            resolution: 'There may be errors in your custom resource file. If so, fix the errors and try again.',
        }, err);
    }
    finally {
        spinner.stop();
    }
};
exports.buildCustomResources = buildCustomResources;
const getSelectedResources = async (context, resourceName) => (await context.amplify.getResourceStatus(constants_1.categoryName, resourceName)).allResources;
const generateDependentResourcesType = async () => {
    const resourceDirPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.TYPES_DIR_NAME);
    const target = path.join(resourceDirPath, constants_1.AMPLIFY_RESOURCES_TYPE_DEF_FILENAME);
    const dependentResourceAttributesFileContent = `export type AmplifyDependentResourcesAttributes = ${amplify_cli_core_1.JSONUtilities.stringify((0, dependency_management_utils_1.getAllResources)(), { orderedKeys: true })}`;
    await fs.ensureDir(path.dirname(target));
    await fs.writeFile(target, dependentResourceAttributesFileContent);
};
exports.generateDependentResourcesType = generateDependentResourcesType;
const buildResource = async (resource) => {
    const targetDir = path.resolve(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, resource.resourceName));
    await (0, exports.generateDependentResourcesType)();
    const packageManager = (0, amplify_cli_core_1.getPackageManager)(targetDir);
    if (packageManager === null) {
        throw new Error('No package manager found. Please install npm or yarn to compile overrides for this project.');
    }
    try {
        execa_1.default.sync(packageManager.executable, ['install'], {
            cwd: targetDir,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            throw new Error(`Packaging overrides failed. Could not find ${packageManager} executable in the PATH.`);
        }
        else {
            throw new Error(`Packaging overrides failed with the error \n${error.message}`);
        }
    }
    const localTscExecutablePath = path.join(targetDir, 'node_modules', '.bin', 'tsc');
    if (!fs.existsSync(localTscExecutablePath)) {
        throw new amplify_cli_core_1.AmplifyError('MissingOverridesInstallationRequirementsError', {
            message: 'TypeScript executable not found.',
            resolution: 'Please add it as a dev-dependency in the package.json file for this resource.',
        });
    }
    try {
        execa_1.default.sync(localTscExecutablePath, {
            cwd: targetDir,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
    }
    catch (error) {
        amplify_prompts_1.printer.error(`Failed building resource ${resource.resourceName}`);
        throw error;
    }
    await (0, generate_cfn_from_cdk_1.generateCloudFormationFromCDK)(resource.resourceName);
};
//# sourceMappingURL=build-custom-resources.js.map