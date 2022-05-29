import { $TSAny, $TSContext, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { parametersFileName } from './aws-constants';
import { addPolicyResourceNameToPaths, copyCfnTemplate } from './legacy-add-resource';
import { serviceMetadataFor } from './utils/dynamic-imports';

export const legacyUpdateResource = async (updateWalkthroughPromise: Promise<$TSAny>, context: $TSContext, category: string, service) => {
  let answers;
  let { cfnFilename } = await serviceMetadataFor(service);
  const result = await updateWalkthroughPromise;
  const options: $TSAny = {};
  if (result) {
    if (result.answers) {
      ({ answers } = result);
      options.dependsOn = result.dependsOn;
    } else {
      answers = result;
    }

    if (!result.noCfnFile) {
      if (answers.customCfnFile) {
        cfnFilename = answers.customCfnFile;
      }
      addPolicyResourceNameToPaths(answers.paths);
      copyCfnTemplate(context, category, answers, cfnFilename);
      const parameters = { ...answers };
      const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      JSONUtilities.writeJson(parametersFilePath, parameters);
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', answers.dependsOn);
    }
  }
};
