import { customResourceNameQuestion } from '../utils/common-questions';
import path from 'path';
import { pathManager, $TSContext } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import { printer } from 'amplify-prompts';
import _ from 'lodash';
import { addCFNResourceDependency } from '../utils/dependency-management-utils';
import { categoryName, customResourceCFNFilename, CFN_SERVICE_NAME, DEPLOYMENT_PROVIDER_NAME } from '../utils/constants';

const cfnTemplateRoot = path.normalize(path.join(__dirname, '../../resources'));
const cfnFilename = 'cloudformation-template-skeleton.ejs';

export async function addCloudFormationWalkthrough(context: $TSContext) {
  const resourceName = await customResourceNameQuestion();

  await generateSkeletonDir(context, resourceName);

  await updateAmplifyMetaFiles(context, resourceName);

  printer.success(`Successfully added resource ${resourceName} locally`);

  //await dependencyWalkthrough(context, resourceName);
  await addCFNResourceDependency(context, resourceName);

  // Open editor
}

export async function updateCloudFormationWalkthrough(context: $TSContext, resourceName: string) {
  await addCFNResourceDependency(context, resourceName);

  // Open editor
}

async function generateSkeletonDir(context: $TSContext, resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  if (fs.existsSync(targetDir)) {
    printer.error(`Custom resource with ${resourceName} already exists.`);
    return;
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
