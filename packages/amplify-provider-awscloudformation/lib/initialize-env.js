"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const glob_1 = __importDefault(require("glob"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const aws_cfn_1 = __importDefault(require("./aws-utils/aws-cfn"));
const aws_s3_1 = require("./aws-utils/aws-s3");
const build_override_enabled_resources_1 = require("./build-override-enabled-resources");
const constants_1 = require("./constants");
const aws_logger_1 = require("./utils/aws-logger");
const zip_util_1 = require("./zip-util");
const amplify_category_custom_1 = require("@aws-amplify/amplify-category-custom");
const logger = (0, aws_logger_1.fileLogger)('initialize-env');
async function run(context, providerMetadata) {
    if (!(context.exeInfo && context.exeInfo.isNewEnv)) {
        const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
        const tempDir = path_1.default.join(amplifyDir, '.temp');
        const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
        const backendDir = context.amplify.pathManager.getBackendDirPath();
        const s3 = await aws_s3_1.S3.getInstance(context);
        const cfnItem = await new aws_cfn_1.default(context);
        const file = await (0, zip_util_1.downloadZip)(s3, tempDir, constants_1.S3BackendZipFileName, undefined);
        const unzippedDir = await (0, zip_util_1.extractZip)(tempDir, file);
        fs_extra_1.default.removeSync(currentCloudBackendDir);
        const cliJSONFiles = glob_1.default.sync(amplify_cli_core_1.PathConstants.CLIJSONFileNameGlob, {
            cwd: unzippedDir,
            absolute: true,
        });
        if (context.exeInfo.restoreBackend) {
            for (const cliJSONFilePath of cliJSONFiles) {
                const targetPath = path_1.default.join(amplifyDir, path_1.default.basename(cliJSONFilePath));
                fs_extra_1.default.moveSync(cliJSONFilePath, targetPath, { overwrite: true });
            }
        }
        else {
            for (const cliJSONFilePath of cliJSONFiles) {
                fs_extra_1.default.removeSync(cliJSONFilePath);
            }
        }
        fs_extra_1.default.copySync(unzippedDir, currentCloudBackendDir);
        if (context.exeInfo.restoreBackend) {
            fs_extra_1.default.removeSync(backendDir);
            fs_extra_1.default.copySync(unzippedDir, backendDir);
        }
        fs_extra_1.default.removeSync(tempDir);
        logger('run.cfn.updateamplifyMetaFileWithStackOutputs', [{ StackName: providerMetadata.StackName }])();
        await cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName);
        const currentAmplifyMeta = amplify_cli_core_1.stateManager.getCurrentMeta();
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        Object.keys(amplifyMeta).forEach((category) => {
            Object.keys(amplifyMeta[category]).forEach((resource) => {
                if (currentAmplifyMeta[category] && currentAmplifyMeta[category][resource]) {
                    amplifyMeta[category][resource].providerMetadata = currentAmplifyMeta[category][resource].providerMetadata;
                }
            });
        });
        let hasMigratedResources = false;
        const s3AmplifyMeta = amplify_cli_core_1.JSONUtilities.parse((await s3.getFile({
            Key: amplify_cli_core_1.PathConstants.AmplifyMetaFileName,
        })).toString());
        Object.keys(s3AmplifyMeta)
            .filter((k) => k !== 'providers')
            .forEach((category) => {
            Object.keys(s3AmplifyMeta[category]).forEach((resourceName) => {
                const resource = s3AmplifyMeta[category][resourceName];
                if (resource.mobileHubMigrated === true) {
                    lodash_1.default.setWith(amplifyMeta, [category, resourceName], resource);
                    hasMigratedResources = true;
                }
            });
        });
        amplify_cli_core_1.stateManager.setMeta(undefined, amplifyMeta);
        if (hasMigratedResources) {
            amplify_cli_core_1.stateManager.setCurrentMeta(undefined, amplifyMeta);
        }
    }
    await (0, build_override_enabled_resources_1.buildOverridesEnabledResources)(context);
    await (0, amplify_category_custom_1.generateDependentResourcesType)();
    return context;
}
exports.run = run;
//# sourceMappingURL=initialize-env.js.map