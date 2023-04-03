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
exports.loadApiCliInputs = exports.CrudOperation = exports.consolidateApiGatewayPolicies = exports.ApiGatewayAuthStack = exports.APIGW_AUTH_STACK_LOGICAL_ID = void 0;
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const constants_1 = require("../constants");
exports.APIGW_AUTH_STACK_LOGICAL_ID = 'APIGatewayAuthStack';
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const MAX_MANAGED_POLICY_SIZE = 6144;
const S3_UPLOAD_PATH = `${amplify_cli_core_1.AmplifyCategories.API}/${exports.APIGW_AUTH_STACK_LOGICAL_ID}.json`;
const AUTH_ROLE_NAME = 'authRoleName';
const UNAUTH_ROLE_NAME = 'unauthRoleName';
class ApiGatewayAuthStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        const authRoleName = new cdk.CfnParameter(this, AUTH_ROLE_NAME, {
            type: 'String',
        });
        const unauthRoleName = new cdk.CfnParameter(this, UNAUTH_ROLE_NAME, {
            type: 'String',
        });
        const env = new cdk.CfnParameter(this, 'env', {
            type: 'String',
        });
        new cdk.CfnCondition(this, 'ShouldNotCreateEnvResources', {
            expression: cdk.Fn.conditionEquals(env, 'NONE'),
        });
        let authRoleCount = 0;
        let unauthRoleCount = 0;
        let authPolicyDocSize = 0;
        let unauthPolicyDocSize = 0;
        let authManagedPolicy;
        let unauthManagedPolicy;
        props.apiGateways.forEach((apiGateway) => {
            const apiRef = new cdk.CfnParameter(this, apiGateway.resourceName, {
                type: 'String',
            });
            const state = {
                apiGateway,
                apiRef,
                envName: props.envName,
                env,
                path: null,
                methods: null,
                roleCount: 0,
                roleName: null,
                policyDocSize: 0,
                managedPolicy: null,
                namePrefix: '',
            };
            Object.keys(apiGateway.params.paths).forEach((pathName) => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                state.path = apiGateway.params.paths[pathName];
                state.path.name = pathName;
                if (Array.isArray((_d = (_c = (_b = (_a = apiGateway === null || apiGateway === void 0 ? void 0 : apiGateway.params) === null || _a === void 0 ? void 0 : _a.paths) === null || _b === void 0 ? void 0 : _b[pathName]) === null || _c === void 0 ? void 0 : _c.permissions) === null || _d === void 0 ? void 0 : _d.auth)) {
                    state.methods = convertCrudOperationsToPermissions(apiGateway.params.paths[pathName].permissions.auth);
                    state.roleCount = authRoleCount;
                    state.roleName = authRoleName;
                    state.policyDocSize = authPolicyDocSize;
                    state.managedPolicy = authManagedPolicy;
                    state.namePrefix = 'PolicyAPIGWAuth';
                    this.createPoliciesFromResources(state);
                    ({ roleCount: authRoleCount, policyDocSize: authPolicyDocSize, managedPolicy: authManagedPolicy } = state);
                }
                if (Array.isArray((_h = (_g = (_f = (_e = apiGateway === null || apiGateway === void 0 ? void 0 : apiGateway.params) === null || _e === void 0 ? void 0 : _e.paths) === null || _f === void 0 ? void 0 : _f[pathName]) === null || _g === void 0 ? void 0 : _g.permissions) === null || _h === void 0 ? void 0 : _h.guest)) {
                    state.methods = convertCrudOperationsToPermissions(apiGateway.params.paths[pathName].permissions.guest);
                    state.roleCount = unauthRoleCount;
                    state.roleName = unauthRoleName;
                    state.policyDocSize = unauthPolicyDocSize;
                    state.managedPolicy = unauthManagedPolicy;
                    state.namePrefix = 'PolicyAPIGWUnauth';
                    this.createPoliciesFromResources(state);
                    ({ roleCount: unauthRoleCount, policyDocSize: unauthPolicyDocSize, managedPolicy: unauthManagedPolicy } = state);
                }
            });
        });
    }
    toCloudFormation() {
        return this._toCloudFormation();
    }
    createPoliciesFromResources(options) {
        const { apiRef, env, roleName, path, methods, namePrefix, envName } = options;
        const apiPath = String(path.name).replace(/{[a-zA-Z0-9-]+}/g, '*');
        methods.forEach((method) => {
            const policySizeIncrease = computePolicySizeIncrease(envName.length, method.length, apiPath.length);
            options.policyDocSize += policySizeIncrease;
            if (options.roleCount === 0 || options.policyDocSize > MAX_MANAGED_POLICY_SIZE) {
                options.policyDocSize = 104 + policySizeIncrease;
                ++options.roleCount;
                options.managedPolicy = createManagedPolicy(this, `${namePrefix}${options.roleCount}`, roleName);
            }
            options.managedPolicy.policyDocument.Statement[0].Resource.push(createApiResource(this.region, this.account, apiRef, env, method, appendToUrlPath(apiPath, '*')), createApiResource(this.region, this.account, apiRef, env, method, apiPath));
        });
    }
}
exports.ApiGatewayAuthStack = ApiGatewayAuthStack;
const createManagedPolicy = (stack, policyName, roleName) => new iam.CfnManagedPolicy(stack, policyName, {
    roles: [roleName],
    policyDocument: {
        Version: '2012-10-17',
        Statement: [{ Effect: 'Allow', Action: ['execute-api:Invoke'], Resource: [] }],
    },
});
function createApiResource(regionRef, accountRef, apiNameRef, envRef, method, apiPath) {
    return cdk.Fn.join('', [
        'arn:aws:execute-api:',
        regionRef,
        ':',
        accountRef,
        ':',
        apiNameRef,
        '/',
        cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', envRef),
        method,
        apiPath,
    ]);
}
const computePolicySizeIncrease = (stageLength, methodLength, pathLength) => 2 * (64 + stageLength + methodLength + pathLength);
async function consolidateApiGatewayPolicies(context, stackName) {
    var _a;
    const apiGateways = [];
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const envInfo = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    const apis = (_a = meta === null || meta === void 0 ? void 0 : meta.api) !== null && _a !== void 0 ? _a : {};
    for (const [resourceName, resource] of Object.entries(apis)) {
        const cliInputs = await (0, exports.loadApiCliInputs)(context, resourceName, resource);
        if (cliInputs) {
            const api = { ...resource, resourceName, params: cliInputs };
            apiGateways.push(api);
        }
    }
    try {
        const cfnPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.API, `${exports.APIGW_AUTH_STACK_LOGICAL_ID}.json`);
        fs.unlinkSync(cfnPath);
    }
    catch (_b) {
    }
    if (apiGateways.length === 0) {
        return { APIGatewayAuthURL: undefined };
    }
    return { APIGatewayAuthURL: createApiGatewayAuthResources(stackName, apiGateways, envInfo.envName) };
}
exports.consolidateApiGatewayPolicies = consolidateApiGatewayPolicies;
var CrudOperation;
(function (CrudOperation) {
    CrudOperation["CREATE"] = "create";
    CrudOperation["READ"] = "read";
    CrudOperation["UPDATE"] = "update";
    CrudOperation["DELETE"] = "delete";
})(CrudOperation = exports.CrudOperation || (exports.CrudOperation = {}));
const convertCrudOperationsToPermissions = (crudOps) => {
    const opMap = {
        [CrudOperation.CREATE]: ['/POST'],
        [CrudOperation.READ]: ['/GET'],
        [CrudOperation.UPDATE]: ['/PUT', '/PATCH'],
        [CrudOperation.DELETE]: ['/DELETE'],
    };
    const possibleMethods = Object.values(opMap).flat();
    const methods = crudOps.flatMap((op) => opMap[op]);
    return possibleMethods.every((m) => methods.includes(m)) ? ['/*'] : methods;
};
const createApiGatewayAuthResources = (stackName, apiGateways, envName) => {
    var _a, _b, _c;
    const stack = new ApiGatewayAuthStack(undefined, 'Amplify', {
        description: 'API Gateway policy stack created using Amplify CLI',
        stackName,
        apiGateways,
        envName,
    });
    const cfn = stack.toCloudFormation();
    const { DeploymentBucketName } = (_c = (_b = (_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.providers) === null || _b === void 0 ? void 0 : _b[constants_1.ProviderName]) !== null && _c !== void 0 ? _c : {};
    const cfnPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.API, `${exports.APIGW_AUTH_STACK_LOGICAL_ID}.json`);
    if (!cfn.Resources || Object.keys(cfn.Resources).length === 0) {
        return undefined;
    }
    amplify_cli_core_1.JSONUtilities.writeJson(cfnPath, cfn);
    return `https://s3.amazonaws.com/${DeploymentBucketName}/amplify-cfn-templates/${S3_UPLOAD_PATH}`;
};
const loadApiCliInputs = async (context, resourceName, resource) => {
    if (resource.providerPlugin !== constants_1.ProviderName || resource.service !== amplify_cli_core_1.AmplifySupportedService.APIGW || resourceName === 'AdminQueries') {
        return undefined;
    }
    const projectRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!amplify_cli_core_1.stateManager.resourceInputsJsonExists(projectRoot, amplify_cli_core_1.AmplifyCategories.API, resourceName)) {
        const deprecatedParamsFileName = 'api-params.json';
        const deprecatedParamsFilePath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectRoot, amplify_cli_core_1.AmplifyCategories.API, resourceName), deprecatedParamsFileName);
        if (fs.existsSync(deprecatedParamsFilePath)) {
            if (!amplify_cli_core_1.stateManager.resourceInputsJsonExists(projectRoot, amplify_cli_core_1.AmplifyCategories.API, resourceName)) {
                return {
                    paths: await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.API, amplify_cli_core_1.AmplifySupportedService.APIGW, 'convertDeperecatedRestApiPaths', [deprecatedParamsFileName, deprecatedParamsFilePath, resourceName]),
                };
            }
        }
    }
    return amplify_cli_core_1.stateManager.getResourceInputsJson(projectRoot, amplify_cli_core_1.AmplifyCategories.API, resourceName, { throwIfNotExist: false });
};
exports.loadApiCliInputs = loadApiCliInputs;
const appendToUrlPath = (path, postfix) => path.charAt(path.length - 1) === '/' ? `${path}${postfix}` : `${path}/${postfix}`;
//# sourceMappingURL=consolidate-apigw-policies.js.map