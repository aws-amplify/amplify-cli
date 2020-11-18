import { DeployMachineContext, StackParameter } from './state-machine';

export const hasMoreRollback = (context: DeployMachineContext) => {
  return context.currentIndex >= 0;
};

export const hasMoreDeployment = (context: DeployMachineContext) => {
  return context.stacks.length > context.currentIndex;
};

export const stackPollerActivity = (stackEventPollFn: (stack: Readonly<StackParameter>) => () => void) => {
  return (context: Readonly<DeployMachineContext>) => {
    if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
      const stack = context.stacks[context.currentIndex];
      const stackTemplateUrl = `${context.deploymentBucket}/${stack.stackTemplatePath}`;
      return stackEventPollFn({
        ...stack,
        region: context.region,
        stackTemplateUrl,
      });
    }
    return () => {};
  };
};

export const extractStackInfoFromContext = (
  fn: (stack: Readonly<StackParameter>) => Promise<void>,
): ((ctx: Readonly<DeployMachineContext>) => Promise<void>) => {
  return (ctx: DeployMachineContext) => {
    if (ctx.currentIndex >= 0 && ctx.currentIndex < ctx.stacks.length) {
      const stack = ctx.stacks[ctx.currentIndex];
      const stackTemplateUrl = `${ctx.deploymentBucket}/${stack.stackTemplatePath}`;
      return fn({ ...stack, stackTemplateUrl, region: ctx.region });
    }
    return Promise.resolve();
  };
};
