import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath } from '..';
import path from 'path';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

export const addCDKCustomResource = async (cwd: string, settings: any): Promise<void> => {
  await spawn(getCLIPath(), ['add', 'custom'], { cwd, stripColors: true })
    .wait('How do you want to define this custom resource?')
    .sendCarriageReturn()
    .wait('Provide a name for your custom resource')
    .sendLine(settings.name || '\r')
    .wait('Do you want to edit the CDK stack now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export const addCFNCustomResource = async (cwd: string, settings: any, testingWithLatestCodebase = false): Promise<void> => {
  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['add', 'custom'], { cwd, stripColors: true })
    .wait('How do you want to define this custom resource?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Provide a name for your custom resource')
    .sendLine(settings.name || '\r')
    .wait('Do you want to access Amplify generated resources in your custom CloudFormation file?')
    .sendYes();
  if (settings.promptForCategorySelection) {
    chain.wait('Select the categories you want this custom resource to have access to').selectAll();
  }
  if (settings.promptForCustomResourcesSelection) {
    chain.wait('Select the one you would like your custom resource to access').selectAll();
  }
  await chain.wait('Do you want to edit the CloudFormation stack now?').sendNo().sendEof().runAsync();
};

export function buildCustomResources(cwd: string, usingLatestCodebase = false) {
  return new Promise((resolve, reject) => {
    const args = ['custom', 'build'];

    spawn(getCLIPath(usingLatestCodebase), args, { cwd, stripColors: true })
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

export const useLatestExtensibilityHelper = (projectRoot: string, customResourceName: string) => {
  const packageJsonPath = path.join(projectRoot, 'amplify', 'backend', 'custom', customResourceName, 'package.json');
  const packageJson: Record<string, Record<string, string>> = JSONUtilities.readJson(packageJsonPath);
  packageJson.dependencies['@aws-amplify/cli-extensibility-helper'] = 'latest';
  JSONUtilities.writeJson(packageJsonPath, packageJson);
};
