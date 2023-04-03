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
exports.migrateProject = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const semver_1 = require("semver");
const amplify_cli_core_1 = require("amplify-cli-core");
const make_id_1 = require("./extensions/amplify-helpers/make-id");
const constants_1 = require("./extensions/amplify-helpers/constants");
const git_manager_1 = require("./extensions/amplify-helpers/git-manager");
const push_1 = require("./commands/push");
const spinner = (0, ora_1.default)('');
const confirmMigrateMessage = 'We detected the project was initialized using an older version of the CLI. Do you want to migrate the project, so that it is compatible with the latest version of the CLI?';
const secondConfirmMessage = 'The CLI would be modifying your Amplify backend configuration files as a part of the migration process, hence we highly recommend backing up your existing local project before moving ahead. Are you sure you want to continue?';
const migrateProject = async (context) => {
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!projectPath) {
        return;
    }
    const projectConfig = amplify_cli_core_1.stateManager.getProjectConfig(projectPath);
    if (!projectConfig.projectPath) {
        return;
    }
    const currentProjectVersion = (0, semver_1.coerce)(projectConfig.version);
    const minProjectVersion = (0, semver_1.coerce)(constants_1.amplifyCLIConstants.MIN_MIGRATION_PROJECT_CONFIG_VERSION);
    if ((0, semver_1.lt)(currentProjectVersion, minProjectVersion)) {
        if (await context.prompt.confirm(confirmMigrateMessage)) {
            const infoMessage = `${chalk_1.default.bold('The CLI is going to take the following actions during the migration step:')}\n` +
                '\n1. If you have a GraphQL API, we will update the corresponding CloudFormation stack to support larger annotated schemas and custom resolvers.\n' +
                'In this process, we will be making CloudFormation API calls to update your GraphQL API CloudFormation stack. This operation will result in deletion of your AppSync resolvers and then the creation of new ones and for a brief while your AppSync API will be unavailable until the migration finishes\n' +
                '\n2. We will be updating your local CloudFormation files present inside the `amplify` directory of your app project, for all the added categories so that it supports multiple environments\n' +
                '\n3. After the migration completes, we will give you the option to either push these CloudFormation files right away or you could inspect them yourselves and later push the updated CloudFormation files to the cloud\n' +
                '\n4. If for any reason the migration fails, the CLI will rollback your cloud and local changes and you can take a look at https://aws-amplify.github.io/docs/cli/migrate?sdk=js for manually migrating your project so that it’s compatible with the latest version of the CLI\n' +
                '\n5. ALL THE ABOVE MENTIONED OPERATIONS WILL NOT DELETE ANY DATA FROM ANY OF YOUR DATA STORES\n' +
                `\n${chalk_1.default.bold('Before the migration, please be aware of the following things:')}\n` +
                '\n1. Make sure to have an internet connection through the migration process\n' +
                '\n2. Make sure to not exit/terminate the migration process (by interrupting it explicitly in the middle of migration), as this will lead to inconsistency within your project\n' +
                '\n3. Make sure to take a backup of your entire project (including the amplify related config files)\n';
            context.print.info(infoMessage);
            context.print.info(chalk_1.default.red("IF YOU'VE MODIFIED ANY CLOUDFORMATION FILES MANUALLY, PLEASE CHECK AND DIFF YOUR CLOUDFORMATION FILES BEFORE PUSHING YOUR RESOURCES IN THE CLOUD IN THE LAST STEP OF THIS MIGRATION."));
            if (await context.prompt.confirm(secondConfirmMessage)) {
                await migrateFrom0To1(context, projectPath, projectConfig);
            }
        }
    }
};
exports.migrateProject = migrateProject;
const migrateFrom0To1 = async (context, projectPath, projectConfig) => {
    let amplifyDirPath;
    let backupAmplifyDirPath;
    try {
        amplifyDirPath = amplify_cli_core_1.pathManager.getAmplifyDirPath(projectPath);
        backupAmplifyDirPath = backup(amplifyDirPath, projectPath);
        context.migrationInfo = generateMigrationInfo(projectConfig, projectPath);
        const categoryMigrationTasks = [];
        const categoryPluginInfoList = context.amplify.getAllCategoryPluginInfo(context);
        let apiMigrateFunction;
        Object.keys(categoryPluginInfoList).forEach((category) => {
            categoryPluginInfoList[category].forEach((pluginInfo) => {
                try {
                    const { migrate } = require(pluginInfo.packageLocation);
                    if (migrate) {
                        if (category !== 'api') {
                            categoryMigrationTasks.push(() => migrate(context));
                        }
                        else {
                            apiMigrateFunction = migrate;
                        }
                    }
                }
                catch (e) {
                }
            });
        });
        if (apiMigrateFunction) {
            categoryMigrationTasks.unshift(() => apiMigrateFunction(context, 'AppSync'));
            categoryMigrationTasks.push(() => apiMigrateFunction(context, 'API Gateway'));
        }
        spinner.start('Migrating your project');
        persistMigrationContext(context.migrationInfo);
        for (let i = 0; i < categoryMigrationTasks.length; i++) {
            await categoryMigrationTasks[i]();
        }
        removeAmplifyRCFile(projectPath);
        updateGitIgnoreFile(projectPath);
        spinner.succeed('Migrated your project successfully.');
        context.print.warning("If you have added functions or interactions category to your project, please check the 'Auto-migration' section at https://github.com/aws-amplify/docs/blob/dev/cli/migrate.md");
        await (0, push_1.run)(context);
    }
    catch (e) {
        spinner.fail('There was an error migrating your project.');
        rollback(amplifyDirPath, backupAmplifyDirPath);
        context.print.info('migration operations are rolled back.');
        throw e;
    }
    finally {
        cleanUp(backupAmplifyDirPath);
    }
};
const backup = (amplifyDirPath, projectPath) => {
    const backupAmplifyDirName = `${constants_1.amplifyCLIConstants.AmplifyCLIDirName}-${(0, make_id_1.makeId)(5)}`;
    const backupAmplifyDirPath = path.join(projectPath, backupAmplifyDirName);
    if (fs.existsSync(backupAmplifyDirPath)) {
        const error = new Error(`Backup folder at ${backupAmplifyDirPath} already exists, remove the folder and retry the operation.`);
        error.name = 'BackupFolderAlreadyExist';
        error.stack = undefined;
        throw error;
    }
    fs.copySync(amplifyDirPath, backupAmplifyDirPath);
    return backupAmplifyDirPath;
};
const rollback = (amplifyDirPath, backupAmplifyDirPath) => {
    if (backupAmplifyDirPath && fs.existsSync(backupAmplifyDirPath)) {
        fs.removeSync(amplifyDirPath);
        fs.moveSync(backupAmplifyDirPath, amplifyDirPath);
    }
};
const cleanUp = (backupAmplifyDirPath) => {
    fs.removeSync(backupAmplifyDirPath);
};
const generateMigrationInfo = (projectConfig, projectPath) => {
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const migrationInfo = {
        projectPath,
        initVersion: projectConfig.version,
        newVersion: constants_1.amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION,
        amplifyMeta: meta,
        currentAmplifyMeta: amplify_cli_core_1.stateManager.getCurrentMeta(projectPath),
        projectConfig: generateNewProjectConfig(projectConfig),
        localEnvInfo: generateLocalEnvInfo(projectConfig),
        localAwsInfo: generateLocalAwsInfo(projectPath),
        teamProviderInfo: generateTeamProviderInfo(meta),
        backendConfig: generateBackendConfig(meta),
    };
    return migrationInfo;
};
const persistMigrationContext = (migrationInfo) => {
    amplify_cli_core_1.stateManager.setMeta(migrationInfo.projectPath, migrationInfo.amplifyMeta);
    amplify_cli_core_1.stateManager.setCurrentMeta(migrationInfo.projectPath, migrationInfo.currentAmplifyMeta);
    amplify_cli_core_1.stateManager.setProjectConfig(migrationInfo.projectPath, migrationInfo.projectConfig);
    if (migrationInfo.localEnvInfo) {
        amplify_cli_core_1.stateManager.setLocalEnvInfo(migrationInfo.projectPath, migrationInfo.localEnvInfo);
    }
    if (migrationInfo.localAwsInfo) {
        amplify_cli_core_1.stateManager.setLocalAWSInfo(migrationInfo.projectPath, migrationInfo.localAwsInfo);
    }
    if (migrationInfo.teamProviderInfo) {
        amplify_cli_core_1.stateManager.setTeamProviderInfo(migrationInfo.projectPath, migrationInfo.teamProviderInfo);
    }
    if (migrationInfo.backendConfig) {
        amplify_cli_core_1.stateManager.setBackendConfig(migrationInfo.projectPath, migrationInfo.backendConfig);
    }
};
const generateNewProjectConfig = (projectConfig) => {
    const newProjectConfig = {};
    Object.assign(newProjectConfig, projectConfig);
    delete newProjectConfig.projectPath;
    delete newProjectConfig.defaultEditor;
    const frontendPluginPath = Object.keys(projectConfig.frontendHandler)[0];
    const frontendPlugin = frontendPluginPath.split('/')[frontendPluginPath.split('/').length - 1];
    const frontend = frontendPlugin.split('-')[frontendPlugin.split('-').length - 1];
    newProjectConfig.frontend = frontend;
    if (projectConfig[`amplify-frontend-${frontend}`]) {
        newProjectConfig[frontend] = projectConfig[`amplify-frontend-${frontend}`];
        delete newProjectConfig[`amplify-frontend-${frontend}`];
    }
    delete newProjectConfig.frontendHandler;
    newProjectConfig.version = constants_1.amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION;
    const providers = Object.keys(projectConfig.providers);
    newProjectConfig.providers = providers;
    return newProjectConfig;
};
const generateLocalEnvInfo = (projectConfig) => ({
    projectPath: projectConfig.projectPath,
    defaultEditor: projectConfig.defaultEditor,
    envName: 'NONE',
});
const generateLocalAwsInfo = (projectPath) => {
    let newAwsInfo;
    const awsInfoFilePath = path.join(amplify_cli_core_1.pathManager.getDotConfigDirPath(projectPath), 'aws-info.json');
    if (fs.existsSync(awsInfoFilePath)) {
        const awsInfo = amplify_cli_core_1.JSONUtilities.readJson(awsInfoFilePath);
        awsInfo.configLevel = 'project';
        newAwsInfo = { NONE: awsInfo };
        fs.removeSync(awsInfoFilePath);
    }
    return newAwsInfo;
};
const generateTeamProviderInfo = (amplifyMeta) => ({ NONE: amplifyMeta.providers });
const generateBackendConfig = (amplifyMeta) => {
    const backendConfig = {};
    Object.keys(amplifyMeta).forEach((category) => {
        if (category !== 'providers') {
            backendConfig[category] = {};
            Object.keys(amplifyMeta[category]).forEach((resourceName) => {
                backendConfig[category][resourceName] = {};
                backendConfig[category][resourceName].service = amplifyMeta[category][resourceName].service;
                backendConfig[category][resourceName].providerPlugin = amplifyMeta[category][resourceName].providerPlugin;
                backendConfig[category][resourceName].dependsOn = amplifyMeta[category][resourceName].dependsOn;
                backendConfig[category][resourceName].build = amplifyMeta[category][resourceName].build;
                if (amplifyMeta[category][resourceName].service === 'AppSync') {
                    backendConfig[category][resourceName].output = {};
                    if (amplifyMeta[category][resourceName].output) {
                        backendConfig[category][resourceName].output.securityType = amplifyMeta[category][resourceName].output.securityType;
                    }
                }
            });
        }
    });
    return backendConfig;
};
const removeAmplifyRCFile = (projectPath) => {
    const amplifyRcFilePath = amplify_cli_core_1.pathManager.getAmplifyRcFilePath(projectPath);
    fs.removeSync(amplifyRcFilePath);
};
const updateGitIgnoreFile = (projectPath) => {
    const gitIgnoreFilePath = amplify_cli_core_1.pathManager.getGitIgnoreFilePath(projectPath);
    (0, git_manager_1.insertAmplifyIgnore)(gitIgnoreFilePath);
};
//# sourceMappingURL=migrate-project.js.map