export type DeploymentState = {
    version: '1';
    startedAt?: string;
    finishedAt?: string;
    status: DeploymentStatus;
    currentStepIndex: number;
    steps: DeploymentStepState[];
};
export type DeploymentStepState = {
    status: DeploymentStepStatus;
    previousMetaKey?: string;
};
export type StepStatusParameters = Omit<DeploymentStepState, 'status'>;
export declare enum DeploymentStatus {
    'IDLE' = "IDLE",
    'DEPLOYING' = "DEPLOYING",
    'DEPLOYED' = "DEPLOYED",
    'ROLLING_BACK' = "ROLLING_BACK",
    'ROLLED_BACK' = "ROLLED_BACK",
    'FAILED' = "FAILED"
}
export declare enum DeploymentStepStatus {
    'WAITING_FOR_DEPLOYMENT' = "WAITING_FOR_DEPLOYMENT",
    'DEPLOYING' = "DEPLOYING",
    'DEPLOYED' = "DEPLOYED",
    'WAITING_FOR_TABLE_TO_BE_READY' = "WAITING_FOR_TABLE_TO_BE_READY",
    'WAITING_FOR_ROLLBACK' = "WAITING_FOR_ROLLBACK",
    'ROLLING_BACK' = "ROLLING_BACK",
    'ROLLED_BACK' = "ROLLED_BACK"
}
export interface IDeploymentStateManager {
    startDeployment: (steps: DeploymentStepState[]) => Promise<boolean>;
    failDeployment: () => Promise<void>;
    updateStatus: (status: DeploymentStatus) => Promise<void>;
    updateCurrentStepStatus: (status: DeploymentStepStatus) => Promise<void>;
    startCurrentStep: (parameters?: StepStatusParameters) => Promise<void>;
    advanceStep: () => Promise<void>;
    startRollback: () => Promise<void>;
    deleteDeploymentStateFile: () => Promise<void>;
    isDeploymentInProgress: () => boolean;
    isDeploymentFinished: () => boolean;
    getStatus: () => DeploymentState | undefined;
}
//# sourceMappingURL=deploymentState.d.ts.map