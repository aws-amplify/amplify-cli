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
exports.checkProjectConfigVersion = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const inquirer = __importStar(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const glob_1 = __importDefault(require("glob"));
const semver_1 = require("semver");
const amplify_cli_core_1 = require("amplify-cli-core");
const previousLambdaRuntimeVersions = ['nodejs8.10', 'nodejs10.x'];
const lambdaRuntimeVersion = 'nodejs16.x';
async function checkProjectConfigVersion(context) {
    const { constants } = context.amplify;
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (projectPath) {
        const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(projectPath, {
            throwIfNotExist: false,
            default: undefined,
        });
        if (!(projectConfig === null || projectConfig === void 0 ? void 0 : projectConfig.version)) {
            return;
        }
        const currentProjectVersion = (0, semver_1.coerce)(projectConfig.version);
        const minProjectVersion = (0, semver_1.coerce)(constants.MIN_NODE12_PROJECT_CONFIG_VERSION);
        if (currentProjectVersion === null) {
            const error = new Error(`Invalid project version was found in project-config.json: '${projectConfig.version}'`);
            error.stack = undefined;
            throw error;
        }
        if ((0, semver_1.lt)(currentProjectVersion, minProjectVersion)) {
            await checkLambdaCustomResourceNodeVersion(context, projectPath);
            projectConfig.version = constants.CURRENT_PROJECT_CONFIG_VERSION;
            amplify_cli_core_1.stateManager.setProjectConfig(projectPath, projectConfig);
        }
    }
}
exports.checkProjectConfigVersion = checkProjectConfigVersion;
async function checkLambdaCustomResourceNodeVersion(context, projectPath) {
    var _a;
    const { pathManager } = context.amplify;
    const backendDirPath = pathManager.getBackendDirPath(projectPath);
    let result = false;
    const filesToUpdate = [];
    if (fs.existsSync(backendDirPath)) {
        const globOptions = {
            absolute: false,
            cwd: backendDirPath,
            follow: false,
            nodir: true,
        };
        const templateFileNames = glob_1.default.sync('**/*template.{yaml,yml,json}', globOptions);
        for (const templateFileName of templateFileNames) {
            const absolutePath = path.join(backendDirPath, templateFileName);
            if (await checkFileContent(absolutePath)) {
                filesToUpdate.push(templateFileName);
            }
        }
    }
    if (filesToUpdate.length > 0) {
        const confirmed = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || (await promptForConfirmation(context, filesToUpdate));
        if (confirmed) {
            for (const fileName of filesToUpdate) {
                const absolutePath = path.join(backendDirPath, fileName);
                await updateFileContent(absolutePath);
            }
            context.print.info('');
            context.print.success(`Node.js runtime version successfully updated to ${lambdaRuntimeVersion} in all the CloudFormation templates.`);
            context.print.warning('Run “amplify push” to deploy the updated templates to the cloud.');
            result = true;
        }
    }
    else {
        result = true;
    }
    return result;
}
async function checkFileContent(filePath) {
    const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(filePath);
    const resources = lodash_1.default.get(cfnTemplate, 'Resources', {});
    const lambdaFunctions = lodash_1.default.filter(resources, (r) => r.Type === 'AWS::Lambda::Function' && previousLambdaRuntimeVersions.includes(lodash_1.default.get(r, ['Properties', 'Runtime'], undefined)));
    return lambdaFunctions.length > 0;
}
async function updateFileContent(filePath) {
    const { templateFormat, cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(filePath);
    const resources = lodash_1.default.get(cfnTemplate, 'Resources', {});
    const lambdaFunctions = lodash_1.default.filter(resources, (r) => r.Type === 'AWS::Lambda::Function' && previousLambdaRuntimeVersions.includes(lodash_1.default.get(r, ['Properties', 'Runtime'], undefined)));
    lambdaFunctions.map((f) => (f.Properties.Runtime = lambdaRuntimeVersion));
    return (0, amplify_cli_core_1.writeCFNTemplate)(cfnTemplate, filePath, { templateFormat });
}
async function promptForConfirmation(context, filesToUpdate) {
    context.print.info('');
    context.print.info('Amplify CLI uses AWS Lambda to manage part of your backend resources.');
    context.print.info(`In response to the Lambda Runtime support deprecation schedule, the Node.js runtime needs to be updated from ${previousLambdaRuntimeVersions.join(', ')} to ${lambdaRuntimeVersion} in the following template files:`);
    for (const fileToUpdate of filesToUpdate) {
        context.print.info(fileToUpdate);
    }
    context.print.info('');
    context.print.warning(`Test the changes in a test environment before pushing them to production. There might be a need to update your Lambda function source code due to the Node.js runtime update. Take a look at https://docs.amplify.aws/cli/migration/lambda-node-version-update for more information`);
    context.print.info('');
    const question = {
        type: 'confirm',
        name: 'confirmUpdateNodeVersion',
        message: `Confirm to update the Node.js runtime version to ${lambdaRuntimeVersion}`,
        default: true,
    };
    const answer = await inquirer.prompt(question);
    if (!answer.confirmUpdateNodeVersion) {
        const warningMessage = `After a runtime is deprecated, \
Lambda might retire it completely at any time by disabling invocation. \
Deprecated runtimes aren't eligible for security updates or technical support. \
Before retiring a runtime, Lambda sends additional notifications to affected customers.`;
        context.print.warning(warningMessage);
        context.print.info('You will need to manually update the Node.js runtime in the template files and push the updates to the cloud.');
    }
    return answer.confirmUpdateNodeVersion;
}
//# sourceMappingURL=project-config-version-check.js.map