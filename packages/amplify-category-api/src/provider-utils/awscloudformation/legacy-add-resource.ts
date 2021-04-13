import { JSONUtilities } from 'amplify-cli-core';
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
    addPolicyResourceNameToPaths(answers.paths);
    copyCfnTemplate(context, category, answers, cfnFilename);

    const parameters = { ...answers };
    const resourceDirPath = path.join(projectBackendDirPath, category, parameters.resourceName);
    fs.ensureDirSync(resourceDirPath);

    const parametersFilePath = path.join(resourceDirPath, parametersFileName);
    JSONUtilities.writeJson(parametersFilePath, parameters);

    const cfnParametersFilePath = path.join(resourceDirPath, cfnParametersFilename);
    JSONUtilities.writeJson(cfnParametersFilePath, {});
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

export const addPolicyResourceNameToPaths = paths => {
  if (Array.isArray(paths)) {
    paths.forEach(p => {
      const pathName = p.name;
      if (typeof pathName === 'string') {
        p.policyResourceName = pathName.replace(/{[a-zA-Z0-9\-]+}/g, '*');
      }
    });
  }
};
