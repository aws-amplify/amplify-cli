import { customResourceNameQuestion } from '../utils/common-questions';
import * as fs from 'fs-extra';
import { printer } from 'amplify-prompts';
import path from 'path';
import { pathManager, $TSContext } from 'amplify-cli-core';
import { JSONUtilities } from 'amplify-cli-core';
import { buildCustomResources } from '../utils/build-custom-resources';
import { categoryName, DEPLOYMENT_PROVIDER_NAME, CDK_SERVICE_NAME } from '../utils/constants';

export async function addCDKWalkthrough(context: $TSContext) {
  const resourceName = await customResourceNameQuestion();

  await generateSkeletonDir(resourceName);
  await updateAmplifyMetaFiles(context, resourceName);

  printer.success(`Successfully added resource ${resourceName} locally`);

  await buildCustomResources(context, resourceName);

  // Open editor
}

async function updateAmplifyMetaFiles(context: $TSContext, resourceName: string) {
  const backendConfigs = {
    service: CDK_SERVICE_NAME,
    providerPlugin: DEPLOYMENT_PROVIDER_NAME,
    build: true,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, resourceName, backendConfigs);
}

async function generateSkeletonDir(resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);

  if (fs.existsSync(targetDir)) {
    printer.error(`Custom resource with ${resourceName} already exists.`);
    return;
  }
  fs.ensureDirSync(targetDir);

  const packageJSONFilePath = path.join(targetDir, 'package.json');
  const srcResourceDirPath = path.normalize(path.join(__dirname, '../../resources'));

  if (!fs.existsSync(packageJSONFilePath)) {
    JSONUtilities.writeJson(packageJSONFilePath, JSONUtilities.readJson(path.join(srcResourceDirPath, 'package.json')));
  }

  const tsConfigFilePath = path.join(targetDir, 'tsconfig.json');

  if (!fs.existsSync(tsConfigFilePath)) {
    JSONUtilities.writeJson(tsConfigFilePath, JSONUtilities.readJson(path.join(srcResourceDirPath, 'tsconfig.json')));
  }

  const cdkFilepath = path.join(targetDir, 'cdk-stack.ts');
  fs.writeFileSync(cdkFilepath, fs.readFileSync(path.join(srcResourceDirPath, 'cdk-stack.ts')));
}
