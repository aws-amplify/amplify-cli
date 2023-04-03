"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentStateManager = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const aws_s3_1 = require("../aws-utils/aws-s3");
const constants_1 = require("../constants");
class DeploymentStateManager {
    constructor(s3, deploymentBucketName, envName) {
        this.s3 = s3;
        this.deploymentBucketName = deploymentBucketName;
        this.envName = envName;
        this.direction = 1;
        this.startDeployment = async (steps) => {
            const persistedState = await this.loadState();
            if (persistedState) {
                if (persistedState.status === amplify_cli_core_1.DeploymentStatus.DEPLOYING || persistedState.status === amplify_cli_core_1.DeploymentStatus.ROLLING_BACK) {
                    return false;
                }
                this.currentState = persistedState;
            }
            this.direction = 1;
            this.currentState.startedAt = new Date().toISOString();
            this.currentState.finishedAt = undefined;
            this.currentState.currentStepIndex = 0;
            this.currentState.status = amplify_cli_core_1.DeploymentStatus.DEPLOYING;
            this.currentState.steps = steps;
            this.currentState.steps.forEach((s) => {
                s.status = amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_DEPLOYMENT;
            });
            await this.saveState();
            return true;
        };
        this.failDeployment = async () => {
            if (this.currentState.status !== amplify_cli_core_1.DeploymentStatus.ROLLED_BACK && this.currentState.status !== amplify_cli_core_1.DeploymentStatus.DEPLOYED) {
                this.currentState.finishedAt = new Date().toISOString();
                this.currentState.status = amplify_cli_core_1.DeploymentStatus.FAILED;
                await this.saveState();
            }
        };
        this.updateStatus = async (status) => {
            this.currentState.status = status;
            await this.saveState();
        };
        this.updateCurrentStepStatus = async (status) => {
            this.getCurrentStep().status = status;
            await this.saveState();
        };
        this.startCurrentStep = async (params) => {
            if (this.direction === 1) {
                if (this.getCurrentStep().status !== amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_DEPLOYMENT) {
                    throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                        message: `Cannot start step when the current step is in ${this.getCurrentStep().status} status.`,
                    });
                }
                const currentStep = this.getCurrentStep();
                currentStep.status = amplify_cli_core_1.DeploymentStepStatus.DEPLOYING;
                if (params === null || params === void 0 ? void 0 : params.previousMetaKey)
                    currentStep.previousMetaKey = params.previousMetaKey;
            }
            else if (this.direction === -1) {
                if (this.getCurrentStep().status !== amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_ROLLBACK) {
                    throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                        message: `Cannot start step when the current step is in ${this.getCurrentStep().status} status.`,
                    });
                }
                this.getCurrentStep().status = amplify_cli_core_1.DeploymentStepStatus.ROLLING_BACK;
            }
            await this.saveState();
        };
        this.advanceStep = async () => {
            if (!this.isDeploymentInProgress()) {
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: `Cannot advance a deployment when it was not started.`,
                });
            }
            if (this.direction === 1 && this.getCurrentStep().status !== amplify_cli_core_1.DeploymentStepStatus.DEPLOYING) {
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: `Cannot advance step when the current step is in ${this.getCurrentStep().status} status.`,
                });
            }
            else if (this.direction === -1 && this.getCurrentStep().status !== amplify_cli_core_1.DeploymentStepStatus.ROLLING_BACK) {
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: `Cannot advance step when the current step is in ${this.getCurrentStep().status} status.`,
                });
            }
            if (this.direction === 1 && this.currentState.currentStepIndex === this.currentState.steps.length - 1) {
                this.getCurrentStep().status = amplify_cli_core_1.DeploymentStepStatus.DEPLOYED;
                this.currentState.currentStepIndex = 0;
                this.currentState.finishedAt = new Date().toISOString();
                this.currentState.status = amplify_cli_core_1.DeploymentStatus.DEPLOYED;
            }
            else if (this.direction === -1 && this.currentState.currentStepIndex === 0) {
                const currentStep = this.getCurrentStep();
                currentStep.status = amplify_cli_core_1.DeploymentStepStatus.ROLLED_BACK;
                if (currentStep === null || currentStep === void 0 ? void 0 : currentStep.previousMetaKey) {
                    delete currentStep.previousMetaKey;
                }
                this.currentState.currentStepIndex = 0;
                this.currentState.finishedAt = new Date().toISOString();
                this.currentState.status = amplify_cli_core_1.DeploymentStatus.ROLLED_BACK;
            }
            else {
                if (this.direction === 1) {
                    this.getCurrentStep().status = amplify_cli_core_1.DeploymentStepStatus.DEPLOYED;
                }
                else if (this.direction === -1) {
                    const currentStep = this.getCurrentStep();
                    currentStep.status = amplify_cli_core_1.DeploymentStepStatus.ROLLED_BACK;
                    if (currentStep === null || currentStep === void 0 ? void 0 : currentStep.previousMetaKey) {
                        delete currentStep.previousMetaKey;
                    }
                }
                this.currentState.currentStepIndex += this.direction;
            }
            await this.saveState();
        };
        this.startRollback = async () => {
            if (!this.isDeploymentInProgress() || this.direction !== 1) {
                throw new amplify_cli_core_1.AmplifyError('DeploymentError', {
                    message: 'To rollback a deployment, the deployment must be in progress and not already rolling back.',
                });
            }
            this.direction = -1;
            for (let i = 0; i <= this.currentState.currentStepIndex; i += 1) {
                this.currentState.steps[i].status = amplify_cli_core_1.DeploymentStepStatus.WAITING_FOR_ROLLBACK;
            }
            this.currentState.status = amplify_cli_core_1.DeploymentStatus.ROLLING_BACK;
            await this.saveState();
        };
        this.isDeploymentInProgress = () => this.currentState.status === amplify_cli_core_1.DeploymentStatus.DEPLOYING || this.currentState.status === amplify_cli_core_1.DeploymentStatus.ROLLING_BACK;
        this.isDeploymentFinished = () => this.currentState.finishedAt !== undefined;
        this.getStatus = () => this.currentState;
        this.loadOrCreateState = async () => {
            const persistedState = await this.loadState();
            if (persistedState) {
                this.currentState = persistedState;
            }
            else {
                this.currentState = {
                    version: '1',
                    startedAt: '',
                    finishedAt: undefined,
                    status: amplify_cli_core_1.DeploymentStatus.IDLE,
                    currentStepIndex: 0,
                    steps: [],
                };
            }
        };
        this.loadState = async () => {
            const stateFileContent = await this.s3.getStringObjectFromBucket(this.deploymentBucketName, DeploymentStateManager.stateFileName);
            if (stateFileContent) {
                return amplify_cli_core_1.JSONUtilities.parse(stateFileContent);
            }
            return undefined;
        };
        this.saveState = async () => {
            await this.s3.uploadFile({
                Key: DeploymentStateManager.stateFileName,
                Body: amplify_cli_core_1.JSONUtilities.stringify(this.currentState),
            }, false);
        };
        this.deleteDeploymentStateFile = async () => {
            await this.s3.deleteObject(this.deploymentBucketName, DeploymentStateManager.stateFileName);
        };
        this.getCurrentStep = () => this.currentState.steps[this.currentState.currentStepIndex];
    }
}
exports.DeploymentStateManager = DeploymentStateManager;
_a = DeploymentStateManager;
DeploymentStateManager.stateFileName = 'deployment-state.json';
DeploymentStateManager.createDeploymentStateManager = async (context) => {
    var _b, _c;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const { envName } = context.amplify.getEnvInfo();
    const deploymentBucketName = (_c = (_b = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _b === void 0 ? void 0 : _b[constants_1.ProviderName]) === null || _c === void 0 ? void 0 : _c.DeploymentBucketName;
    const s3 = await aws_s3_1.S3.getInstance(context);
    const deploymentStateManager = new DeploymentStateManager(s3, deploymentBucketName, envName);
    await deploymentStateManager.loadOrCreateState();
    return deploymentStateManager;
};
DeploymentStateManager.getStatusFromCloud = async (context) => {
    const deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(context);
    return deploymentStateManager.getStatus();
};
//# sourceMappingURL=deployment-state-manager.js.map