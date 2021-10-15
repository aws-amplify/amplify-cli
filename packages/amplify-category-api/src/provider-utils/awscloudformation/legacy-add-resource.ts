import { $TSAny, $TSContext, $TSObject, isResourceNameUnique, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { cfnParametersFilename, parametersFileName, rootAssetDir } from './aws-constants';
import { serviceMetadataFor } from './utils/dynamic-imports';

// this is the old logic for generating resources in the project directory
// it is still used for adding REST APIs
export const legacyAddResource = async (
  serviceWalkthroughPromise: Promise<$TSAny>,
  context: $TSContext,
  category: string,
  service: string,
  options: $TSObject,
) => {
  let answers;
  let { cfnFilename } = await serviceMetadataFor(service);

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
    const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, category, parameters.resourceName);

    isResourceNameUnique(category, parameters.resourceName);

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
export const copyCfnTemplate = (context: $TSContext, category: string, options, cfnFilename) => {
  const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, category, options.resourceName);

  const copyJobs = [
    {
      dir: path.join(rootAssetDir, 'cloudformation-templates'),
      template: cfnFilename,
      target: path.join(resourceDirPath, `${options.resourceName}-cloudformation-template.json`),
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
