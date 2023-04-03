import { $TSContext, DeploymentState, DeploymentStatus, StepStatusParameters, DeploymentStepState, DeploymentStepStatus, IDeploymentStateManager } from 'amplify-cli-core';
export declare class DeploymentStateManager implements IDeploymentStateManager {
    private readonly s3;
    private readonly deploymentBucketName;
    private readonly envName;
    private static stateFileName;
    private direction;
    private currentState;
    static createDeploymentStateManager: (context: $TSContext) => Promise<IDeploymentStateManager>;
    static getStatusFromCloud: (context: $TSContext) => Promise<DeploymentState | null>;
    private constructor();
    startDeployment: (steps: DeploymentStepState[]) => Promise<boolean>;
    failDeployment: () => Promise<void>;
    updateStatus: (status: DeploymentStatus) => Promise<void>;
    updateCurrentStepStatus: (status: DeploymentStepStatus) => Promise<void>;
    startCurrentStep: (params?: StepStatusParameters) => Promise<void>;
    advanceStep: () => Promise<void>;
    startRollback: () => Promise<void>;
    isDeploymentInProgress: () => boolean;
    isDeploymentFinished: () => boolean;
    getStatus: () => DeploymentState | undefined;
    private loadOrCreateState;
    private loadState;
    private saveState;
    deleteDeploymentStateFile: () => Promise<void>;
    private getCurrentStep;
}
//# sourceMappingURL=deployment-state-manager.d.ts.map