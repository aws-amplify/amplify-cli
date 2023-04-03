"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateCfnParams = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const api_1 = require("../../api/api");
const populateCfnParams = (resourceName, overrideApiToLocal = false) => [getCfnPseudoParams, getAmplifyMetaParams, getParametersJsonParams, getResourceEnvParams]
    .map((paramProvider) => paramProvider(resourceName, overrideApiToLocal))
    .reduce((acc, it) => ({ ...acc, ...it }), {});
exports.populateCfnParams = populateCfnParams;
const getCfnPseudoParams = () => {
    var _a, _b;
    const env = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
    const providerMeta = (_b = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation;
    const region = (providerMeta === null || providerMeta === void 0 ? void 0 : providerMeta.Region) || 'us-test-1';
    const stackId = (providerMeta === null || providerMeta === void 0 ? void 0 : providerMeta.StackId) || 'fake-stack-id';
    const stackName = (providerMeta === null || providerMeta === void 0 ? void 0 : providerMeta.StackName) || 'local-testing';
    const accountIdMatcher = /arn:aws:cloudformation:.+:(?<accountId>\d+):stack\/.+/;
    const match = accountIdMatcher.exec(stackId);
    const accountId = match ? match.groups.accountId : '12345678910';
    return {
        env,
        'AWS::Region': region,
        'AWS::AccountId': accountId,
        'AWS::StackId': stackId,
        'AWS::StackName': stackName,
        'AWS::URLSuffix': 'amazonaws.com',
    };
};
const getAmplifyMetaParams = (resourceName, overrideApiToLocal = false) => {
    var _a, _b, _c, _d;
    const projectMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!Array.isArray((_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _a === void 0 ? void 0 : _a[resourceName]) === null || _b === void 0 ? void 0 : _b.dependsOn)) {
        return {};
    }
    const dependencies = (_d = (_c = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _c === void 0 ? void 0 : _c[resourceName]) === null || _d === void 0 ? void 0 : _d.dependsOn;
    return dependencies.reduce((acc, dependency) => {
        dependency.attributes.forEach((attribute) => {
            var _a, _b, _c;
            let val = (_c = (_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta[dependency.category]) === null || _a === void 0 ? void 0 : _a[dependency.resourceName]) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c[attribute];
            if (overrideApiToLocal) {
                switch (attribute) {
                    case api_1.GRAPHQL_API_ENDPOINT_OUTPUT:
                        val = `http://localhost:${api_1.MOCK_API_PORT}/graphql`;
                        break;
                    case api_1.GRAPHQL_API_KEY_OUTPUT:
                        val = api_1.MOCK_API_KEY;
                        break;
                    default:
                }
            }
            if (!val) {
                amplify_prompts_1.printer.warn(`No output found for attribute '${attribute}' on resource '${dependency.resourceName}' in category '${dependency.category}'`);
                amplify_prompts_1.printer.warn('This attribute will be undefined in the mock environment until you run `amplify push`');
            }
            acc[dependency.category + dependency.resourceName + attribute] = val;
        });
        return acc;
    }, {});
};
const getParametersJsonParams = (resourceName) => { var _a; return (_a = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'function', resourceName, { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : {}; };
const getResourceEnvParams = (resourceName) => (0, amplify_environment_parameters_1.getEnvParamManager)().getResourceParamManager('function', resourceName).getAllParams();
//# sourceMappingURL=populate-cfn-params.js.map