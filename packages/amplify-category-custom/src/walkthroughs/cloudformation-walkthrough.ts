import { customResourceNameQuestion } from '../utils/common-questions';
import * as path from 'path';
import { pathManager, $TSContext } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import { printer } from 'amplify-prompts';
import _ from 'lodash';
import { addCFNResourceDependency } from '../utils/dependency-management-utils';
import { categoryName, customResourceCFNFilename, CFN_SERVICE_NAME, DEPLOYMENT_PROVIDER_NAME } from '../utils/constants';
import { prompter } from 'amplify-prompts';

const cfnTemplateRoot = path.normalize(path.join(__dirname, '../../resources'));
const cfnFilename = 'cloudformation-template-skeleton.ejs';

export async function addCloudFormationWalkthrough(context: $TSContext) {
  const resourceName = await customResourceNameQuestion();

  await generateSkeletonDir(context, resourceName);

  await updateAmplifyMetaFiles(context, resourceName);

  await addCFNResourceDependency(context, resourceName);

  printer.success(`Created skeleton CloudFormation stack in amplify/backend/custom/${resourceName} directory`);

  // Open editor

  const resourceDirPath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const cfnFilepath = path.join(resourceDirPath, customResourceCFNFilename);

  if (await prompter.yesOrNo('Do you want to edit the CloudFormation stack now?', true)) {
    await context.amplify.openEditor(context, cfnFilepath);
  }
}

export async function updateCloudFormationWalkthrough(context: $TSContext, resourceName: string) {
  await addCFNResourceDependency(context, resourceName);

  // Open editor

  const resourceDirPath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const cfnFilepath = path.join(resourceDirPath, customResourceCFNFilename);

  if (await prompter.yesOrNo('Do you want to edit the CloudFormation stack now?', true)) {
    await context.amplify.openEditor(context, cfnFilepath);
  }
}

async function generateSkeletonDir(context: $TSContext, resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  if (fs.existsSync(targetDir)) {
    throw new Error(`Custom resource with ${resourceName} already exists.`);
  }
  const copyJobs = [
    {
      dir: cfnTemplateRoot,
      template: cfnFilename,
      target: path.join(targetDir, customResourceCFNFilename),
    },
  ];

  const params = {
    resourceName,
  };

  await context.amplify.copyBatch(context, copyJobs, params);
}

async function updateAmplifyMetaFiles(context: $TSContext, resourceName: string) {
  const backendConfigs = {
    service: CFN_SERVICE_NAME,
    providerPlugin: DEPLOYMENT_PROVIDER_NAME,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, resourceName, backendConfigs);
}
