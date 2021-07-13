import { AmplifyRootStackTransform, CommandType, RootStackTransformOptions } from './root-stack-builder';

/**
 *
 * @param context
 * @returns
 */
export async function transformCfnWithOverrides(context) {
  const flags = context.parameters.options;
  if (flags['no-override']) {
    return;
  }

  // CFN transform for Root stack
  const props: RootStackTransformOptions = {
    resourceConfig: {
      stackFileName: 'nested-cloudformation-stack.yml',
    },
  };
  // generate , override and deploy stacks to disk
  const rootTransform = new AmplifyRootStackTransform(props, CommandType.PUSH);
  const template = rootTransform.transform();
  // generate CFN for other Resources
}
