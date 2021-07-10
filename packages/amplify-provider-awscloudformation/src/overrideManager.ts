import { RootStackTransformOptions, AmplifyRootStackTransform, CommandType } from './root-stack-builder/root-stack-builder';

export async function transformCfnWithOverrides(context) {
  const flags = context.parameters.options;
  if (flags['no-override']) {
    return;
  }

  // CFN transform for Root stack
  const props: RootStackTransformOptions = {
    resourceConfig: {
      category: 'root',
      stackFileName: 'nested-cloudformation-stack.yml',
    },
  };
  // generate , override and deploy stacks to disk
  const rootTransform = new AmplifyRootStackTransform(props, CommandType.PUSH);
  const template = rootTransform.transform();
  // generate CFN for other Resources
}
