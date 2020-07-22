import { serviceMetadataFor } from './utils/dynamic-imports';
import fs from 'fs-extra';
import path from 'path';
import { parametersFileName, cfnParametersFilename, rootAssetDir } from './aws-constants';

// this is the old logic for generating resources in the project directory
// it is still used for adding REST APIs
export const legacyAddResource = async (serviceWalkthroughPromise: Promise<any>, context, category, service, options) => {
  let answers;
  let { cfnFilename } = await serviceMetadataFor(service);
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  const result = await serviceWalkthroughPromise;

  if (result.answers) {
    ({ answers } = result);
    options.dependsOn = result.dependsOn;
  } else {
    answers = result;
  }
  if (result.output) {
    options.output = result.output;
  }
  if (!result.noCfnFile) {
    if (answers.customCfnFile) {
      cfnFilename = answers.customCfnFile;
    }
    copyCfnTemplate(context, category, answers, cfnFilename);

    const parameters = { ...answers };
    const cfnParameters = {
      authRoleName: {
        Ref: 'AuthRoleName',
      },
      unauthRoleName: {
        Ref: 'UnauthRoleName',
      },
    };
    const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
    fs.ensureDirSync(resourceDirPath);

    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    let jsonString = JSON.stringify(parameters, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

    const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
    jsonString = JSON.stringify(cfnParameters, null, 4);
    fs.writeFileSync(cfnParametersFilePath, jsonString, 'utf8');
  }
  context.amplify.updateamplifyMetaAfterResourceAdd(category, answers.resourceName, options);
  return answers.resourceName;
};

// exported because the update flow still uses this method directly for now
export const copyCfnTemplate = (context, category, options, cfnFilename) => {
  const { amplify } = context;
  const targetDir = amplify.pathManager.getBackendDirPath();

  const copyJobs = [
    {
      dir: path.join(rootAssetDir, 'cloudformation-templates'),
      template: cfnFilename,
      target: `${targetDir}/${category}/${options.resourceName}/${options.resourceName}-cloudformation-template.json`,
    },
  ];

  // copy over the files
  return context.amplify.copyBatch(context, copyJobs, options, true, false);
};
