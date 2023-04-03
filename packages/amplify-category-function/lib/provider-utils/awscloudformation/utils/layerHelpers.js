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
exports.getChangedResources = exports.hashLayerResource = exports.loadPreviousLayerHash = exports.ensureLayerVersion = exports.getLambdaFunctionsDependentOnLayerFromMeta = exports.getLayerName = exports.isMultiEnvLayer = exports.isNewVersion = exports.loadStoredLayerParameters = exports.layerInputParamsToLayerPermissionArray = exports.previousPermissionsQuestion = exports.layerOrgAccessPrompt = exports.layerAccountAccessPrompt = exports.layerPermissionsQuestion = exports.layerNameQuestion = exports.layerVersionQuestion = exports.mapVersionNumberToChoice = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const crypto_1 = __importDefault(require("crypto"));
const folder_hash_1 = require("folder-hash");
const fs = __importStar(require("fs-extra"));
const globby_1 = __importDefault(require("globby"));
const inquirer_1 = require("inquirer");
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const constants_1 = require("../../../constants");
const constants_2 = require("./constants");
const layerConfiguration_1 = require("./layerConfiguration");
const layerParams_1 = require("./layerParams");
const storeResources_1 = require("./storeResources");
const layerResourceGlobs = [constants_2.parametersFileName, `*${constants_2.cfnTemplateSuffix}`];
const libPathName = 'lib';
const optPathName = 'opt';
const packageJson = 'package.json';
const pipfile = 'Pipfile';
const pipfileLock = 'Pipfile.lock';
function mapVersionNumberToChoice(layerVersion) {
    return `${layerVersion.Version}: ${layerVersion.Description || '(no description)'}`;
}
exports.mapVersionNumberToChoice = mapVersionNumberToChoice;
function layerVersionQuestion(versions, message, defaultOption) {
    return {
        type: 'list',
        name: 'versionSelection',
        message,
        choices: versions,
        default: defaultOption || 0,
    };
}
exports.layerVersionQuestion = layerVersionQuestion;
function layerNameQuestion(projectName) {
    return {
        type: 'input',
        name: 'layerName',
        message: 'Provide a name for your Lambda layer:',
        validate: (input) => {
            var _a, _b;
            input = input.trim();
            const meta = amplify_cli_core_1.stateManager.getMeta();
            if (!/^[a-zA-Z0-9]{1,87}$/.test(input)) {
                return 'Lambda layer names must be 1-87 alphanumeric characters long.';
            }
            else if (((_a = meta === null || meta === void 0 ? void 0 : meta.function) === null || _a === void 0 ? void 0 : _a.input) || ((_b = meta === null || meta === void 0 ? void 0 : meta.function) === null || _b === void 0 ? void 0 : _b[`${projectName}${input}`])) {
                return `A Lambda layer with the name ${input} already exists in this project.`;
            }
            return true;
        },
        default: `layer${(0, uuid_1.v4)().split('-')[0]}`,
    };
}
exports.layerNameQuestion = layerNameQuestion;
function layerPermissionsQuestion(params) {
    return {
        type: 'checkbox',
        name: 'layerPermissions',
        message: 'The current AWS account will always have access to this layer.\nOptionally, configure who else can access this layer. (Hit <Enter> to skip)',
        choices: [
            {
                name: 'Specific AWS accounts',
                value: layerParams_1.PermissionEnum.AwsAccounts,
                checked: lodash_1.default.includes(params, layerParams_1.PermissionEnum.AwsAccounts),
            },
            {
                name: 'Specific AWS organization',
                value: layerParams_1.PermissionEnum.AwsOrg,
                checked: lodash_1.default.includes(params, layerParams_1.PermissionEnum.AwsOrg),
            },
            {
                name: 'Public (Anyone on AWS can use this layer)',
                short: 'Public',
                value: layerParams_1.PermissionEnum.Public,
                checked: lodash_1.default.includes(params, layerParams_1.PermissionEnum.Public),
            },
        ],
        default: [layerParams_1.PermissionEnum.Private],
    };
}
exports.layerPermissionsQuestion = layerPermissionsQuestion;
async function layerAccountAccessPrompt(defaultAccountIds) {
    const hasDefaults = defaultAccountIds && defaultAccountIds.length > 0;
    const answer = await (0, inquirer_1.prompt)({
        type: 'input',
        name: 'authorizedAccountIds',
        message: 'Provide a list of comma-separated AWS account IDs:',
        validate: (input) => {
            const accounts = input.split(',');
            for (const accountId of accounts) {
                if (!/^[0-9]{12}$/.test(accountId.trim())) {
                    return `AWS account IDs must be 12 digits long. ${accountId} did not match the criteria.`;
                }
            }
            return true;
        },
        default: hasDefaults ? defaultAccountIds.join(',') : undefined,
    });
    return lodash_1.default.uniq(answer.authorizedAccountIds.split(',').map((accountId) => accountId.trim()));
}
exports.layerAccountAccessPrompt = layerAccountAccessPrompt;
async function layerOrgAccessPrompt(defaultOrgs) {
    const hasDefaults = defaultOrgs && defaultOrgs.length > 0;
    const answer = await (0, inquirer_1.prompt)({
        type: 'input',
        name: 'authorizedOrgIds',
        message: 'Provide a list of comma-separated AWS organization IDs:',
        validate: (input) => {
            const orgIds = input.split(',');
            for (const orgId of orgIds) {
                if (!/^o-[a-zA-Z0-9]{10,32}$/.test(orgId.trim())) {
                    return 'The organization ID starts with "o-" followed by a 10-32 character-long alphanumeric string.';
                }
            }
            return true;
        },
        default: hasDefaults ? defaultOrgs.join(',') : undefined,
    });
    return lodash_1.default.uniq(answer.authorizedOrgIds.split(',').map((orgId) => orgId.trim()));
}
exports.layerOrgAccessPrompt = layerOrgAccessPrompt;
function previousPermissionsQuestion() {
    return {
        type: 'list',
        name: 'usePreviousPermissions',
        message: 'What permissions do you want to grant to this new layer version?',
        choices: [
            {
                name: 'The same permission as the latest layer version',
                short: 'Previous version permissions',
                value: true,
            },
            {
                name: 'Only accessible by the current account. You can always edit this later with: amplify update function',
                short: 'Private',
                value: false,
            },
        ],
        default: 0,
    };
}
exports.previousPermissionsQuestion = previousPermissionsQuestion;
function layerInputParamsToLayerPermissionArray(parameters) {
    const { layerPermissions = [] } = parameters;
    if (layerPermissions.filter((p) => p === layerParams_1.PermissionEnum.Public).length > 0) {
        return [
            {
                type: layerParams_1.PermissionEnum.Public,
            },
        ];
    }
    const permissionObj = [];
    layerPermissions.forEach((val) => {
        let obj;
        if (val === layerParams_1.PermissionEnum.Public) {
            obj = {
                type: layerParams_1.PermissionEnum.Public,
            };
        }
        else if (val === layerParams_1.PermissionEnum.AwsOrg) {
            obj = {
                type: layerParams_1.PermissionEnum.AwsOrg,
                orgs: parameters.orgIds,
            };
        }
        else if (val === layerParams_1.PermissionEnum.AwsAccounts) {
            obj = {
                type: layerParams_1.PermissionEnum.AwsAccounts,
                accounts: parameters.accountIds,
            };
        }
        permissionObj.push(obj);
    });
    const privateObj = {
        type: layerParams_1.PermissionEnum.Private,
    };
    permissionObj.push(privateObj);
    return permissionObj;
}
exports.layerInputParamsToLayerPermissionArray = layerInputParamsToLayerPermissionArray;
function loadStoredLayerParameters(context, layerName) {
    const { permissions, runtimes, description } = (0, layerConfiguration_1.getLayerConfiguration)(layerName);
    return {
        layerName,
        runtimes,
        permissions,
        providerContext: {
            provider: constants_2.provider,
            service: "LambdaLayer",
            projectName: context.amplify.getProjectDetails().projectConfig.projectName,
        },
        description,
        build: true,
    };
}
exports.loadStoredLayerParameters = loadStoredLayerParameters;
async function isNewVersion(layerName) {
    const previousHash = loadPreviousLayerHash(layerName);
    const currentHash = await hashLayerVersion(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName), layerName);
    return previousHash !== currentHash;
}
exports.isNewVersion = isNewVersion;
function isMultiEnvLayer(layerName) {
    const layerParametersPath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName), "layer-parameters.json");
    if (fs.existsSync(layerParametersPath)) {
        return false;
    }
    const layerConfiguration = (0, layerConfiguration_1.loadLayerConfigurationFile)(layerName, false);
    if (layerConfiguration === null || layerConfiguration === void 0 ? void 0 : layerConfiguration.nonMultiEnv) {
        return false;
    }
    return true;
}
exports.isMultiEnvLayer = isMultiEnvLayer;
function getLayerName(context, layerName) {
    const { envName } = context.amplify.getEnvInfo();
    return isMultiEnvLayer(layerName) ? `${layerName}-${envName}` : layerName;
}
exports.getLayerName = getLayerName;
function getLambdaFunctionsDependentOnLayerFromMeta(layerName, meta) {
    return Object.entries(meta[constants_1.categoryName]).filter(([_, lambdaFunction]) => {
        var _a;
        return lambdaFunction.service === "Lambda" &&
            ((_a = lambdaFunction === null || lambdaFunction === void 0 ? void 0 : lambdaFunction.dependsOn) === null || _a === void 0 ? void 0 : _a.filter((dependency) => dependency.resourceName === layerName).length) > 0;
    });
}
exports.getLambdaFunctionsDependentOnLayerFromMeta = getLambdaFunctionsDependentOnLayerFromMeta;
async function ensureLayerVersion(context, layerName, previousHash) {
    const currentHash = await hashLayerVersion(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, layerName), layerName);
    if (previousHash && previousHash !== currentHash) {
        context.print.success(`Content changes in Lambda layer ${layerName} detected.`);
    }
    const layerParameters = loadStoredLayerParameters(context, layerName);
    await (0, storeResources_1.updateLayerArtifacts)(context, layerParameters, { updateLayerParams: false, generateCfnFile: true, updateDescription: false });
    return currentHash;
}
exports.ensureLayerVersion = ensureLayerVersion;
function loadPreviousLayerHash(layerName) {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const previousHash = lodash_1.default.get(meta, [constants_1.categoryName, layerName, constants_2.versionHash], undefined);
    return previousHash;
}
exports.loadPreviousLayerHash = loadPreviousLayerHash;
const hashLayerResource = async (layerPath, resourceName) => {
    return await hashLayerVersion(layerPath, resourceName, true);
};
exports.hashLayerResource = hashLayerResource;
async function getChangedResources(resources) {
    const checkLambdaLayerChanges = async (resource) => {
        const { resourceName } = resource;
        const previousHash = loadPreviousLayerHash(resourceName);
        if (!previousHash) {
            return true;
        }
        const currentHash = await hashLayerVersion(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, constants_1.categoryName, resourceName), resourceName);
        return currentHash !== previousHash;
    };
    const resourceCheck = await Promise.all(resources.map(checkLambdaLayerChanges));
    return resources.filter((_, i) => resourceCheck[i]);
}
exports.getChangedResources = getChangedResources;
const getLayerGlobs = async (resourcePath, resourceName, runtimes, includeResourceFiles) => {
    const result = [];
    if (includeResourceFiles) {
        result.push(...layerResourceGlobs);
    }
    result.push(optPathName);
    for (const runtime of runtimes) {
        const { value: runtimeId, layerExecutablePath } = runtime;
        let layerCodePath;
        if (layerExecutablePath !== undefined) {
            layerCodePath = path.join(resourcePath, libPathName, layerExecutablePath);
        }
        if (runtimeId === 'nodejs') {
            const packageManager = (0, amplify_cli_core_1.getPackageManager)(layerCodePath);
            if (packageManager !== null) {
                result.push(path.join(libPathName, layerExecutablePath, packageJson));
                const lockFilePath = path.join(layerCodePath, packageManager.lockFile);
                if (fs.existsSync(lockFilePath)) {
                    result.push(path.join(libPathName, layerExecutablePath, packageManager.lockFile));
                }
            }
            const contentFilePaths = await (0, globby_1.default)([path.join(libPathName, layerExecutablePath, '**', '*')], {
                cwd: resourcePath,
                ignore: ['node_modules', packageJson, 'yarn.lock', 'package-lock.json'].map((name) => path.join(libPathName, layerExecutablePath, name)),
            });
            result.push(...contentFilePaths);
        }
        else if (runtimeId === 'python') {
            const pipfileFilePath = path.join(layerCodePath, pipfile);
            if (fs.existsSync(pipfileFilePath)) {
                result.push(path.join(libPathName, layerExecutablePath, pipfile));
            }
            const pipfileLockFilePath = path.join(layerCodePath, pipfileLock);
            if (fs.existsSync(pipfileLockFilePath)) {
                result.push(path.join(libPathName, layerExecutablePath, pipfileLock));
            }
            const contentFilePaths = await (0, globby_1.default)([path.join(libPathName, layerExecutablePath, '**', '*')], {
                cwd: resourcePath,
                ignore: ['lib', pipfile, pipfileLock].map((name) => path.join(libPathName, layerExecutablePath, name)),
            });
            result.push(...contentFilePaths);
        }
        else if (runtimeId !== undefined) {
            const error = new Error(`Unsupported layer runtime: ${runtimeId} for resource: ${resourceName}`);
            error.stack = undefined;
            throw error;
        }
    }
    return result;
};
const hashLayerVersion = async (layerPath, layerName, includeResourceFiles = false) => {
    const layerConfig = (0, layerConfiguration_1.loadLayerConfigurationFile)(layerName, false);
    if (layerConfig) {
        const layerFilePaths = await getLayerGlobs(layerPath, layerName, layerConfig.runtimes, includeResourceFiles);
        const filePaths = await (0, globby_1.default)(layerFilePaths, { cwd: layerPath });
        filePaths.sort();
        return filePaths
            .map((filePath) => fs.readFileSync(path.join(layerPath, filePath), 'binary'))
            .reduce((acc, it) => acc.update(it), crypto_1.default.createHash('sha256'))
            .digest('hex');
    }
    else {
        return includeResourceFiles ? await legacyResourceHashing(layerPath) : await legacyContentHashing(layerPath);
    }
};
const legacyContentHashing = async (layerPath) => {
    const safeHash = async (path, opts) => {
        if (fs.pathExistsSync(path)) {
            return (await (0, folder_hash_1.hashElement)(path, opts).catch(() => {
                throw new Error(`An error occurred hashing directory ${path}`);
            })).hash;
        }
        return '';
    };
    const nodePath = path.join(layerPath, libPathName, 'nodejs');
    const nodeHashOptions = {
        files: {
            include: [packageJson],
        },
    };
    const pyPath = path.join(layerPath, libPathName, 'python');
    const optPath = path.join(layerPath, optPathName);
    const joinedHashes = (await Promise.all([safeHash(nodePath, nodeHashOptions), safeHash(pyPath), safeHash(optPath)])).join();
    return crypto_1.default.createHash('sha256').update(joinedHashes).digest('base64');
};
const legacyResourceHashing = async (layerPath) => {
    const files = await (0, globby_1.default)(layerResourceGlobs, { cwd: layerPath });
    const hash = files
        .map((filePath) => fs.readFileSync(path.join(layerPath, filePath), 'utf8'))
        .reduce((acc, it) => acc.update(it), crypto_1.default.createHash('sha256'))
        .update(await legacyContentHashing(layerPath))
        .digest('base64');
    return hash;
};
//# sourceMappingURL=layerHelpers.js.map