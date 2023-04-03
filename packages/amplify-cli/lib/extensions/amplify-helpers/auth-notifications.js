"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifySecurityEnhancement = exports.hasV2AuthDirectives = exports.hasFieldAuthDirectives = exports.displayAuthNotification = exports.notifyListQuerySecurityChange = exports.notifyFieldAuthSecurityChange = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const graphql_1 = require("graphql");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const path_1 = __importDefault(require("path"));
const setNotificationFlag = async (projectPath, flagName, value) => {
    await amplify_cli_core_1.FeatureFlags.ensureFeatureFlag('graphqltransformer', flagName);
    const config = amplify_cli_core_1.stateManager.getCLIJSON(projectPath, undefined, {
        throwIfNotExist: false,
        preserveComments: true,
    });
    if (config) {
        config.features.graphqltransformer[flagName] = value;
        amplify_cli_core_1.stateManager.setCLIJSON(projectPath, config);
        await amplify_cli_core_1.FeatureFlags.reloadValues();
    }
};
const notifyFieldAuthSecurityChange = async (context) => {
    var _a;
    const flagName = 'showFieldAuthNotification';
    const doNotShowNotification = !amplify_cli_core_1.FeatureFlags.getBoolean(`graphqltransformer.${flagName}`);
    if (doNotShowNotification)
        return false;
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const apiResourceDir = await getApiResourceDir();
    if (!apiResourceDir) {
        await setNotificationFlag(projectPath, flagName, false);
        return false;
    }
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(apiResourceDir);
    const directiveMap = (0, graphql_transformer_core_1.collectDirectivesByType)(project.schema);
    const doc = (0, graphql_1.parse)(project.schema);
    const fieldDirectives = (0, exports.hasFieldAuthDirectives)(doc);
    let schemaModified = false;
    if ((0, exports.displayAuthNotification)(directiveMap, fieldDirectives)) {
        amplify_prompts_1.printer.blankLine();
        const continueChange = await amplify_prompts_1.prompter.yesOrNo(`This version of Amplify CLI introduces additional security enhancements for your GraphQL API. ` +
            `The changes are applied automatically with this deployment. This change won't impact your client code. Continue?`);
        if (!continueChange) {
            await context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
        await modifyGraphQLSchema(apiResourceDir);
        schemaModified = true;
    }
    await setNotificationFlag(projectPath, flagName, false);
    return schemaModified;
};
exports.notifyFieldAuthSecurityChange = notifyFieldAuthSecurityChange;
const loadResolvers = async (apiResourceDirectory) => {
    const resolvers = {};
    const resolverDirectory = path_1.default.join(apiResourceDirectory, 'build', 'resolvers');
    const resolverDirExists = fs_extra_1.default.existsSync(resolverDirectory);
    if (resolverDirExists) {
        const resolverFiles = await fs_extra_1.default.readdir(resolverDirectory);
        for (const resolverFile of resolverFiles) {
            if (resolverFile.indexOf('.') === 0) {
                continue;
            }
            const resolverFilePath = path_1.default.join(resolverDirectory, resolverFile);
            resolvers[resolverFile] = await fs_extra_1.default.readFile(resolverFilePath, 'utf8');
        }
    }
    return resolvers;
};
const notifyListQuerySecurityChange = async (context) => {
    const apiResourceDir = await getApiResourceDir();
    if (!apiResourceDir) {
        return false;
    }
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(apiResourceDir);
    const resolvers = await loadResolvers(apiResourceDir);
    const resolversToCheck = Object.entries(resolvers)
        .filter(([resolverFileName, __]) => resolverFileName.startsWith('Query.list') && resolverFileName.endsWith('.req.vtl'))
        .map(([__, resolverCode]) => resolverCode);
    const listQueryPattern = /#set\( \$filterExpression = \$util\.parseJson\(\$util\.transform\.toDynamoDBFilterExpression\(\$filter\)\) \)\s*(?!\s*#if\( \$util\.isNullOrEmpty\(\$filterExpression\) \))/gm;
    const resolversToSecure = resolversToCheck.filter((resolver) => listQueryPattern.test(resolver));
    if (resolversToSecure.length === 0) {
        return false;
    }
    const doc = (0, graphql_1.parse)(project.schema);
    let schemaModified = false;
    if ((0, exports.hasV2AuthDirectives)(doc)) {
        amplify_prompts_1.printer.blankLine();
        const continueChange = await amplify_prompts_1.prompter.yesOrNo(`This version of Amplify CLI introduces additional security enhancements for your GraphQL API. ` +
            `The changes are applied automatically with this deployment. This change won't impact your client code. Continue?`);
        if (!continueChange) {
            await context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
        await modifyGraphQLSchema(apiResourceDir);
        schemaModified = true;
    }
    return schemaModified;
};
exports.notifyListQuerySecurityChange = notifyListQuerySecurityChange;
const containsGraphQLApi = async () => {
    var _a;
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const apiNames = Object.entries((meta === null || meta === void 0 ? void 0 : meta.api) || {})
        .filter(([__, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    const doesNotHaveGqlApi = apiNames.length < 1;
    if (doesNotHaveGqlApi) {
        return false;
    }
    const apiName = apiNames[0];
    const apiResourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
    if (!fs_extra_1.default.existsSync(apiResourceDir)) {
        return false;
    }
    return true;
};
const getApiResourceDir = async () => {
    var _a;
    const hasGraphQLApi = await containsGraphQLApi();
    if (!hasGraphQLApi) {
        return undefined;
    }
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const apiNames = Object.entries((meta === null || meta === void 0 ? void 0 : meta.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    const apiName = apiNames[0];
    const apiResourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
    return apiResourceDir;
};
const modifyGraphQLSchema = async (apiResourceDir) => {
    const schemaFilePath = path_1.default.join(apiResourceDir, 'schema.graphql');
    const schemaDirectoryPath = path_1.default.join(apiResourceDir, 'schema');
    const schemaFileExists = fs_extra_1.default.existsSync(schemaFilePath);
    const schemaDirectoryExists = fs_extra_1.default.existsSync(schemaDirectoryPath);
    if (schemaFileExists) {
        await fs_extra_1.default.appendFile(schemaFilePath, ' ');
    }
    else if (schemaDirectoryExists) {
        await modifyGraphQLSchemaDirectory(schemaDirectoryPath);
    }
};
const modifyGraphQLSchemaDirectory = async (schemaDirectoryPath) => {
    const files = await fs_extra_1.default.readdir(schemaDirectoryPath);
    for (const fileName of files) {
        const isHiddenFile = fileName.indexOf('.') === 0;
        if (isHiddenFile) {
            continue;
        }
        const fullPath = path_1.default.join(schemaDirectoryPath, fileName);
        const stats = await fs_extra_1.default.lstat(fullPath);
        if (stats.isDirectory() && (await modifyGraphQLSchemaDirectory(fullPath))) {
            return true;
        }
        if (stats.isFile()) {
            await fs_extra_1.default.appendFile(fullPath, ' ');
            return true;
        }
    }
    return false;
};
const displayAuthNotification = (directiveMap, fieldDirectives) => {
    const usesTransformerV2 = amplify_cli_core_1.FeatureFlags.getNumber('graphqltransformer.transformerVersion') === 2;
    const schemaHasValues = Object.keys(directiveMap).some((typeName) => {
        const typeObj = directiveMap[typeName];
        const modelDirective = typeObj.find((dir) => dir.name.value === 'model');
        const subscriptionOff = ((modelDirective === null || modelDirective === void 0 ? void 0 : modelDirective.arguments) || []).some((arg) => {
            var _a, _b;
            if (arg.name.value === 'subscriptions') {
                const subscriptionNull = arg.value.kind === 'NullValue';
                const levelFieldOffOrNull = (_b = (_a = arg.value) === null || _a === void 0 ? void 0 : _a.fields) === null || _b === void 0 ? void 0 : _b.some(({ name, value }) => name.value === 'level' && (value.value === 'off' || value.kind === 'NullValue'));
                return levelFieldOffOrNull || subscriptionNull;
            }
            return undefined;
        });
        return subscriptionOff && fieldDirectives.has(typeName);
    });
    return schemaHasValues && usesTransformerV2;
};
exports.displayAuthNotification = displayAuthNotification;
const hasFieldAuthDirectives = (doc) => {
    var _a;
    const haveFieldAuthDir = new Set();
    (_a = doc.definitions) === null || _a === void 0 ? void 0 : _a.forEach((def) => {
        const withAuth = (def.fields || []).filter((field) => {
            var _a;
            const nonNullable = field.type.kind === 'NonNullType';
            const hasAuth = (_a = field.directives) === null || _a === void 0 ? void 0 : _a.some((dir) => dir.name.value === 'auth');
            return hasAuth && nonNullable;
        });
        if (withAuth.length > 0) {
            haveFieldAuthDir.add(def.name.value);
        }
    });
    return haveFieldAuthDir;
};
exports.hasFieldAuthDirectives = hasFieldAuthDirectives;
const hasV2AuthDirectives = (doc) => {
    var _a;
    let containsAuthDir = false;
    const usesTransformerV2 = amplify_cli_core_1.FeatureFlags.getNumber('graphqltransformer.transformerVersion') === 2;
    (_a = doc.definitions) === null || _a === void 0 ? void 0 : _a.forEach((def) => {
        var _a;
        if ((_a = def.directives) === null || _a === void 0 ? void 0 : _a.some((dir) => dir.name.value === 'auth')) {
            containsAuthDir = true;
        }
    });
    return containsAuthDir && usesTransformerV2;
};
exports.hasV2AuthDirectives = hasV2AuthDirectives;
const notifySecurityEnhancement = async (context) => {
    var _a;
    if (amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.securityEnhancementNotification')) {
        const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
        const meta = amplify_cli_core_1.stateManager.getMeta();
        const apiNames = Object.entries((meta === null || meta === void 0 ? void 0 : meta.api) || {})
            .filter(([_, apiResource]) => apiResource.service === 'AppSync')
            .map(([name]) => name);
        if (apiNames.length !== 1) {
            await setNotificationFlag(projectPath, 'securityEnhancementNotification', false);
            return;
        }
        const apiName = apiNames[0];
        const apiResourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
        if (!fs_extra_1.default.existsSync(apiResourceDir)) {
            await setNotificationFlag(projectPath, 'securityEnhancementNotification', false);
            return;
        }
        const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(apiResourceDir);
        const directiveMap = (0, graphql_transformer_core_1.collectDirectivesByTypeNames)(project.schema);
        const notifyAuthWithKey = Object.keys(directiveMap.types).some((type) => directiveMap.types[type].includes('auth') && directiveMap.types[type].includes('primaryKey'));
        if ((meta === null || meta === void 0 ? void 0 : meta.auth) && notifyAuthWithKey) {
            amplify_prompts_1.printer.blankLine();
            const shouldContinue = await amplify_prompts_1.prompter.yesOrNo(`This version of Amplify CLI introduces additional security enhancements for your GraphQL API. @auth authorization rules applied on primary keys and indexes are scoped down further. The changes are applied automatically with this deployment. This change won't impact your client code. Continue`);
            if (!shouldContinue) {
                await context.usageData.emitSuccess();
                (0, amplify_cli_core_1.exitOnNextTick)(0);
            }
            await modifyGraphQLSchema(apiResourceDir);
            await setNotificationFlag(projectPath, 'securityEnhancementNotification', false);
        }
        else {
            await setNotificationFlag(projectPath, 'securityEnhancementNotification', false);
        }
    }
};
exports.notifySecurityEnhancement = notifySecurityEnhancement;
//# sourceMappingURL=auth-notifications.js.map