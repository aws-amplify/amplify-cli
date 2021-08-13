import { CfnParameter, CfnParameterProps, Stack } from '@aws-cdk/core';

export interface StackManagerProvider {
  readonly rootStack: Stack;
  getStack: (stackName: string) => Stack;
  createStack: (stackName: string) => Stack;
  getStackFor: (resourceId: string, defaultStackName?: string) => Stack;
  addParameter: (name: string, props: CfnParameterProps) => CfnParameter;
  getParameter: (name: string) => CfnParameter | void;
}
