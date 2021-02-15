import { serviceMetadataFor } from './utils/dynamic-imports';
import { copyCfnTemplate, addPolicyResourceNameToPaths } from './legacy-add-resource';
import fs from 'fs-extra';
import path from 'path';
import { parametersFileName } from './aws-constants';

export const legacyUpdateResource = async (updateWalkthroughPromise: Promise<any>, context, category, service) => {
  let answers;
  let { cfnFilename } = await serviceMetadataFor(service);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const result = await updateWalkthroughPromise;
  const options: any = {};
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
      const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
      fs.ensureDirSync(resourceDirPath);
      const parametersFilePath = path.join(resourceDirPath, parametersFileName);
      const jsonString = JSON.stringify(parameters, null, 4);
      fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', answers.dependsOn);
    }
  }
};
