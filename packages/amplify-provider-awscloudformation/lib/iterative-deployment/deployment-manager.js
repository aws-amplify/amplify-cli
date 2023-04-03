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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentManager = exports.DeploymentError = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const assert_1 = __importDefault(require("assert"));
const aws = __importStar(require("aws-sdk"));
const lodash_throttle_1 = __importDefault(require("lodash.throttle"));
const xstate_1 = require("xstate");
const helpers_1 = require("./helpers");
const stack_event_monitor_1 = require("./stack-event-monitor");
const state_machine_1 = require("./state-machine");
const configuration_manager_1 = require("../configuration-manager");
const aws_logger_1 = require("../utils/aws-logger");
const stack_progress_printer_1 = require("./stack-progress-printer");
const deploySpinnerMessages = {
    idle: { machine: 'deploy', message: `Starting deployment.` },
    'deploy.waitForTablesToBeReady': { machine: 'deploy', message: `Waiting for DynamoDB indices to be ready.` },
};
const rollbackSpinnerMessages = {
    idle: { machine: 'rollback', message: `Starting rollback.` },
    preRollback: { machine: 'rollback', message: `Waiting for previous deployment to finish.` },
    'rollback.waitForTablesToBeReady': { machine: 'rollback', message: `Waiting for DynamoDB indices to be ready.` },
};
class DeploymentError extends Error {
    constructor(errors) {
        super('There was an error while deploying changes.');
        this.name = `DeploymentError`;
        const stackTrace = [];
        for (const err of errors) {
            stackTrace.push(`Index: ${err.currentIndex} State: ${err.stateValue} Message: ${err.error.message}`);
        }
        this.message = JSON.stringify(stackTrace);
    }
}
exports.DeploymentError = DeploymentError;
class DeploymentManager {
    constructor(creds, region, deploymentBucket, eventMap, options = {}) {
        this.region = region;
        this.deploymentBucket = deploymentBucket;
        this.eventMap = eventMap;
        this.deployment = [];
        this.deploy = async (deploymentStateManager) => {
            this.deploymentStateManager = deploymentStateManager;
            const deploymentTemplates = this.deployment.reduce((acc, step) => {
                acc.add(step.deployment.stackTemplatePath);
                acc.add(step.rollback.stackTemplatePath);
                return acc;
            }, new Set());
            await Promise.all(Array.from(deploymentTemplates.values()).map((path) => this.ensureTemplateExists(path)));
            const fns = {
                deployFn: this.doDeploy,
                deploymentWaitFn: this.waitForDeployment,
                rollbackFn: this.rollBackStack,
                tableReadyWaitFn: this.waitForIndices,
                rollbackWaitFn: this.waitForDeployment,
                stackEventPollFn: this.stackPollFn,
                startRollbackFn: this.startRollBackFn,
            };
            const machine = (0, state_machine_1.createDeploymentMachine)({
                currentIndex: -1,
                deploymentBucket: this.deploymentBucket,
                region: this.region,
                stacks: this.deployment,
            }, fns);
            let maxDeployed = 0;
            return new Promise((resolve, reject) => {
                const service = (0, xstate_1.interpret)(machine)
                    .onTransition((state) => {
                    if (state.changed) {
                        maxDeployed = Math.max(maxDeployed, state.context.currentIndex + 1);
                        const deploySpinnerState = Object.keys(deploySpinnerMessages).find((key) => state.matches(key));
                        if (deploySpinnerState) {
                            const deploySpinnerMessage = deploySpinnerMessages[deploySpinnerState];
                            this.logger(deploySpinnerMessage.machine, [{ spinner: deploySpinnerMessage.message }])();
                            if (!this.printer || (this.printer && !this.printer.isRunning())) {
                                this.spinner.start(deploySpinnerMessage.message);
                            }
                        }
                        else if (state.matches('deployed')) {
                            this.updateTerminalOnEventCompletion(`Deployed (${maxDeployed - 1} of ${state.context.stacks.length})`);
                            this.logger('DeploymentManager', [{ spinner: 'Deployed' }]);
                            this.resetPrinter();
                        }
                        else if (state.matches('deploy') || state.matches('rollback')) {
                            this.spinner.stop();
                            const { currentIndex } = state.context;
                            const message = state.matches('deploy')
                                ? `Deploying (${maxDeployed} of ${state.context.stacks.length})`
                                : `Rolling back (${maxDeployed - currentIndex} of ${maxDeployed})`;
                            this.logger('deploy', [{ spinner: message }])();
                            this.printer.updateIndexInHeader(maxDeployed, state.context.stacks.length);
                        }
                    }
                    switch (state.value) {
                        case 'deployed':
                            return resolve();
                        case 'rolledBack':
                        case 'failed': {
                            this.printer.stopBars();
                            amplify_prompts_1.printer.info(`Rolled back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
                            const deploymentErrors = new DeploymentError(state.context.errors);
                            this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
                            return reject(deploymentErrors);
                        }
                        default:
                    }
                    return undefined;
                })
                    .start();
                service.send({ type: 'DEPLOY' });
            });
        };
        this.rollback = async (deploymentStateManager) => {
            this.deploymentStateManager = deploymentStateManager;
            const { currentStepIndex } = this.deploymentStateManager.getStatus();
            const maxDeployed = currentStepIndex + 1;
            const deploymentTemplates = this.deployment.reduce((acc, step) => {
                acc.add(step.rollback.stackTemplatePath);
                return acc;
            }, new Set());
            await Promise.all(Array.from(deploymentTemplates.values()).map((path) => this.ensureTemplateExists(path)));
            const fns = {
                preRollbackTableCheck: this.preRollbackTableCheck,
                rollbackFn: this.rollBackStack,
                tableReadyWaitFn: this.waitForIndices,
                rollbackWaitFn: this.waitForDeployment,
                stackEventPollFn: this.stackPollFn,
                startRollbackFn: this.startRollBackFn,
            };
            const machine = (0, state_machine_1.createRollbackDeploymentMachine)({
                currentIndex: maxDeployed,
                previousDeploymentIndex: currentStepIndex,
                deploymentBucket: this.deploymentBucket,
                region: this.region,
                stacks: this.deployment,
            }, fns);
            return new Promise((resolve, reject) => {
                const service = (0, xstate_1.interpret)(machine)
                    .onTransition((state) => {
                    if (state.changed) {
                        const rollbackSpinnerState = Object.keys(rollbackSpinnerMessages).find((key) => state.matches(key));
                        if (rollbackSpinnerState) {
                            const rollbackSpinnerMessage = rollbackSpinnerMessages[rollbackSpinnerState];
                            this.logger(rollbackSpinnerMessage.machine, [{ spinner: rollbackSpinnerMessage.message }])();
                            this.spinner.start(rollbackSpinnerMessage.message);
                        }
                        else if (state.matches('rolledBack')) {
                            this.updateTerminalOnEventCompletion(`Rolled back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
                            this.logger('rollback', [{ spinner: 'Rolled back successfully' }]);
                        }
                        else if (state.matches('rollback')) {
                            this.spinner.stop();
                            const message = `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`;
                            this.logger('rollback', [{ spinner: message }])();
                        }
                    }
                    switch (state.value) {
                        case 'rolledBack':
                            return resolve();
                        case 'failed': {
                            this.printer.stopBars();
                            const deploymentErrors = new DeploymentError(state.context.errors);
                            this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
                            return reject(deploymentErrors);
                        }
                        default:
                    }
                    return undefined;
                })
                    .start();
                service.send({ type: 'ROLLBACK' });
            });
        };
        this.addStep = (deploymentStep) => {
            const deploymentStackTemplateUrl = (0, helpers_1.getHttpUrl)(deploymentStep.deployment.stackTemplatePathOrUrl, this.deploymentBucket);
            const deploymentStackTemplatePath = (0, helpers_1.getBucketKey)(deploymentStep.deployment.stackTemplatePathOrUrl, this.deploymentBucket);
            const rollbackStackTemplateUrl = (0, helpers_1.getHttpUrl)(deploymentStep.rollback.stackTemplatePathOrUrl, this.deploymentBucket);
            const rollbackStackTemplatePath = (0, helpers_1.getBucketKey)(deploymentStep.rollback.stackTemplatePathOrUrl, this.deploymentBucket);
            this.deployment.push({
                deployment: {
                    ...deploymentStep.deployment,
                    stackTemplatePath: deploymentStackTemplatePath,
                    stackTemplateUrl: deploymentStackTemplateUrl,
                    region: this.region,
                    clientRequestToken: deploymentStep.deployment.clientRequestToken
                        ? `deploy-${deploymentStep.deployment.clientRequestToken}`
                        : undefined,
                },
                rollback: {
                    ...deploymentStep.rollback,
                    stackTemplatePath: rollbackStackTemplatePath,
                    stackTemplateUrl: rollbackStackTemplateUrl,
                    region: this.region,
                    clientRequestToken: deploymentStep.rollback.clientRequestToken
                        ? `rollback-${deploymentStep.rollback.clientRequestToken}`
                        : undefined,
                },
            });
        };
        this.addRollbackStep = (rollbackStep) => {
            const rollbackStackTemplateUrl = (0, helpers_1.getHttpUrl)(rollbackStep.stackTemplatePathOrUrl, this.deploymentBucket);
            const rollbackStackTemplatePath = (0, helpers_1.getBucketKey)(rollbackStep.stackTemplatePathOrUrl, this.deploymentBucket);
            this.deployment.push({
                deployment: null,
                rollback: {
                    ...rollbackStep,
                    stackTemplatePath: rollbackStackTemplatePath,
                    stackTemplateUrl: rollbackStackTemplateUrl,
                    region: this.region,
                    clientRequestToken: rollbackStep.clientRequestToken ? `rollback-${rollbackStep.clientRequestToken}` : undefined,
                },
            });
        };
        this.resetPrinter = () => {
            this.printer = new stack_progress_printer_1.StackProgressPrinter(this.eventMap);
        };
        this.updateTerminalOnEventCompletion = (eventCompletionText) => {
            this.spinner.stop();
            this.printer.finishBars();
            this.printer.stopBars();
            amplify_prompts_1.printer.info(eventCompletionText);
        };
        this.startRollBackFn = async (deployMachineContext) => {
            var _b, _c;
            try {
                await ((_b = this.deploymentStateManager) === null || _b === void 0 ? void 0 : _b.startRollback());
                await ((_c = this.deploymentStateManager) === null || _c === void 0 ? void 0 : _c.startCurrentStep());
            }
            catch (err) {
                this.logger('startRollbackFn', [{ index: deployMachineContext.currentIndex }])(err);
            }
        };
        this.ensureStack = async (stackName) => {
            const result = await this.cfnClient.describeStacks({ StackName: stackName }).promise();
            return result.Stacks[0].StackStatus.endsWith('_COMPLETE');
        };
        this.ensureTemplateExists = async (templatePath) => {
            try {
                const bucketKey = (0, helpers_1.getBucketKey)(templatePath, this.deploymentBucket);
                await this.s3Client.headObject({ Bucket: this.deploymentBucket, Key: bucketKey }).promise();
                return true;
            }
            catch (e) {
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: e.code === 'NotFound'
                        ? `The cloudformation template ${templatePath} was not found in deployment bucket ${this.deploymentBucket}`
                        : e.message,
                    details: e.message,
                }, e);
            }
        };
        this.getTableStatus = async (tableName) => {
            var _b, _c;
            (0, assert_1.default)(tableName, 'table name should be passed');
            try {
                const response = await this.ddbClient.describeTable({ TableName: tableName }).promise();
                if (((_b = response.Table) === null || _b === void 0 ? void 0 : _b.TableStatus) === 'DELETING') {
                    return false;
                }
                const globalSecondaryIndexes = (_c = response.Table) === null || _c === void 0 ? void 0 : _c.GlobalSecondaryIndexes;
                return globalSecondaryIndexes ? globalSecondaryIndexes.every((idx) => idx.IndexStatus === 'ACTIVE') : true;
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) === 'ResourceNotFoundException') {
                    return true;
                }
                throw new amplify_cli_core_1.AmplifyFault('ServiceCallFault', {
                    message: err.message,
                }, err);
            }
        };
        this.waitForActiveTables = async (tables) => {
            const throttledGetTableStatus = (0, lodash_throttle_1.default)(this.getTableStatus, this.options.throttleDelay);
            const waiters = tables.map((name) => new Promise((resolve) => {
                const interval = setInterval(() => {
                    void throttledGetTableStatus(name).then((areIndexesReady) => {
                        if (areIndexesReady) {
                            clearInterval(interval);
                            resolve(undefined);
                        }
                    });
                }, this.options.throttleDelay);
            }));
            await Promise.all(waiters);
        };
        this.waitForIndices = async (stackParams) => {
            var _b;
            if (stackParams.tableNames.length) {
                await new Promise((res) => setTimeout(res, 2000));
            }
            await this.waitForActiveTables(stackParams.tableNames);
            try {
                await ((_b = this.deploymentStateManager) === null || _b === void 0 ? void 0 : _b.advanceStep());
            }
            catch (_c) {
            }
            return Promise.resolve();
        };
        this.preRollbackTableCheck = async (stackParams) => {
            await this.waitForActiveTables(stackParams.tableNames);
        };
        this.stackPollFn = (deploymentStep) => {
            (0, assert_1.default)(deploymentStep.stackName, 'stack name should be passed to stackPollFn');
            const monitor = new stack_event_monitor_1.StackEventMonitor(this.cfnClient, deploymentStep.stackName, this.printer.print, this.printer.addActivity);
            monitor.start();
            return async () => {
                if (monitor) {
                    await monitor.stop();
                }
            };
        };
        this.doDeploy = async (currentStack) => {
            var _b;
            try {
                await ((_b = this.deploymentStateManager) === null || _b === void 0 ? void 0 : _b.startCurrentStep({ previousMetaKey: currentStack.previousMetaKey }));
            }
            catch (_c) {
            }
            const cfn = this.cfnClient;
            (0, assert_1.default)(currentStack.stackName, 'stack name should be passed to doDeploy');
            (0, assert_1.default)(currentStack.stackTemplateUrl, 'stackTemplateUrl must be passed to doDeploy');
            await this.ensureStack(currentStack.stackName);
            const parameters = Object.entries(currentStack.parameters).map(([key, val]) => ({
                ParameterKey: key,
                ParameterValue: val.toString(),
            }));
            await cfn
                .updateStack({
                StackName: currentStack.stackName,
                Parameters: parameters,
                TemplateURL: currentStack.stackTemplateUrl,
                Capabilities: currentStack.capabilities,
                ClientRequestToken: currentStack.clientRequestToken,
            })
                .promise();
        };
        this.waitForDeployment = async (stackParams) => {
            const { cfnClient } = this;
            (0, assert_1.default)(stackParams.stackName, 'stackName should be passed to waitForDeployment');
            await cfnClient
                .waitFor('stackUpdateComplete', {
                StackName: stackParams.stackName,
            })
                .promise();
        };
        this.rollBackStack = async (currentStack) => {
            await this.doDeploy(currentStack);
        };
        this.options = {
            throttleDelay: 1000,
            eventPollingDelay: 1000,
            userAgent: undefined,
            ...options,
        };
        this.eventMap = eventMap;
        this.s3Client = new aws.S3(creds);
        this.cfnClient = new aws.CloudFormation({ ...creds, maxRetries: 10, customUserAgent: this.options.userAgent });
        this.ddbClient = new aws.DynamoDB({ ...creds, region, maxRetries: 10 });
        this.logger = (0, aws_logger_1.fileLogger)('deployment-manager');
        this.printer = new stack_progress_printer_1.StackProgressPrinter(eventMap);
        this.spinner = new amplify_prompts_1.AmplifySpinner();
    }
}
exports.DeploymentManager = DeploymentManager;
_a = DeploymentManager;
DeploymentManager.createInstance = async (context, deploymentBucket, eventMap, options) => {
    try {
        const cred = await (0, configuration_manager_1.loadConfiguration)(context);
        (0, assert_1.default)(cred.region);
        return new DeploymentManager(cred, cred.region, deploymentBucket, eventMap, options);
    }
    catch (e) {
        throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
            message: 'Could not load configuration',
        }, e);
    }
};
//# sourceMappingURL=deployment-manager.js.map