import { AmplifyRootStackTransform, CommandType, RootStackTransformOptions } from './root-stack-builder';
import { rootStackFileName } from '.';
import { prePushCfnTemplateModifier } from './pre-push-cfn-processor/pre-push-cfn-modifier';
import * as path from 'path';
import { pathManager } from 'amplify-cli-core';
import { Template } from 'cloudform-types';
/**
 *
 * @param context
 * @returns
 */
export async function transformCfnWithOverrides(context): Promise<Template> {
  const flags = context.parameters.options;
  if (flags['no-override']) {
    return;
  }

  const rootStack = await transformRootStack(CommandType.PUSH);
  return rootStack;
  // can enable other CFN Transfomer here and also make a registry of which categories supports overrides Transfomer
}

export const transformRootStack = async (commandType: CommandType): Promise<Template> => {
  try {
    let props: RootStackTransformOptions;
    // add check here to see if the override folder is present or not
    if (commandType === CommandType.INIT) {
      props = {
        resourceConfig: {
          stackFileName: rootStackFileName,
        },
        cfnModifiers: prePushCfnTemplateModifier,
      };
    } else if (commandType === CommandType.PUSH || commandType === CommandType.ON_INIT) {
      const projectPath = pathManager.findProjectRoot();
      const rootFilePath = path.join(pathManager.getRootStackDirPath(projectPath), rootStackFileName);
      const overrideFnPath = path.join(pathManager.getRootOverrideDirPath(projectPath), 'build', 'override.js');
      const overrideDir = pathManager.getRootOverrideDirPath(projectPath);

      props = {
        resourceConfig: {
          stackFileName: rootStackFileName,
        },
        deploymentOptions: {
          rootFilePath,
        },
        overrideOptions: {
          overrideFnPath,
          overrideDir,
        },
        cfnModifiers: prePushCfnTemplateModifier,
      };
    }
    // generate , override and deploy stacks to disk
    const rootTransform = new AmplifyRootStackTransform(props, commandType);
    const rootStack = await rootTransform.transform();
    return rootStack;
  } catch (error) {
    throw new Error(error);
  }
};
