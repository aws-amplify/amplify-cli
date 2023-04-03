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
exports.setTransformerVersionFlag = exports.writeToCustomResourcesJson = exports.addCustomResolver = exports.setCustomRolesConfig = exports.updateConfig = exports.updateSchema = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const feature_flags_1 = require("./feature-flags");
function updateSchema(projectDir, projectName, schemaText) {
    const schemaPath = path.join(projectDir, 'amplify', 'backend', 'api', projectName, 'schema.graphql');
    fs.writeFileSync(schemaPath, schemaText);
}
exports.updateSchema = updateSchema;
function updateConfig(projectDir, projectName, config = {}) {
    const configPath = path.join(projectDir, 'amplify', 'backend', 'api', projectName, graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
}
exports.updateConfig = updateConfig;
function setCustomRolesConfig(projectDir, apiName, config = {}) {
    const configPath = path.join(projectDir, 'amplify', 'backend', 'api', apiName, 'custom-roles.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
exports.setCustomRolesConfig = setCustomRolesConfig;
function addCustomResolver(projectDir, apiName, resolverName, resolver) {
    const resolverPath = path.join(projectDir, 'amplify', 'backend', 'api', apiName, 'resolvers', resolverName);
    fs.writeFileSync(resolverPath, resolver);
}
exports.addCustomResolver = addCustomResolver;
function writeToCustomResourcesJson(projectDir, apiName, json) {
    const jsonPath = path.join(projectDir, 'amplify', 'backend', 'api', apiName, 'stacks', 'CustomResources.json');
    const customResourceJson = JSON.parse(fs.readFileSync(jsonPath).toString());
    const mergedJson = Object.assign(Object.assign({}, customResourceJson), json);
    fs.writeFileSync(jsonPath, JSON.stringify(mergedJson));
}
exports.writeToCustomResourcesJson = writeToCustomResourcesJson;
function setTransformerVersionFlag(cwd, transformerVersion) {
    if (transformerVersion === 1) {
        (0, feature_flags_1.addFeatureFlag)(cwd, 'graphqltransformer', 'transformerVersion', 1);
        (0, feature_flags_1.addFeatureFlag)(cwd, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false);
    }
}
exports.setTransformerVersionFlag = setTransformerVersionFlag;
//# sourceMappingURL=api.js.map