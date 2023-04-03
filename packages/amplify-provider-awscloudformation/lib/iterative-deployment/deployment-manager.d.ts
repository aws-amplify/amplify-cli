import { $TSContext, IDeploymentStateManager } from 'amplify-cli-core';
import { DeploymentMachineOp, StateMachineError } from './state-machine';
import { EventMap } from '../utils/progress-bar-helpers';
interface DeploymentManagerOptions {
    throttleDelay?: number;
    eventPollingDelay?: number;
    userAgent?: string;
}
export declare class DeploymentError extends Error {
    constructor(errors: StateMachineError[]);
}
export type DeploymentOp = Omit<DeploymentMachineOp, 'region' | 'stackTemplatePath' | 'stackTemplateUrl'> & {
    stackTemplatePathOrUrl: string;
};
export type DeploymentStep = {
    deployment: DeploymentOp;
    rollback: DeploymentOp;
};
export declare class DeploymentManager {
    private region;
    private deploymentBucket;
    private eventMap;
    static createInstance: (context: $TSContext, deploymentBucket: string, eventMap: EventMap, options?: DeploymentManagerOptions) => Promise<DeploymentManager>;
    private deployment;
    private options;
    private cfnClient;
    private s3Client;
    private ddbClient;
    private deploymentStateManager?;
    private logger;
    private printer;
    private spinner;
    private constructor();
    deploy: (deploymentStateManager: IDeploymentStateManager) => Promise<void>;
    rollback: (deploymentStateManager: IDeploymentStateManager) => Promise<void>;
    addStep: (deploymentStep: DeploymentStep) => void;
    addRollbackStep: (rollbackStep: DeploymentOp) => void;
    resetPrinter: () => void;
    private updateTerminalOnEventCompletion;
    private startRollBackFn;
    private ensureStack;
    private ensureTemplateExists;
    private getTableStatus;
    private waitForActiveTables;
    private waitForIndices;
    private preRollbackTableCheck;
    private stackPollFn;
    private doDeploy;
    private waitForDeployment;
    private rollBackStack;
}
export {};
//# sourceMappingURL=deployment-manager.d.ts.map