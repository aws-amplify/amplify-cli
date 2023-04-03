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
exports.addCFNResourceDependency = exports.addCDKResourceDependency = exports.getAllResources = exports.getResourceCfnOutputAttributes = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const glob_1 = require("glob");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const constants_1 = require("../utils/constants");
const AUTH_TRIGGER_TEMPLATE = 'auth-trigger-cloudformation-template.json';
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
function getResourceCfnOutputAttributes(category, resourceName) {
    const resourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, resourceName);
    const resourceBuildDir = path.join(resourceDir, 'build');
    let cfnFilePath;
    if (fs.existsSync(resourceBuildDir)) {
        const cfnFiles = glob_1.glob.sync(cfnTemplateGlobPattern, {
            cwd: resourceBuildDir,
            ignore: [AUTH_TRIGGER_TEMPLATE],
        });
        if (cfnFiles.length > 0) {
            if (cfnFiles.length > 1) {
                amplify_prompts_1.printer.warn(`${resourceName} has more than one CloudFormation definitions in the resource folder which isn't permitted.`);
                return [];
            }
            else {
                if (resourceBuildDir && cfnFiles[0]) {
                    cfnFilePath = path.join(resourceBuildDir, cfnFiles[0]);
                }
            }
        }
    }
    if (!cfnFilePath) {
        const cfnFiles = glob_1.glob.sync(cfnTemplateGlobPattern, {
            cwd: resourceDir,
            ignore: [AUTH_TRIGGER_TEMPLATE],
        });
        if (cfnFiles.length > 1) {
            amplify_prompts_1.printer.warn(`${resourceName} has more than one CloudFormation definitions in the resource folder which isn't permitted.`);
            return [];
        }
        if (resourceDir && cfnFiles[0]) {
            cfnFilePath = path.join(resourceDir, cfnFiles[0]);
        }
    }
    if (cfnFilePath) {
        const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(cfnFilePath);
        if (cfnTemplate && cfnTemplate.Outputs) {
            const allOutputs = cfnTemplate.Outputs;
            const outputsWithoutConditions = {};
            for (const key of Object.keys(allOutputs)) {
                if (!allOutputs[key]['Condition']) {
                    outputsWithoutConditions[key] = allOutputs[key];
                }
            }
            return Object.keys(outputsWithoutConditions);
        }
    }
    return [];
}
exports.getResourceCfnOutputAttributes = getResourceCfnOutputAttributes;
function getAllResources() {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const categories = Object.keys(meta).filter((category) => category !== 'providers');
    const allResources = {};
    for (const category of categories) {
        const resourcesList = category in meta ? Object.keys(meta[category]) : [];
        if (lodash_1.default.isEmpty(resourcesList)) {
            continue;
        }
        for (const resourceName of resourcesList) {
            const isMobileHubImportedResource = lodash_1.default.get(meta, [category, resourceName, 'mobileHubMigrated'], false);
            if (isMobileHubImportedResource) {
                continue;
            }
            else {
                const resourceCfnOutputAttributes = getResourceCfnOutputAttributes(category, resourceName);
                if (resourceCfnOutputAttributes.length === 0) {
                    continue;
                }
                if (!allResources[category]) {
                    allResources[category] = {};
                }
                if (!allResources[category][resourceName]) {
                    allResources[category][resourceName] = {};
                }
                for (const attribute of resourceCfnOutputAttributes) {
                    if (attribute) {
                        allResources[category][resourceName][attribute] = 'string';
                    }
                }
            }
        }
    }
    return allResources;
}
exports.getAllResources = getAllResources;
function addCDKResourceDependency(stack, category, resourceName, dependentResources) {
    const dependsOn = [];
    const dependentParameters = {};
    dependentResources.forEach((resource) => {
        const attributeList = getResourceCfnOutputAttributes(resource.category, resource.resourceName);
        attributeList.forEach((attr) => {
            if (!dependentParameters[`${resource.category}`]) {
                dependentParameters[`${resource.category}`] = {};
            }
            if (!dependentParameters[`${resource.category}`][`${resource.resourceName}`]) {
                dependentParameters[`${resource.category}`][`${resource.resourceName}`] = {};
            }
            const parameterName = `${resource.category}${resource.resourceName}${attr}`;
            dependentParameters[`${resource.category}`][`${resource.resourceName}`][`${attr}`] = parameterName;
            new cdk.CfnParameter(stack, parameterName, {
                type: 'String',
            });
        });
        if (attributeList.length > 0) {
            dependsOn.push({
                category: resource.category,
                resourceName: resource.resourceName,
                attributes: attributeList,
            });
        }
    });
    if (dependsOn.length > 0) {
        addDependsOnToResource(category, resourceName, dependsOn);
    }
    return dependentParameters;
}
exports.addCDKResourceDependency = addCDKResourceDependency;
function addDependsOnToResource(category, resourceName, dependsOn) {
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    backendConfig[category][resourceName].dependsOn = dependsOn;
    amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
    const meta = amplify_cli_core_1.stateManager.getMeta();
    meta[category][resourceName].dependsOn = dependsOn;
    amplify_cli_core_1.stateManager.setMeta(undefined, meta);
}
async function addCFNResourceDependency(context, customResourceName) {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const existingDependentResources = {};
    if (amplifyMeta[constants_1.categoryName][customResourceName].dependsOn) {
        amplifyMeta[constants_1.categoryName][customResourceName].dependsOn.map((resource) => {
            if (!existingDependentResources[resource.category]) {
                existingDependentResources[resource.category] = [];
            }
            existingDependentResources[resource.category].push(resource.resourceName);
        });
    }
    const hasExistingResources = Object.keys(existingDependentResources).length > 0;
    if (!(await amplify_prompts_1.prompter.yesOrNo('Do you want to access Amplify generated resources in your custom CloudFormation file?', hasExistingResources))) {
        await context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, customResourceName, 'dependsOn', []);
        return;
    }
    const categories = Object.keys(amplifyMeta).filter((category) => category !== 'providers');
    const selectedCategories = await amplify_prompts_1.prompter.pick('Select the categories you want this custom resource to have access to.', categories, {
        returnSize: 'many',
        pickAtLeast: 1,
        initial: (0, amplify_prompts_1.byValues)(Object.keys(existingDependentResources)),
    });
    const resources = [];
    for (const selectedCategory of selectedCategories) {
        let resourcesList = selectedCategory in amplifyMeta ? Object.keys(amplifyMeta[selectedCategory]) : [];
        if (selectedCategory === constants_1.categoryName) {
            resourcesList = resourcesList.filter((name) => name !== customResourceName);
        }
        if (lodash_1.default.isEmpty(resourcesList)) {
            amplify_prompts_1.printer.warn(`No resources found for ${selectedCategory}`);
            continue;
        }
        try {
            let selectedResources = [];
            if (resourcesList.length > 1) {
                const resourceAnswer = await amplify_prompts_1.prompter.pick(`${lodash_1.default.capitalize(selectedCategory)} has ${resourcesList.length} resources in this project. Select the one you would like your custom resource to access`, resourcesList, {
                    returnSize: 'many',
                    initial: (0, amplify_prompts_1.byValues)([existingDependentResources[selectedCategory]]),
                });
                selectedResources = lodash_1.default.concat(resourceAnswer);
            }
            else {
                selectedResources = lodash_1.default.concat(resourcesList);
            }
            for (const resourceName of selectedResources) {
                const isMobileHubImportedResource = lodash_1.default.get(amplifyMeta, [selectedCategory, resourceName, 'mobileHubMigrated'], false);
                if (isMobileHubImportedResource) {
                    amplify_prompts_1.printer.warn(`Dependency cannot be added for ${selectedCategory}/${resourceName}, since it is a MobileHub imported resource.`);
                    continue;
                }
                else {
                    const resourceCfnOutputAttributes = getResourceCfnOutputAttributes(selectedCategory, resourceName);
                    if (resourceCfnOutputAttributes.length === 0) {
                        continue;
                    }
                    const resourceDefinition = {
                        category: selectedCategory,
                        resourceName: resourceName,
                        attributes: resourceCfnOutputAttributes,
                    };
                    resources.push(resourceDefinition);
                }
            }
        }
        catch (e) {
            amplify_prompts_1.printer.warn(`Dependencies cannot be added for ${selectedCategory}`);
            if (e.stack) {
                amplify_prompts_1.printer.warn(e.stack);
            }
            process.exitCode = 1;
        }
    }
    const resourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, customResourceName);
    const customResourceCFNFilename = `${customResourceName}-${constants_1.customResourceCFNFilenameSuffix}`;
    const customResourceCFNFilepath = path.resolve(path.join(resourceDir, customResourceCFNFilename));
    const customResourceCFNTemplate = (0, amplify_cli_core_1.readCFNTemplate)(customResourceCFNFilepath);
    const dependencyInputParams = generateInputParametersForDependencies(resources);
    if (!customResourceCFNTemplate.cfnTemplate.Parameters) {
        customResourceCFNTemplate.cfnTemplate.Parameters = {};
    }
    Object.assign(customResourceCFNTemplate.cfnTemplate.Parameters, dependencyInputParams);
    await (0, amplify_cli_core_1.writeCFNTemplate)(customResourceCFNTemplate.cfnTemplate, customResourceCFNFilepath, {
        templateFormat: customResourceCFNTemplate.templateFormat,
    });
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants_1.categoryName, customResourceName, 'dependsOn', resources);
}
exports.addCFNResourceDependency = addCFNResourceDependency;
function generateInputParametersForDependencies(resources) {
    const parameters = {};
    for (const resource of resources) {
        for (const attribute of resource.attributes || []) {
            parameters[`${resource.category}${resource.resourceName}${attribute}`] = {
                Type: 'String',
                Description: `Input parameter describing ${attribute} attribute for ${resource.category}/${resource.resourceName} resource`,
            };
        }
    }
    return parameters;
}
//# sourceMappingURL=dependency-management-utils.js.map