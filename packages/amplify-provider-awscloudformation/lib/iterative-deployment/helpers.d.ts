import { DeployMachineContext, DeploymentMachineOp } from './state-machine';
export declare const collectError: (context: DeployMachineContext, err: any, meta: any) => {
    errors: {
        error: any;
        stateValue: string;
        currentIndex: number;
    }[];
    deploymentBucket: string;
    region: string;
    stacks: import("./state-machine").DeploymentMachineStep[];
    currentIndex: number;
    previousDeploymentIndex?: number;
};
export declare const isRollbackComplete: (context: DeployMachineContext) => boolean;
export declare const isDeploymentComplete: (context: DeployMachineContext) => boolean;
export declare const getDeploymentActivityPollerHandler: (fn: any) => (context: Readonly<DeployMachineContext>) => () => void;
export declare const getRollbackActivityPollerHandler: (fn: any) => (context: Readonly<DeployMachineContext>) => () => void;
export declare const getDeploymentOperationHandler: (fn: any) => (context: Readonly<DeployMachineContext>) => Promise<void>;
export declare const getRollbackOperationHandler: (fn: any) => (context: Readonly<DeployMachineContext>) => Promise<void>;
export declare const getBucketKey: (keyOrUrl: string, bucketName: string) => string;
export declare const getHttpUrl: (keyOrUrl: string, bucketName: string) => string;
export declare const getPreRollbackOperationHandler: (fn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>) => (context: Readonly<DeployMachineContext>) => Promise<void>;
//# sourceMappingURL=helpers.d.ts.map