import { Template } from 'cloudform-types';
import {
  AmplifyAuthTransform,
  AmplifyAuthTransformOptions,
  authCognitoStackFileName,
  CommandType,
} from '../auth-stack-builder/auth-stack-transform';
import * as path from 'path';
import { pathManager } from 'amplify-cli-core';
import { category } from '../constants';

export const generateAuthStackTemplate = async (resourceName: string): Promise<Template> => {
  try {
    const projectPath = pathManager.findProjectRoot();
    const cfnFilePath = path.join(pathManager.getBackendDirPath(projectPath), category, resourceName, 'build', authCognitoStackFileName);
    const overrideFnPath = path.join(pathManager.getOverrideDirPath(projectPath!, category, resourceName), 'build', 'override.js');
    const overrideDir = pathManager.getRootOverrideDirPath(projectPath!);

    const props: AmplifyAuthTransformOptions = {
      resourceConfig: {
        categoryName: category,
        resourceName,
        stackFileName: authCognitoStackFileName,
      },
      deploymentOptions: {
        rootFilePath: cfnFilePath,
      },
      overrideOptions: {
        overrideFnPath,
        overrideDir,
      },
    };
    // generate , override and deploy stacks to disk
    const authTransform = new AmplifyAuthTransform(props, CommandType.ADD);
    return await authTransform.transform();
  } catch (e) {
    throw new Error(e);
  }
};
