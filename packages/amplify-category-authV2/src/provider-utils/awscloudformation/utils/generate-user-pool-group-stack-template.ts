import { pathManager } from "amplify-cli-core";
import * as path from 'path';
import { Template } from 'cloudform-types';
import { AmplifyUserPoolGroupTransform, AmplifyUserPoolGroupTransformOptions, authUserPoolGroupStackFileName, CommandType } from "../auth-stack-builder/user-pool-group-stack-transform";
import { category } from "../constants";


export const generateUserPoolGroupStackTemplate = async (resourceName: string): Promise<Template> => {
  try {

    const projectPath = pathManager.findProjectRoot();
    const cfnFilePath = path.join(pathManager.getBackendDirPath(projectPath), category, resourceName, 'build', authUserPoolGroupStackFileName);
    const overrideFnPath = path.join(pathManager.getOverrideDirPath(projectPath!, category, resourceName), 'build', 'override.js');
    const overrideDir = pathManager.getRootOverrideDirPath(projectPath!);

    const props: AmplifyUserPoolGroupTransformOptions = {
      resourceConfig: {
        categoryName: category,
        resourceName,
        stackFileName: authUserPoolGroupStackFileName,
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
    const authTransform = new AmplifyUserPoolGroupTransform(props, CommandType.ADD);
    return await authTransform.transform();
  } catch (e) {
    throw new Error(e);
  }
};
