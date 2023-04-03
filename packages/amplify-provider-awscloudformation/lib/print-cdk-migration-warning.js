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
exports.getMigrationMessage = exports.printCdkMigrationWarning = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const printCdkMigrationWarning = async (context) => {
    try {
        const resourcesToBuild = [];
        const { allResources } = await context.amplify.getResourceStatus();
        allResources.forEach((resource) => {
            resourcesToBuild.push({
                service: resource.service,
                category: resource.category,
                resourceName: resource.resourceName,
            });
        });
        const migrationString = (0, exports.getMigrationMessage)(resourcesToBuild);
        if (!lodash_1.default.isEmpty(migrationString)) {
            amplify_prompts_1.printer.warn(migrationString);
        }
    }
    catch (error) {
    }
};
exports.printCdkMigrationWarning = printCdkMigrationWarning;
const getOverridesWarning = (resourcesToBuild, dependencyToSearch) => {
    let overridesWarningObject;
    for (const resource of resourcesToBuild) {
        const overrideFilePath = amplify_cli_core_1.pathManager.getResourceOverrideFilePath(undefined, resource.category, resource.resourceName);
        if (fs.existsSync(overrideFilePath) && lodash_1.default.isEmpty(overridesWarningObject)) {
            const amplifyDetectorProps = {
                projectRoot: amplify_cli_core_1.pathManager.getBackendDirPath(),
            };
            const explicitDependencies = new amplify_cli_core_1.AmplifyNodePkgDetector(amplifyDetectorProps).detectAffectedDirectDependencies(dependencyToSearch);
            if (!lodash_1.default.isEmpty(explicitDependencies)) {
                overridesWarningObject = {
                    impactedFiles: [path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'package.json')],
                    resolutionMessage: `Upgrade '@aws-amplify/cli-extensibility-helper' to latest version ^3.0.0`,
                };
            }
        }
    }
    return overridesWarningObject;
};
const getCustomResourcesWarning = (resourcesToBuild, dependencyToSearch) => {
    let customResourcesWarningObject;
    const customResourceImpactedFiles = [];
    const customCategoryResources = resourcesToBuild.filter((resource) => resource.category === amplify_cli_core_1.AmplifyCategories.CUSTOM && resource.service !== 'customCloudformation');
    customCategoryResources.forEach((resource) => {
        const targetDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), resource.category, resource.resourceName);
        const amplifyDetectorProps = {
            projectRoot: targetDir,
        };
        const explicitDependencies = new amplify_cli_core_1.AmplifyNodePkgDetector(amplifyDetectorProps).detectAffectedDirectDependencies(dependencyToSearch);
        if (!lodash_1.default.isEmpty(explicitDependencies)) {
            customResourceImpactedFiles.push(path.join(targetDir, 'package.json'));
            customResourcesWarningObject = {
                impactedFiles: customResourceImpactedFiles,
                resolutionMessage: `Follow this guide: https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html`,
            };
        }
    });
    return customResourcesWarningObject;
};
const getMigrationMessage = (resourcesToBuild) => {
    const migrationBanner = `We detected that you are using CDK v1 with custom stacks and overrides.AWS CDK v1 has entered maintenance mode on June 1, 2022`;
    const dependencyToSearch = '@aws-cdk/core';
    const overridesWarningObject = getOverridesWarning(resourcesToBuild, dependencyToSearch);
    const customResourceWarningObject = getCustomResourcesWarning(resourcesToBuild, dependencyToSearch);
    let migrationString;
    if (!lodash_1.default.isEmpty(overridesWarningObject) || !lodash_1.default.isEmpty(customResourceWarningObject)) {
        migrationString = '\n';
        migrationString = migrationString.concat(migrationBanner);
        migrationString = migrationString.concat('\n\nImpacted Files:\n');
        migrationString = migrationString.concat('\n');
    }
    if (!lodash_1.default.isEmpty(overridesWarningObject)) {
        overridesWarningObject.impactedFiles.forEach((file) => {
            migrationString = migrationString.concat(` - ${file}\n`);
        });
        migrationString = migrationString.concat(`${overridesWarningObject.resolutionMessage}\n`);
    }
    if (!lodash_1.default.isEmpty(customResourceWarningObject)) {
        customResourceWarningObject.impactedFiles.forEach((file) => {
            migrationString = migrationString.concat(` - ${file}\n`);
        });
        migrationString = migrationString.concat(`${customResourceWarningObject.resolutionMessage}\n`);
    }
    return migrationString;
};
exports.getMigrationMessage = getMigrationMessage;
//# sourceMappingURL=print-cdk-migration-warning.js.map