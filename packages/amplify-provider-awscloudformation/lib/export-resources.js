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
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path = __importStar(require("path"));
const rimraf_1 = __importDefault(require("rimraf"));
const resource_export_1 = require("./resource-package/resource-export");
const backup = 'backup';
const run = async (context, resourceDefinition, exportPath) => {
    const resolvedExportDir = (0, amplify_cli_core_1.validateExportDirectoryPath)(exportPath, amplify_cli_core_1.PathConstants.DefaultExportFolder);
    const { projectName } = amplify_cli_core_1.stateManager.getProjectConfig();
    const amplifyExportFolder = path.join(resolvedExportDir, `amplify-export-${projectName}`);
    const proceed = await checkForExistingExport(amplifyExportFolder);
    if (proceed) {
        await createBackup(amplifyExportFolder);
        deleteFolder(amplifyExportFolder);
    }
    else {
        return;
    }
    amplify_cli_core_1.spinner.start();
    try {
        const resourceExport = new resource_export_1.ResourceExport(context, amplifyExportFolder);
        amplify_cli_core_1.spinner.text = 'Building and packaging resources';
        const packagedResources = await resourceExport.packageBuildWriteResources(resourceDefinition);
        amplify_cli_core_1.spinner.text = `Writing resources`;
        await resourceExport.writeResourcesToDestination(packagedResources);
        amplify_cli_core_1.spinner.text = `Writing Cloudformation`;
        const { stackParameters, transformedResources } = await resourceExport.generateAndTransformCfnResources(packagedResources);
        amplify_cli_core_1.spinner.text = `Generating and writing root stack`;
        const extractedParameters = await resourceExport.generateAndWriteRootStack(stackParameters);
        const parameters = resourceExport.fixNestedStackParameters(transformedResources, extractedParameters);
        amplify_cli_core_1.spinner.text = `Generating export manifest`;
        writeExportManifest(parameters, amplifyExportFolder);
        amplify_cli_core_1.spinner.text = `Generating category stack mappings`;
        createCategoryStackMapping(transformedResources, amplifyExportFolder);
        amplify_cli_core_1.spinner.text = 'Generating export tag file';
        createTagsFile(amplifyExportFolder);
        amplify_cli_core_1.spinner.text = 'Setting permissions';
        await setPermissions(amplifyExportFolder);
        amplify_cli_core_1.spinner.succeed();
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.success('Successfully exported');
        amplify_prompts_1.printer.info('Next steps:');
        amplify_prompts_1.printer.info('You can now integrate your Amplify Backend into your CDK App');
        amplify_prompts_1.printer.info('Install the "Amplify Exported Backend" CDK Construct by running "npm i @aws-amplify/cdk-exported-backend" in your CDK app');
        amplify_prompts_1.printer.info('For more information: https://docs.amplify.aws/cli/usage/export-to-cdk');
        amplify_prompts_1.printer.blankLine();
    }
    catch (ex) {
        await revertToBackup(amplifyExportFolder);
        amplify_cli_core_1.spinner.fail();
        throw new amplify_cli_core_1.AmplifyFault('ResourceNotReadyFault', {
            message: ex.message,
        }, ex);
    }
    finally {
        await removeBackup(amplifyExportFolder);
        amplify_cli_core_1.spinner.stop();
    }
};
exports.run = run;
const setPermissions = async (amplifyExportFolder) => {
    await fs.chmod(amplifyExportFolder, 0o700);
};
const createTagsFile = (exportPath) => {
    const hydratedTags = amplify_cli_core_1.stateManager.getHydratedTags(undefined, true);
    amplify_cli_core_1.JSONUtilities.writeJson(path.join(exportPath, amplify_cli_core_1.PathConstants.ExportTagsJsonFileName), hydratedTags.map((tag) => ({
        key: tag.Key,
        value: tag.Value,
    })));
};
const createCategoryStackMapping = (resources, amplifyExportFolder) => {
    amplify_cli_core_1.JSONUtilities.writeJson(path.join(amplifyExportFolder, amplify_cli_core_1.PathConstants.ExportCategoryStackMappingJsonFilename), resources.map((r) => lodash_1.default.pick(r, ['category', 'resourceName', 'service'])));
};
const checkForExistingExport = async (amplifyExportFolder) => {
    let proceed = true;
    if (fs.existsSync(amplifyExportFolder)) {
        proceed = await amplify_prompts_1.prompter.yesOrNo(`Existing files at ${amplifyExportFolder} will be deleted and new files will be generated, continue?`, true);
    }
    await fs.ensureDir(amplifyExportFolder);
    return proceed;
};
const deleteFolder = (directoryPath) => {
    if (fs.existsSync(directoryPath)) {
        rimraf_1.default.sync(directoryPath);
    }
};
const removeBackup = async (amplifyExportFolder) => {
    if (fs.existsSync(`${amplifyExportFolder}-${backup}`)) {
        deleteFolder(`${amplifyExportFolder}-${backup}`);
    }
};
const revertToBackup = async (amplifyExportFolder) => {
    if (fs.existsSync(`${amplifyExportFolder}-${backup}`)) {
        await fs.copy(`${amplifyExportFolder}-${backup}`, amplifyExportFolder);
    }
};
const createBackup = async (amplifyExportFolder) => {
    await fs.copy(amplifyExportFolder, `${amplifyExportFolder}-${backup}`);
};
const writeExportManifest = (stackParameters, amplifyExportFolder) => {
    const rootStackParametersKey = lodash_1.default.first(Object.keys(stackParameters));
    const manifestJson = {
        stackName: rootStackParametersKey,
        props: transformManifestParameters(stackParameters[rootStackParametersKey], amplifyExportFolder),
    };
    amplify_cli_core_1.JSONUtilities.writeJson(path.join(amplifyExportFolder, amplify_cli_core_1.PathConstants.ExportManifestJsonFilename), manifestJson);
};
const transformManifestParameters = (stackParameters, exportPath) => {
    if (stackParameters) {
        const manifest = {
            templateFile: path.relative(exportPath, stackParameters.destination),
            parameters: stackParameters.parameters,
            preserveLogicalIds: true,
            loadNestedStacks: {},
        };
        if (!stackParameters.nestedStacks) {
            return manifest;
        }
        Object.keys(stackParameters.nestedStacks)
            .sort()
            .forEach((key) => {
            manifest.loadNestedStacks[key] = transformManifestParameters(stackParameters.nestedStacks[key], exportPath);
        });
        return manifest;
    }
};
//# sourceMappingURL=export-resources.js.map