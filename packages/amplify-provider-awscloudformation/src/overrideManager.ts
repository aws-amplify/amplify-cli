import { AmplifyRootStackTransform, CommandType, RootStackTransformOptions } from './root-stack-builder';
import { rootStackFileName } from '.';
import { prePushCfnTemplateModifier } from './pre-push-cfn-processor/pre-push-cfn-modifier';
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
      stackFileName: rootStackFileName,
    },
  };
  // generate , override and deploy stacks to disk
  const rootTransform = new AmplifyRootStackTransform(props, CommandType.PUSH);
  const rootStack = await rootTransform.transform();
  // prepush modifier
  await prePushCfnTemplateModifier(rootStack);
  // generate CFN for other Resources
}
