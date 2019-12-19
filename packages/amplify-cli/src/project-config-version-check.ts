import * as path from 'path';
import * as fs from 'fs-extra';
import { Context } from './domain/context';
import inquirer from './domain/inquirer-helper';

const prevLambdaRuntimeVersion = 'nodejs8.10';
const lambdaRuntimeVersion = 'nodejs10.x';
const jsonIndentation = 4;

export async function checkProjectConfigVersion(context: Context): Promise<void> {
  const { pathManager, readJsonFile, constants } = context.amplify;
  const projectPath = pathManager.searchProjectRootPath();
  if (projectPath) {
    const projectConfigFilePath = pathManager.getProjectConfigFilePath(projectPath);
    if (fs.existsSync(projectConfigFilePath)) {
      const projectConfig = readJsonFile(projectConfigFilePath);
      if (projectConfig.version !== constants.PROJECT_CONFIG_VERSION) {
        await checkLambdaCustomResourceNodeVersion(context, projectPath);

        projectConfig.version = constants.PROJECT_CONFIG_VERSION;
        const jsonString = JSON.stringify(projectConfig, null, jsonIndentation);
        fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
      }
    }
  }
}

///////////////////////////////////////////////////////////////////
////// check lambda custom resources nodejs runtime version ///////
///////////////////////////////////////////////////////////////////
async function checkLambdaCustomResourceNodeVersion(context: Context, projectPath: string): Promise<void> {
  const { pathManager, readJsonFile, constants } = context.amplify;
  const backendDirPath = pathManager.getBackendDirPath(projectPath);

  const filesToUpdate: string[] = [];

  if (fs.existsSync(backendDirPath)) {
    const categoryDirNames = fs.readdirSync(backendDirPath);
    categoryDirNames.forEach(categoryDirName => {
      const categoryDirPath = path.join(backendDirPath, categoryDirName);
      if (!fs.statSync(categoryDirPath).isDirectory()) {
        return;
      }

      const resourceDirNames = fs.readdirSync(categoryDirPath);
      resourceDirNames.forEach(resourceDirName => {
        const resourceDirPath = path.join(categoryDirPath, resourceDirName);
        if (!fs.statSync(resourceDirPath).isDirectory()) {
          return;
        }

        const fileNames = fs.readdirSync(resourceDirPath);
        fileNames.forEach(fileName => {
          const filePath = path.join(resourceDirPath, fileName);
          if (!fs.statSync(filePath).isFile()) {
            return;
          }
          const templateFileNamePattern = new RegExp('cloudformation-template');
          if (templateFileNamePattern.test(fileName)) {
            const fileString = fs.readFileSync(filePath, 'utf8');
            if (fileString.includes(prevLambdaRuntimeVersion)) {
              filesToUpdate.push(filePath);
            }
          }
        });
      });
    });
  }

  if (filesToUpdate.length > 0) {
    const confirmed = await promptForConfirmation(context, filesToUpdate);
    if (confirmed) {
      filesToUpdate.forEach(filePath => {
        let fileString = fs.readFileSync(filePath, 'utf8');
        fileString = fileString.replace(prevLambdaRuntimeVersion, lambdaRuntimeVersion);
        fs.writeFileSync(filePath, fileString, 'utf8');
      });
      context.print.info('');
      context.print.success('The nodejs runtime are updated successfully in the CloudFormation templates.');
      context.print.warning('Make sure the template changes are pushed to the cloud by "amplify push"');
    }
  }
}

async function promptForConfirmation(context: Context, filesToUpdate: string[]): Promise<boolean> {
  context.print.info('');
  context.print.info('Amplify CLI uses Lambda backed custom resources with CloudFormation to manage part of your backend resources.');
  context.print.info('In response to the Lambda Runtime support deprecation schedule');
  context.print.green('https://docs.aws.amazon.com/lambda/latest/dg/runtime-support-policy.html');
  context.print.warning(
    `Nodejs runtime need to be updated from ${prevLambdaRuntimeVersion}  to ${lambdaRuntimeVersion} in the following template files:`
  );
  filesToUpdate.forEach(filePath => {
    context.print.info(filePath);
  });

  const question = {
    type: 'confirm',
    name: 'confirmUpdateNodeVersion',
    message: 'Confirm to update the nodejs runtime version.',
    default: true,
  };
  const answer = await inquirer.prompt(question);
  if (!answer.confirmUpdateNodeVersion) {
    const warningMessage = `After a runtime is deprecated, \
Lambda might retire it completely at any time by disabling invocation. \
Deprecated runtimes aren't eligible for security updates or technical support. \
Before retiring a runtime, Lambda sends additional notifications to affected customers.`;
    context.print.warning(warningMessage);
    context.print.info('You will need to manually update the nodejs runtime in the template files and push the udpates to the cloud.');
  }

  return answer.confirmUpdateNodeVersion;
}
