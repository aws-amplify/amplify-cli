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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollateResourceDiffs = exports.ResourceDiff = exports.globCFNFilePath = exports.capitalize = exports.stackMutationType = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
const chalk_1 = __importDefault(require("chalk"));
const cfnDiff = __importStar(require("@aws-cdk/cloudformation-diff"));
const amplify_cli_core_1 = require("amplify-cli-core");
const print_1 = require("./print");
const resource_status_data_1 = require("./resource-status-data");
const CategoryProviders = {
    CLOUDFORMATION: 'cloudformation',
};
exports.stackMutationType = {
    CREATE: {
        label: 'Create',
        consoleStyle: chalk_1.default.green.bold,
        icon: '[+]',
    },
    UPDATE: {
        label: 'Update',
        consoleStyle: chalk_1.default.yellow.bold,
        icon: '[~]',
    },
    DELETE: {
        label: 'Delete',
        consoleStyle: chalk_1.default.red.bold,
        icon: '[-]',
    },
    IMPORT: {
        label: 'Import',
        consoleStyle: chalk_1.default.blue.bold,
        icon: `[\u21E9]`,
    },
    UNLINK: {
        label: 'Unlink',
        consoleStyle: chalk_1.default.red.bold,
        icon: `[\u2BFB]`,
    },
    NOCHANGE: {
        label: 'No Change',
        consoleStyle: chalk_1.default.grey,
        icon: `[ ]`,
    },
};
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
exports.capitalize = capitalize;
const resourceDetailSectionStyle = chalk_1.default.bgRgb(15, 100, 204);
const globCFNFilePath = (fileFolder) => {
    if (fs.existsSync(fileFolder)) {
        const globOptions = {
            absolute: false,
            cwd: fileFolder,
            follow: false,
            nodir: true,
        };
        const templateFileNames = glob.sync('**/*template.{yaml,yml,json}', globOptions);
        for (const templateFileName of templateFileNames) {
            const absolutePath = path.join(fileFolder, templateFileName);
            return absolutePath;
        }
    }
    throw new Error(`No CloudFormation template found in ${fileFolder}`);
};
exports.globCFNFilePath = globCFNFilePath;
class ResourceDiff {
    constructor(category, resourceName, provider, mutationInfo) {
        this.printResourceDetailStatus = async (mutationInfo) => {
            const header = `${mutationInfo.consoleStyle(mutationInfo.label)}`;
            const diff = await this.calculateCfnDiff();
            print_1.print.info(`${resourceDetailSectionStyle(`[\u27A5] Resource Stack: ${(0, exports.capitalize)(this.category)}/${this.resourceName}`)} : ${header}`);
            const diffCount = this.printStackDiff(diff, process.stdout);
            if (diffCount === 0) {
                console.log('No changes  ');
            }
        };
        this.calculateCfnDiff = async () => {
            const resourceTemplatePaths = await this.getCfnResourceFilePaths();
            this.localTemplate = await this.safeReadCFNTemplate(resourceTemplatePaths.localTemplatePath);
            this.localTemplate = (0, amplify_cli_core_1.generateCustomPoliciesInTemplate)(this.localTemplate, this.resourceName, this.service, this.category);
            this.cloudTemplate = await this.safeReadCFNTemplate(resourceTemplatePaths.cloudTemplatePath);
            if (this.mutationInfo.label === exports.stackMutationType.CREATE.label) {
                this.cloudTemplate = {};
            }
            const diff = cfnDiff.diffTemplate(this.cloudTemplate, this.localTemplate);
            return diff;
        };
        this.safeReadCFNTemplate = async (filePath) => {
            const templateResult = (0, amplify_cli_core_1.readCFNTemplate)(filePath, { throwIfNotExist: false });
            return (templateResult === null || templateResult === void 0 ? void 0 : templateResult.cfnTemplate) || {};
        };
        this.getCfnResourceFilePaths = async () => {
            const resourceFilePaths = {
                localTemplatePath: checkExist(this.resourceFiles.localBuildCfnFile)
                    ? this.resourceFiles.localBuildCfnFile
                    : this.resourceFiles.localPreBuildCfnFile,
                cloudTemplatePath: checkExist(this.resourceFiles.cloudBuildCfnFile)
                    ? this.resourceFiles.cloudBuildCfnFile
                    : this.resourceFiles.cloudPreBuildCfnFile,
            };
            return resourceFilePaths;
        };
        this.normalizeProviderForFileNames = (provider) => {
            if (provider === 'awscloudformation') {
                return CategoryProviders.CLOUDFORMATION;
            }
            return provider;
        };
        this.printStackDiff = (templateDiff, stream) => {
            if (templateDiff.resources) {
                templateDiff.resources = templateDiff.resources.filter((change) => {
                    if (!change) {
                        return true;
                    }
                    if (this.isResourceTypeCDKMetada(change.newResourceType) || this.isResourceTypeCDKMetada(change.oldResourceType)) {
                        return false;
                    }
                    return true;
                });
            }
            if (!templateDiff.isEmpty) {
                cfnDiff.formatDifferences(stream || process.stderr, templateDiff);
            }
            return templateDiff.differenceCount;
        };
        this.safeGlobCFNFilePath = (fileFolder) => {
            try {
                return (0, exports.globCFNFilePath)(fileFolder);
            }
            catch (e) {
                return '';
            }
        };
        this.isResourceTypeCDKMetada = (resourceType) => resourceType === 'AWS::CDK::Metadata';
        this.localBackendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        this.cloudBackendDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
        this.resourceName = resourceName;
        this.category = category;
        this.provider = this.normalizeProviderForFileNames(provider);
        this.service = (0, resource_status_data_1.getResourceService)(category, resourceName);
        this.localTemplate = {};
        this.cloudTemplate = {};
        this.mutationInfo = mutationInfo;
        const localResourceAbsolutePathFolder = path.normalize(path.join(this.localBackendDir, category, resourceName));
        const cloudResourceAbsolutePathFolder = path.normalize(path.join(this.cloudBackendDir, category, resourceName));
        this.resourceFiles = {
            localPreBuildCfnFile: this.safeGlobCFNFilePath(localResourceAbsolutePathFolder),
            cloudPreBuildCfnFile: this.safeGlobCFNFilePath(cloudResourceAbsolutePathFolder),
            localBuildCfnFile: this.safeGlobCFNFilePath(path.normalize(path.join(localResourceAbsolutePathFolder, 'build'))),
            cloudBuildCfnFile: this.safeGlobCFNFilePath(path.normalize(path.join(cloudResourceAbsolutePathFolder, 'build'))),
        };
    }
}
exports.ResourceDiff = ResourceDiff;
const checkExist = (filePath) => {
    const inputTypes = ['json', 'yaml', 'yml'];
    for (let i = 0; i < inputTypes.length; i++) {
        if (fs.existsSync(`${filePath}.${inputTypes[i]}`)) {
            return true;
        }
    }
    return false;
};
const CollateResourceDiffs = async (resources, mutationInfo) => {
    const provider = CategoryProviders.CLOUDFORMATION;
    const resourceDiffs = [];
    for await (const resource of resources) {
        resourceDiffs.push(new ResourceDiff(resource.category, resource.resourceName, provider, mutationInfo));
    }
    return resourceDiffs;
};
exports.CollateResourceDiffs = CollateResourceDiffs;
//# sourceMappingURL=resource-status-diff.js.map