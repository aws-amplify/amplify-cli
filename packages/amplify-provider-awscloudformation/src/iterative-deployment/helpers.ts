import { DeployMachineContext, DeploymentMachineOp } from './state-machine';

export const collectError = (context: DeployMachineContext, err: any, meta: any) => {
  return {
    ...context,
    errors: [
      ...(context.errors ? context.errors : []),
      { error: err.data, stateValue: JSON.stringify(meta.state.value), currentIndex: context.currentIndex },
    ],
  };
};

export const isRollbackComplete = (context: DeployMachineContext) => {
  return context.currentIndex < 0;
};

export const isDeploymentComplete = (context: DeployMachineContext) => {
  return context.currentIndex >= context.stacks.length;
};

const getOperationPollerActivityHandler = (
  stackEventPollFn: (stack: Readonly<DeploymentMachineOp>) => () => void,
  operation: 'deploying' | 'rollingback',
) => {
  return (context: Readonly<DeployMachineContext>) => {
    if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
      const stack = context.stacks[context.currentIndex];
      const step = operation == 'deploying' ? stack.deployment : stack.rollback;

      return stackEventPollFn(step);
    }
    return () => {
      // empty
    };
  };
};

export const getDeploymentActivityPollerHandler = fn => getOperationPollerActivityHandler(fn, 'deploying');
export const getRollbackActivityPollerHandler = fn => getOperationPollerActivityHandler(fn, 'rollingback');

const getOperationHandler = (
  fn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>,
  operation: 'deploying' | 'rollingback',
): ((context: Readonly<DeployMachineContext>) => Promise<void>) => {
  return (context: DeployMachineContext) => {
    if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
      const stack = context.stacks[context.currentIndex];
      const step = operation == 'deploying' ? stack.deployment : stack.rollback;
      return fn(step);
    }
    return Promise.resolve();
  };
};

export const getDeploymentOperationHandler = fn => getOperationHandler(fn, 'deploying');
export const getRollbackOperationHandler = fn => getOperationHandler(fn, 'rollingback');

export const getBucketKey = (keyOrUrl: string, bucketName: string): string => {
  if (keyOrUrl.startsWith('https://') && keyOrUrl.includes(bucketName)) {
    return keyOrUrl.substring(keyOrUrl.indexOf(bucketName) + bucketName.length + 1);
  }
  return keyOrUrl;
};

export const getHttpUrl = (keyOrUrl: string, bucketName: string): string => {
  return keyOrUrl.startsWith('https://') ? keyOrUrl : `https://s3.amazonaws.com/${bucketName}/${keyOrUrl}`;
};

export const getPreRollbackOperationHandler = (
  fn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>,
): ((context: Readonly<DeployMachineContext>) => Promise<void>) => {
  return (context: DeployMachineContext) => {
    if (context.previousDeploymentIndex >= 0 && context.previousDeploymentIndex < context.stacks.length) {
      const stack = context.stacks[context.previousDeploymentIndex];
      const step = stack.rollback;
      return fn(step);
    }
    return Promise.resolve();
  };
};
