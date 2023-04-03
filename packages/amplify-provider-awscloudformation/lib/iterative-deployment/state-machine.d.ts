import { EventObject, State } from 'xstate';
export type DeploymentMachineOp = {
    stackTemplatePath: string;
    previousMetaKey?: string;
    parameters: Record<string, string>;
    tableNames: string[];
    stackName: string;
    capabilities?: string[];
    stackTemplateUrl: string;
    region: string;
    clientRequestToken?: string;
};
export type DeploymentMachineStep = {
    deployment: DeploymentMachineOp;
    rollback: DeploymentMachineOp;
};
export type DeployMachineContext = {
    deploymentBucket: string;
    region: string;
    stacks: DeploymentMachineStep[];
    currentIndex: number;
    errors?: StateMachineError[];
    previousDeploymentIndex?: number;
};
export type DeploymentMachineEvents = 'IDLE' | 'DEPLOY' | 'ROLLBACK' | 'INDEX' | 'DONE' | 'NEXT';
export type DeploymentMachineState = State<DeployMachineContext, {
    type: DeploymentMachineEvents;
}, DeployMachineSchema, {
    value: any;
    context: DeployMachineContext;
}>;
export type StateMachineError = {
    error: Error;
    stateValue: string;
    currentIndex: number;
};
export interface DeployMachineSchema {
    states: {
        idle: any;
        deploy: {
            states: {
                triggerDeploy: any;
                deploying: any;
                waitingForDeployment: any;
                waitForTablesToBeReady: any;
            };
        };
        rollback: {
            states: {
                triggerRollback: any;
                rollingBack: any;
                waitingForRollback: any;
                waitForTablesToBeReady: any;
            };
        };
        deployed: any;
        rolledBack: any;
        failed: any;
    };
}
export interface DeploymentRollbackSchema {
    states: {
        idle: any;
        preRollback: {
            states: {
                previousDeploymentReadyCheck: any;
                previousTableReadyCheck: any;
            };
        };
        rollback: {
            states: {
                enterRollback: any;
                triggerRollback: any;
                rollingBack: any;
                waitingForRollback: any;
                waitForTablesToBeReady: any;
            };
        };
        rolledBack: any;
        failed: any;
    };
}
interface DeployMachineEvent extends EventObject {
    type: DeploymentMachineEvents;
}
export type StateMachineHelperFunctions = StateMachineDeployHelperFunctions | StateMachineRollbackHelperFunctions;
export type StateMachineDeployHelperFunctions = {
    deploymentWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
    deployFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
    rollbackFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
    rollbackWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
    tableReadyWaitFn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
    stackEventPollFn: (stack: Readonly<DeploymentMachineOp>) => () => void;
    startRollbackFn: (context: Readonly<DeployMachineContext>) => Promise<void>;
};
export type StateMachineRollbackHelperFunctions = Omit<StateMachineDeployHelperFunctions, 'deploymentWaitFn' | 'deployFn'> & {
    preRollbackTableCheck: (stack: Readonly<DeploymentMachineOp>) => Promise<void>;
};
export declare function createDeploymentMachine(initialContext: DeployMachineContext, helperFns: StateMachineDeployHelperFunctions): import("xstate").StateMachine<DeployMachineContext, DeployMachineSchema, DeployMachineEvent, {
    value: any;
    context: DeployMachineContext;
}, import("xstate").ActionObject<DeployMachineContext, DeployMachineEvent>>;
export declare function createRollbackDeploymentMachine(initialContext: DeployMachineContext, helperFns: StateMachineRollbackHelperFunctions): import("xstate").StateMachine<DeployMachineContext, DeploymentRollbackSchema, DeployMachineEvent, {
    value: any;
    context: DeployMachineContext;
}, import("xstate").ActionObject<DeployMachineContext, DeployMachineEvent>>;
export {};
//# sourceMappingURL=state-machine.d.ts.map