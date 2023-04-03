"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLResourceManager = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const aws_sdk_1 = require("aws-sdk");
const lodash_1 = __importDefault(require("lodash"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const iterative_deployment_1 = require("../iterative-deployment");
const utils_1 = require("./utils");
const gsi_diff_helpers_1 = require("./gsi-diff-helpers");
const amplify_resource_state_utils_1 = require("../utils/amplify-resource-state-utils");
const upload_appsync_files_1 = require("../upload-appsync-files");
const dynamodb_gsi_helpers_1 = require("./dynamodb-gsi-helpers");
const configuration_manager_1 = require("../configuration-manager");
const ROOT_LEVEL = 'root';
const RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME = '_root';
const CONNECTION_STACK_NAME = 'ConnectionStack';
const SEARCHABLE_STACK_NAME = 'SearchableStack';
class GraphQLResourceManager {
    constructor(props) {
        this.rebuildAllTables = false;
        this.run = async () => {
            const gqlDiff = (0, utils_1.getGQLDiff)(this.backendApiProjectRoot, this.cloudBackendApiProjectRoot);
            try {
                const diffRules = [
                    graphql_transformer_core_1.cantEditGSIKeySchemaRule,
                    graphql_transformer_core_1.cantBatchMutateGSIAtUpdateTimeRule,
                    graphql_transformer_core_1.cantAddAndRemoveGSIAtSameTimeRule,
                ];
                const projectRules = [graphql_transformer_core_1.cantHaveMoreThan500ResourcesRule];
                (0, graphql_transformer_core_1.sanityCheckDiffs)(gqlDiff.diff, gqlDiff.current, gqlDiff.next, diffRules, projectRules);
            }
            catch (err) {
                if (err.name !== 'InvalidGSIMigrationError') {
                    throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                        message: err.message,
                        link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
                    }, err);
                }
            }
            if (!this.rebuildAllTables) {
                this.gsiManagement(gqlDiff.diff, gqlDiff.current, gqlDiff.next);
            }
            this.tableRecreationManagement(gqlDiff.current);
            return await this.getDeploymentSteps();
        };
        this.getDeploymentSteps = async () => {
            if (this.templateState.isEmpty())
                return [];
            let count = 1;
            const gqlSteps = new Array();
            const cloudBuildDir = path_1.default.join(this.cloudBackendApiProjectRoot, 'build');
            const stateFileDir = this.getStateFilesDirectory();
            const tableNameMap = await (0, amplify_resource_state_utils_1.getTableNames)(this.cfnClient, this.templateState.getKeys(), this.resourceMeta.stackId);
            const { parameters, capabilities } = await (0, amplify_resource_state_utils_1.getPreviousDeploymentRecord)(this.cfnClient, this.resourceMeta.stackId);
            const buildHash = await (0, upload_appsync_files_1.hashDirectory)(this.backendApiProjectRoot);
            let previousStepPath = cloudBuildDir;
            let previousStep = await this.getCurrentlyDeployedStackStep();
            let { previousMetaKey } = previousStep;
            while (!this.templateState.isEmpty()) {
                const stepNumber = count.toString().padStart(2, '0');
                const stepPath = path_1.default.join(stateFileDir, stepNumber);
                fs_extra_1.default.copySync(previousStepPath, stepPath);
                previousStepPath = stepPath;
                const nestedStacks = this.templateState.getKeys().filter((k) => k !== RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME);
                const tableNames = [];
                nestedStacks.forEach((stackName) => {
                    if (stackName !== CONNECTION_STACK_NAME && stackName !== SEARCHABLE_STACK_NAME) {
                        tableNames.push(tableNameMap.get(stackName));
                    }
                    const nestedStackFilePath = path_1.default.join(stepPath, 'stacks', `${stackName}.json`);
                    fs_extra_1.default.ensureDirSync(path_1.default.dirname(nestedStackFilePath));
                    amplify_cli_core_1.JSONUtilities.writeJson(nestedStackFilePath, this.templateState.pop(stackName));
                });
                if (this.templateState.has(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME)) {
                    const rootStackFilePath = path_1.default.join(stepPath, 'cloudformation-template.json');
                    fs_extra_1.default.ensureDirSync(path_1.default.dirname(rootStackFilePath));
                    amplify_cli_core_1.JSONUtilities.writeJson(rootStackFilePath, this.templateState.pop(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME));
                }
                const deploymentRootKey = `${upload_appsync_files_1.ROOT_APPSYNC_S3_KEY}/${buildHash}/states/${stepNumber}`;
                const deploymentStep = {
                    stackTemplatePathOrUrl: `${deploymentRootKey}/cloudformation-template.json`,
                    previousMetaKey,
                    parameters: { ...parameters, S3DeploymentRootKey: deploymentRootKey },
                    stackName: this.resourceMeta.stackId,
                    tableNames,
                    capabilities,
                };
                const deploymentStepStatePath = path_1.default.join(stepPath, iterative_deployment_1.DEPLOYMENT_META);
                amplify_cli_core_1.JSONUtilities.writeJson(deploymentStepStatePath, deploymentStep);
                gqlSteps.push({
                    deployment: deploymentStep,
                    rollback: previousStep,
                });
                previousStep = deploymentStep;
                previousMetaKey = `${deploymentRootKey}/${iterative_deployment_1.DEPLOYMENT_META}`;
                count++;
            }
            return gqlSteps;
        };
        this.getCurrentlyDeployedStackStep = async () => {
            const cloudBuildDir = path_1.default.join(this.cloudBackendApiProjectRoot, 'build');
            const stateFileDir = this.getStateFilesDirectory();
            const { parameters, capabilities } = await (0, amplify_resource_state_utils_1.getPreviousDeploymentRecord)(this.cfnClient, this.resourceMeta.stackId);
            const buildHash = await (0, upload_appsync_files_1.hashDirectory)(this.backendApiProjectRoot);
            const stepNumber = 'initial-stack';
            const stepPath = path_1.default.join(stateFileDir, `${stepNumber}`);
            fs_extra_1.default.copySync(cloudBuildDir, stepPath);
            const deploymentRootKey = `${upload_appsync_files_1.ROOT_APPSYNC_S3_KEY}/${buildHash}/states/${stepNumber}`;
            const currentDeployedStep = {
                stackTemplatePathOrUrl: `${deploymentRootKey}/cloudformation-template.json`,
                previousMetaKey: `${deploymentRootKey}/${iterative_deployment_1.DEPLOYMENT_META}`,
                parameters: { ...parameters, S3DeploymentRootKey: deploymentRootKey },
                stackName: this.resourceMeta.stackId,
                capabilities,
                tableNames: [],
            };
            const deploymentStateStep = path_1.default.join(stepPath, iterative_deployment_1.DEPLOYMENT_META);
            amplify_cli_core_1.JSONUtilities.writeJson(deploymentStateStep, currentDeployedStep);
            return currentDeployedStep;
        };
        this.getStateFilesDirectory = () => {
            const buildDir = path_1.default.join(this.backendApiProjectRoot, 'build');
            return path_1.default.join(buildDir, 'states');
        };
        this.getCloudStateFilesDirectory = async () => {
            const buildHash = await (0, upload_appsync_files_1.hashDirectory)(this.backendApiProjectRoot);
            return `${upload_appsync_files_1.ROOT_APPSYNC_S3_KEY}/${buildHash}/states`;
        };
        this.gsiManagement = (diffs, currentState, nextState) => {
            const gsiChanges = lodash_1.default.filter(diffs, (diff) => diff.path.includes('GlobalSecondaryIndexes'));
            const tableWithGSIChanges = lodash_1.default.uniqBy(gsiChanges, (diff) => { var _b; return (_b = diff.path) === null || _b === void 0 ? void 0 : _b.slice(0, 3).join('/'); }).map((gsiChange) => {
                const tableName = (gsiChange.path[0] === ROOT_LEVEL ? gsiChange.path[2] : gsiChange.path[3]);
                const stackName = (gsiChange.path[0] === ROOT_LEVEL ? ROOT_LEVEL : gsiChange.path[1].split('.')[0]);
                const currentTable = this.getTable(gsiChange, currentState);
                const nextTable = this.getTable(gsiChange, nextState);
                return {
                    tableName,
                    stackName,
                    currentTable,
                    nextTable,
                };
            });
            for (const gsiChange of tableWithGSIChanges) {
                const changeSteps = (0, gsi_diff_helpers_1.getGSIDiffs)(gsiChange.currentTable, gsiChange.nextTable);
                const { stackName } = gsiChange;
                const { tableName } = gsiChange;
                if (stackName === ROOT_LEVEL) {
                    continue;
                }
                for (const changeStep of changeSteps) {
                    const ddbResource = this.templateState.getLatest(stackName) || this.getStack(stackName, currentState);
                    let gsiRecord;
                    switch (changeStep.type) {
                        case gsi_diff_helpers_1.GSIChange.Add:
                            gsiRecord = (0, dynamodb_gsi_helpers_1.getGSIDetails)(changeStep.indexName, gsiChange.nextTable);
                            this.addGSI(gsiRecord, tableName, ddbResource);
                            this.templateState.add(stackName, amplify_cli_core_1.JSONUtilities.stringify(ddbResource));
                            break;
                        case gsi_diff_helpers_1.GSIChange.Delete:
                            this.deleteGSI(changeStep.indexName, tableName, ddbResource);
                            this.templateState.add(stackName, amplify_cli_core_1.JSONUtilities.stringify(ddbResource));
                            break;
                        case gsi_diff_helpers_1.GSIChange.Update:
                            this.deleteGSI(changeStep.indexName, tableName, ddbResource);
                            this.templateState.add(stackName, amplify_cli_core_1.JSONUtilities.stringify(ddbResource));
                            gsiRecord = (0, dynamodb_gsi_helpers_1.getGSIDetails)(changeStep.indexName, gsiChange.nextTable);
                            this.addGSI(gsiRecord, tableName, ddbResource);
                            this.templateState.add(stackName, amplify_cli_core_1.JSONUtilities.stringify(ddbResource));
                            break;
                        default:
                            throw new amplify_cli_core_1.AmplifyFault('UnknownFault', {
                                message: `Unknown GSI change type ${changeStep.type}`,
                                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
                            });
                    }
                }
            }
        };
        this.tableRecreationManagement = (currentState) => {
            const recreatedTables = this.getTablesBeingReplaced();
            recreatedTables.forEach((tableMeta) => {
                const ddbStack = this.getStack(tableMeta.stackName, currentState);
                this.dropTemplateResources(ddbStack);
                this.clearTemplateState(tableMeta.stackName);
                this.templateState.add(tableMeta.stackName, amplify_cli_core_1.JSONUtilities.stringify(ddbStack));
            });
            if (this.rebuildAllTables) {
                const rootStack = this.getStack(ROOT_LEVEL, currentState);
                const connectionStack = this.getStack(CONNECTION_STACK_NAME, currentState);
                const searchableStack = this.getStack(SEARCHABLE_STACK_NAME, currentState);
                const allRecreatedNestedStackNames = recreatedTables.map((tableMeta) => tableMeta.stackName);
                if (connectionStack) {
                    allRecreatedNestedStackNames.push(CONNECTION_STACK_NAME);
                    this.dropTemplateResources(connectionStack);
                    this.templateState.add(CONNECTION_STACK_NAME, amplify_cli_core_1.JSONUtilities.stringify(connectionStack));
                }
                if (searchableStack) {
                    allRecreatedNestedStackNames.push(SEARCHABLE_STACK_NAME);
                    this.dropTemplateResourcesForSearchableStack(searchableStack);
                    this.templateState.add(SEARCHABLE_STACK_NAME, amplify_cli_core_1.JSONUtilities.stringify(searchableStack));
                }
                this.replaceRecreatedNestedStackParamsInRootStackTemplate(allRecreatedNestedStackNames, rootStack);
                this.templateState.add(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME, amplify_cli_core_1.JSONUtilities.stringify(rootStack));
            }
        };
        this.getTablesBeingReplaced = () => {
            const gqlDiff = (0, utils_1.getGQLDiff)(this.backendApiProjectRoot, this.cloudBackendApiProjectRoot);
            const [diffs, currentState] = [gqlDiff.diff, gqlDiff.current];
            const getTablesRequiringReplacement = () => {
                if (!diffs) {
                    return [];
                }
                return lodash_1.default.uniq(diffs
                    .filter((diff) => {
                    const keySchemaModified = diff.kind === 'E' && diff.path.length === 8 && diff.path[5] === 'KeySchema';
                    const sortKeyAddedOrRemoved = diff.kind === 'A' && diff.path.length === 6 && diff.path[5] === 'KeySchema' && diff.index === 1;
                    const localSecondaryIndexModified = diff.path.some((pathEntry) => pathEntry === 'LocalSecondaryIndexes');
                    return keySchemaModified || sortKeyAddedOrRemoved || localSecondaryIndexModified;
                })
                    .map((diff) => {
                    var _b;
                    return ({
                        tableName: (_b = diff.path) === null || _b === void 0 ? void 0 : _b[3],
                        stackName: diff.path[1].split('.')[0],
                    });
                }));
            };
            const getAllTables = () => Object.entries(currentState.stacks)
                .map(([name, template]) => ({
                tableName: this.getTableNameFromTemplate(template),
                stackName: path_1.default.basename(name, '.json'),
            }))
                .filter((meta) => !!meta.tableName);
            return this.rebuildAllTables ? getAllTables() : getTablesRequiringReplacement();
        };
        this.getTable = (gsiChange, proj) => {
            if (gsiChange.path[0] === ROOT_LEVEL) {
                return proj.root.Resources[gsiChange.path[2]];
            }
            return proj.stacks[gsiChange.path[1]].Resources[gsiChange.path[3]];
        };
        this.getStack = (stackName, proj) => {
            if (stackName === ROOT_LEVEL) {
                return proj.root;
            }
            return proj.stacks[`${stackName}.json`];
        };
        this.addGSI = (gsiRecord, tableName, template) => {
            const table = template.Resources[tableName];
            template.Resources[tableName] = (0, dynamodb_gsi_helpers_1.addGSI)(gsiRecord, table);
        };
        this.deleteGSI = (indexName, tableName, template) => {
            const table = template.Resources[tableName];
            template.Resources[tableName] = (0, dynamodb_gsi_helpers_1.removeGSI)(indexName, table);
        };
        this.dropTemplateResources = (template) => {
            template.Resources = {};
            template.Resources.PlaceholderNullResource = { Type: 'AWS::CloudFormation::WaitConditionHandle' };
            template.Outputs = {};
        };
        this.dropTemplateResourcesForSearchableStack = (template) => {
            const OpenSearchDomainLogicalID = 'OpenSearchDomain';
            const searchDomain = template.Resources[OpenSearchDomainLogicalID];
            template.Resources = {};
            template.Resources[OpenSearchDomainLogicalID] = searchDomain;
            template.Outputs = {};
        };
        this.clearTemplateState = (stackName) => {
            while (this.templateState.has(stackName)) {
                this.templateState.pop(stackName);
            }
        };
        this.getTableNameFromTemplate = (template) => { var _b; return (_b = Object.entries((template === null || template === void 0 ? void 0 : template.Resources) || {}).find(([_, resource]) => resource.Type === 'AWS::DynamoDB::Table')) === null || _b === void 0 ? void 0 : _b[0]; };
        if (!props.resourceMeta) {
            throw new amplify_cli_core_1.AmplifyError('CategoryNotEnabledError', {
                message: 'No GraphQL API enabled.',
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
        this.cfnClient = props.cfnClient;
        this.resourceMeta = props.resourceMeta;
        this.backendApiProjectRoot = path_1.default.join(props.backendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
        this.cloudBackendApiProjectRoot = path_1.default.join(props.cloudBackendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
        this.templateState = new amplify_resource_state_utils_1.TemplateState();
        this.rebuildAllTables = props.rebuildAllTables || false;
    }
    replaceRecreatedNestedStackParamsInRootStackTemplate(recreatedNestedStackNames, rootStack) {
        recreatedNestedStackNames.forEach((stackName) => {
            const stackParamsMap = rootStack.Resources[stackName].Properties.Parameters;
            Object.keys(stackParamsMap).forEach((stackParamKey) => {
                const paramObj = stackParamsMap[stackParamKey];
                const paramObjKeys = Object.keys(paramObj);
                if (paramObjKeys.length === 1 && paramObjKeys[0] === 'Fn::GetAtt') {
                    const paramObjValue = paramObj[paramObjKeys[0]];
                    if (Array.isArray(paramObjValue) &&
                        paramObjValue.length === 2 &&
                        recreatedNestedStackNames.includes(paramObjValue[0]) &&
                        paramObjValue[1].startsWith('Outputs.')) {
                        stackParamsMap[stackParamKey] = 'TemporaryPlaceholderValue';
                    }
                }
            });
        });
    }
}
exports.GraphQLResourceManager = GraphQLResourceManager;
_a = GraphQLResourceManager;
GraphQLResourceManager.serviceName = 'AppSync';
GraphQLResourceManager.categoryName = 'api';
GraphQLResourceManager.createInstance = async (context, gqlResource, StackId, rebuildAllTables = false) => {
    const cred = await (0, configuration_manager_1.loadConfiguration)(context);
    const cfn = new aws_sdk_1.CloudFormation(cred);
    const apiStack = await cfn
        .describeStackResources({ StackName: StackId, LogicalResourceId: gqlResource.providerMetadata.logicalId })
        .promise();
    return new GraphQLResourceManager({
        cfnClient: cfn,
        resourceMeta: { ...gqlResource, stackId: apiStack.StackResources[0].PhysicalResourceId },
        backendDir: amplify_cli_core_1.pathManager.getBackendDirPath(),
        cloudBackendDir: amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath(),
        rebuildAllTables,
    });
};
//# sourceMappingURL=amplify-graphql-resource-manager.js.map