import { $TSContext, JSONUtilities, pathManager } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { buildCustomResources } from '../utils/build-custom-resources';
import { customResourceNameQuestion } from '../utils/common-questions';
import { categoryName, cdkFileName, CDK_SERVICE_NAME, DEPLOYMENT_PROVIDER_NAME } from '../utils/constants';

export async function addCDKWalkthrough(context: $TSContext) {
  const resourceName = await customResourceNameQuestion();

  await generateSkeletonDir(resourceName);
  await updateAmplifyMetaFiles(context, resourceName);

  printer.success(`Created skeleton CDK stack in amplify/backend/custom/${resourceName} directory`);

  await buildCustomResources(context, resourceName);

  // Open editor
  const resourceDirPath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const cdkFilepath = path.join(resourceDirPath, cdkFileName);

  if (await prompter.yesOrNo('Do you want to edit the CDK stack now?', true)) {
    await context.amplify.openEditor(context, cdkFilepath);
  }
}

async function updateAmplifyMetaFiles(context: $TSContext, resourceName: string) {
  const backendConfigs = {
    service: CDK_SERVICE_NAME,
    providerPlugin: DEPLOYMENT_PROVIDER_NAME,
  };

  context.amplify.updateamplifyMetaAfterResourceAdd(categoryName, resourceName, backendConfigs);
}

async function generateSkeletonDir(resourceName: string) {
  const targetDir = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);

  if (fs.existsSync(targetDir)) {
    throw new Error(`Custom resource with ${resourceName} already exists.`);
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
  fs.writeFileSync(cdkFilepath, fs.readFileSync(path.join(srcResourceDirPath, 'cdk-stack.ts.sample')));

  const npmRcPath = path.join(targetDir, '.npmrc');
  fs.writeFileSync(npmRcPath, fs.readFileSync(path.join(srcResourceDirPath, 'sample.npmrc')));
}
