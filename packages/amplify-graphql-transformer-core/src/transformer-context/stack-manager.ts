import { StackManagerProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { Stack, App, CfnParameter, CfnParameterProps } from '@aws-cdk/core';
import { TransformerNestedStack, TransformerRootStack, TransformerStackSythesizer } from '../cdk-compat';

export type ResourceToStackMap = Record<string, string>;

export class StackManager implements StackManagerProvider {
  private stacks: Map<string, Stack> = new Map();
  private stackSynthesizer = new TransformerStackSythesizer();
  public readonly rootStack: TransformerRootStack;
  private resourceToStackMap: Map<string, string>;
  private paramMap: Map<string, CfnParameter> = new Map();
  constructor(app: App, resourceMapping: ResourceToStackMap) {
    this.rootStack = new TransformerRootStack(app, 'transformer-root-stack', {
      synthesizer: this.stackSynthesizer,
    });
    // add Env Parameter to ensure to adhere to contract
    this.resourceToStackMap = new Map(Object.entries(resourceMapping));
    this.addParameter('env', {
      default: 'NONE',
      type: 'String',
    });
  }
  createStack = (stackName: string): Stack => {
    const newStack = new TransformerNestedStack(this.rootStack, stackName);
    return newStack;
  };

  hasStack = (stackName: string): boolean => {
    return this.stacks.has(stackName);
  };

  getStackFor = (resourceId: string, defaultStackName?: string): Stack => {
    const stackName = this.resourceToStackMap.has(resourceId) ? this.resourceToStackMap.get(resourceId) : defaultStackName;
    if (stackName) {
      try {
        this.getStack(stackName);
      } catch (e) {
        return this.createStack(stackName);
      }
    }
    return this.rootStack;
  };

  getStack = (stackName: string): Stack => {
    if (this.stacks.has(stackName)) {
      return this.stacks.get(stackName)!;
    }
    throw new Error(`Stack ${stackName} is not created`);
  };

  getCloudFormationTemplates = () => {
    return this.stackSynthesizer.collectStacks();
  };

  getMappingTemplates = () => {
    return this.stackSynthesizer.collectMappingTemplates();
  };

  addParameter = (name: string, props: CfnParameterProps): CfnParameter => {
    const param = new CfnParameter(this.rootStack, name, props);
    this.paramMap.set(name, param);
    return param;
  };

  getParameter = (name: string): CfnParameter | void => {
    return this.paramMap.get(name);
  };
}
