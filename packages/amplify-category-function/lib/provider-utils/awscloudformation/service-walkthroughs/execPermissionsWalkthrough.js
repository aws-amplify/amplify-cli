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
exports.generateEnvVariablesForCfn = exports.getResourcesForCfn = exports.askExecRolePermissionsQuestions = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const TransformPackage = __importStar(require("graphql-transformer-core"));
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../../constants");
const appSyncHelper_1 = require("../utils/appSyncHelper");
const cloudformationHelpers_1 = require("../utils/cloudformationHelpers");
const constants_2 = require("../utils/constants");
const permissionMapUtils_1 = require("../utils/permissionMapUtils");
const askExecRolePermissionsQuestions = async (context, resourceNameToUpdate, currentPermissionMap, currentEnvMap, category, serviceName) => {
    const generateGraphQLPermissions = amplify_cli_core_1.FeatureFlags.getBoolean('appSync.generateGraphQLPermissions');
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const categories = Object.keys(amplifyMeta).filter((category) => category !== 'providers' && category !== 'predictions');
    const appsyncResourceName = (0, appSyncHelper_1.getAppSyncResourceName)();
    if (!categories.includes('storage') && appsyncResourceName !== undefined) {
        categories.push('storage');
    }
    const categoryPermissionQuestion = selectCategories(categories, currentPermissionMap);
    const categoryPermissionAnswer = await inquirer_1.default.prompt(categoryPermissionQuestion);
    const selectedCategories = categoryPermissionAnswer.categories;
    const crudOptions = lodash_1.default.values(constants_1.CRUDOperation);
    const graphqlOperations = lodash_1.default.values(constants_1.GraphQLOperation);
    const categoryPolicies = [];
    const permissions = {};
    const resources = [];
    const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    for (const selectedCategory of selectedCategories) {
        let resourcesList = selectedCategory in amplifyMeta ? Object.keys(amplifyMeta[selectedCategory]) : [];
        resourcesList = resourcesList.filter((resourceName) => amplifyMeta[selectedCategory][resourceName].service !== "LambdaLayer");
        if (selectedCategory === 'storage' && 'api' in amplifyMeta) {
            if (appsyncResourceName) {
                const resourceDirPath = path_1.default.join(backendDir, 'api', appsyncResourceName);
                const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
                const directivesMap = TransformPackage.collectDirectivesByTypeNames(project.schema);
                const modelNames = Object.keys(directivesMap.types)
                    .filter((typeName) => directivesMap.types[typeName].includes('model'))
                    .map((modelName) => `${modelName}:${constants_2.appsyncTableSuffix}`);
                resourcesList.push(...modelNames);
            }
        }
        else if (selectedCategory === category || selectedCategory === constants_1.categoryName) {
            if (serviceName === "Lambda" || selectedCategory === constants_1.categoryName) {
                const selectedResource = lodash_1.default.get(amplifyMeta, [constants_1.categoryName, resourceNameToUpdate]);
                const isNewFunctionResource = !selectedResource;
                resourcesList = resourcesList.filter((resourceName) => resourceName !== resourceNameToUpdate &&
                    (isNewFunctionResource || amplifyMeta[selectedCategory][resourceName].service === selectedResource.service));
            }
            else {
                resourcesList = resourcesList.filter((resourceName) => resourceName !== resourceNameToUpdate && !amplifyMeta[selectedCategory][resourceName].iamAccessUnavailable);
            }
        }
        if (lodash_1.default.isEmpty(resourcesList)) {
            amplify_prompts_1.printer.warn(`No resources found for ${selectedCategory}`);
            continue;
        }
        try {
            let selectedResources = [];
            if (resourcesList.length > 1) {
                const resourceQuestion = selectResourcesInCategory(resourcesList, currentPermissionMap, selectedCategory);
                const resourceAnswer = await inquirer_1.default.prompt([resourceQuestion]);
                selectedResources = lodash_1.default.concat(resourceAnswer.resources);
            }
            else {
                selectedResources = lodash_1.default.concat(resourcesList);
            }
            for (const resourceName of selectedResources) {
                const serviceType = lodash_1.default.get(amplifyMeta, [selectedCategory, resourceName, 'service']);
                let options;
                switch (serviceType) {
                    case 'AppSync':
                        options = generateGraphQLPermissions ? graphqlOperations : crudOptions;
                        break;
                    default:
                        options = crudOptions;
                        break;
                }
                const isMobileHubImportedResource = lodash_1.default.get(amplifyMeta, [selectedCategory, resourceName, 'mobileHubMigrated'], false);
                if (isMobileHubImportedResource) {
                    amplify_prompts_1.printer.warn(`Policies cannot be added for ${selectedCategory}/${resourceName}, since it is a MobileHub imported resource.`);
                    continue;
                }
                else {
                    const currentPermissions = (0, permissionMapUtils_1.fetchPermissionsForResourceInCategory)(currentPermissionMap, selectedCategory, resourceName);
                    const permissionQuestion = selectPermissions(options, currentPermissions, resourceName);
                    const permissionAnswer = await inquirer_1.default.prompt([permissionQuestion]);
                    const resourcePolicy = permissionAnswer.options;
                    const { permissionPolicies, cfnResources } = await getResourcesForCfn(context, resourceName, resourcePolicy, appsyncResourceName, selectedCategory);
                    categoryPolicies.push(...permissionPolicies);
                    if (!permissions[selectedCategory]) {
                        permissions[selectedCategory] = {};
                    }
                    permissions[selectedCategory][resourceName] = resourcePolicy;
                    resources.push(...cfnResources);
                }
            }
        }
        catch (e) {
            if (e.name === 'PluginMethodNotFoundError') {
                amplify_prompts_1.printer.warn(`${selectedCategory} category does not support resource policies yet.`);
            }
            else {
                throw new amplify_cli_core_1.AmplifyError('PluginPolicyAddError', {
                    message: `Policies cannot be added for ${selectedCategory}`,
                    details: e.message,
                }, e);
            }
        }
    }
    const { environmentMap, dependsOn, envVarStringList } = await generateEnvVariablesForCfn(context, resources, currentEnvMap);
    return {
        dependsOn,
        topLevelComment: `${constants_1.topLevelCommentPrefix}${envVarStringList}${constants_1.topLevelCommentSuffix}`,
        environmentMap,
        mutableParametersState: { permissions },
        categoryPolicies,
    };
};
exports.askExecRolePermissionsQuestions = askExecRolePermissionsQuestions;
const selectResourcesInCategory = (choices, currentPermissionMap, category) => ({
    type: 'checkbox',
    name: 'resources',
    message: `${lodash_1.default.capitalize(category)} has ${choices.length} resources in this project. Select the one you would like your Lambda to access`,
    choices,
    default: (0, permissionMapUtils_1.fetchPermissionResourcesForCategory)(currentPermissionMap, category),
});
const selectCategories = (choices, currentPermissionMap) => ({
    type: 'checkbox',
    name: 'categories',
    message: 'Select the categories you want this function to have access to.',
    choices,
    default: (0, permissionMapUtils_1.fetchPermissionCategories)(currentPermissionMap),
});
const selectPermissions = (choices, currentPermissions, resourceName) => ({
    type: 'checkbox',
    name: 'options',
    message: `Select the operations you want to permit on ${resourceName}`,
    choices,
    validate: (answers) => (lodash_1.default.isEmpty(answers) ? 'You must select at least one operation' : true),
    default: currentPermissions,
});
async function getResourcesForCfn(context, resourceName, resourcePolicy, appsyncResourceName, selectedCategory) {
    if (resourceName.endsWith(constants_2.appsyncTableSuffix)) {
        resourcePolicy.providerPlugin = 'awscloudformation';
        resourcePolicy.service = 'DynamoDB';
        const dynamoDBTableARNComponents = await (0, cloudformationHelpers_1.constructCFModelTableArnComponent)(appsyncResourceName, resourceName, constants_2.appsyncTableSuffix);
        resourcePolicy.customPolicyResource = [
            {
                'Fn::Join': ['', dynamoDBTableARNComponents],
            },
            {
                'Fn::Join': ['', [...dynamoDBTableARNComponents, '/index/*']],
            },
        ];
    }
    const { permissionPolicies, resourceAttributes } = await context.amplify.invokePluginMethod(context, selectedCategory, resourceName, 'getPermissionPolicies', [context, { [resourceName]: resourcePolicy }]);
    const cfnResources = await Promise.all(resourceAttributes.map(async (attributes) => {
        var _a;
        return ((_a = attributes.resourceName) === null || _a === void 0 ? void 0 : _a.endsWith(constants_2.appsyncTableSuffix))
            ? {
                resourceName: appsyncResourceName,
                category: 'api',
                attributes: ['GraphQLAPIIdOutput'],
                needsAdditionalDynamoDBResourceProps: true,
                _modelName: attributes.resourceName.replace(`:${constants_2.appsyncTableSuffix}`, 'Table'),
                _cfJoinComponentTableName: await (0, cloudformationHelpers_1.constructCFModelTableNameComponent)(appsyncResourceName, attributes.resourceName, constants_2.appsyncTableSuffix),
                _cfJoinComponentTableArn: await (0, cloudformationHelpers_1.constructCFModelTableArnComponent)(appsyncResourceName, attributes.resourceName, constants_2.appsyncTableSuffix),
            }
            : attributes;
    }));
    return { permissionPolicies, cfnResources };
}
exports.getResourcesForCfn = getResourcesForCfn;
async function generateEnvVariablesForCfn(context, resources, currentEnvMap) {
    const environmentMap = {};
    const envVars = new Set();
    const dependsOn = [];
    resources.forEach((resource) => {
        const { category, resourceName, attributes } = resource;
        if (resource.needsAdditionalDynamoDBResourceProps) {
            const modelEnvPrefix = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${resource._modelName.toUpperCase()}`;
            const modelEnvNameKey = `${modelEnvPrefix}_NAME`;
            const modelEnvArnKey = `${modelEnvPrefix}_ARN`;
            environmentMap[modelEnvNameKey] = resource._cfJoinComponentTableName;
            environmentMap[modelEnvArnKey] = {
                'Fn::Join': ['', resource._cfJoinComponentTableArn],
            };
            envVars.add(modelEnvNameKey);
            envVars.add(modelEnvArnKey);
        }
        attributes.forEach((attribute) => {
            const envName = `${category.toUpperCase()}_${resourceName.toUpperCase()}_${attribute.toUpperCase()}`;
            const refName = `${category}${resourceName}${attribute}`;
            environmentMap[envName] = { Ref: refName };
            envVars.add(envName);
        });
        if (!dependsOn.find((dep) => dep.resourceName === resourceName && dep.category === category)) {
            dependsOn.push({
                category: resource.category,
                resourceName: resource.resourceName,
                attributes: resource.attributes,
            });
        }
    });
    if (currentEnvMap) {
        lodash_1.default.keys(currentEnvMap).forEach((key) => {
            envVars.add(key);
        });
    }
    const envVarStringList = Array.from(envVars).sort().join('\n\t');
    if (envVarStringList) {
        amplify_prompts_1.printer.info(`${constants_1.envVarPrintoutPrefix}${envVarStringList}`);
    }
    return { environmentMap, dependsOn, envVarStringList };
}
exports.generateEnvVariablesForCfn = generateEnvVariablesForCfn;
//# sourceMappingURL=execPermissionsWalkthrough.js.map