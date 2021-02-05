import * as path from 'path';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import glob from 'glob';
import { coerce, lt } from 'semver';
import { Context } from './domain/context';
import { ConfirmQuestion } from 'inquirer';
import { pathManager, stateManager } from 'amplify-cli-core';

const prevLambdaRuntimeVersions = ['nodejs8.10', 'nodejs10.x'];
const lambdaRuntimeVersion = 'nodejs12.x';

export async function checkProjectConfigVersion(context: Context): Promise<void> {
  const { constants } = context.amplify;
  const projectPath = pathManager.findProjectRoot();

  if (projectPath) {
    const projectConfig = stateManager.getProjectConfig(projectPath, {
      throwIfNotExist: false,
      default: {},
    });

    const currentProjectVersion = coerce(projectConfig.version);
    const minProjectVersion = coerce(constants.MIN_NODE12_PROJECT_CONFIG_VERSION);

    if (lt(currentProjectVersion!, minProjectVersion!)) {
      await checkLambdaCustomResourceNodeVersion(context, projectPath);

      projectConfig.version = constants.CURRENT_PROJECT_CONFIG_VERSION;

      stateManager.setProjectConfig(projectPath, projectConfig);
    }
  }
}

///////////////////////////////////////////////////////////////////
////// check lambda custom resources nodejs runtime version ///////
///////////////////////////////////////////////////////////////////
async function checkLambdaCustomResourceNodeVersion(context: Context, projectPath: string): Promise<boolean> {
  const { pathManager } = context.amplify;
  const backendDirPath = pathManager.getBackendDirPath(projectPath);

  let result = false;
  const filesToUpdate: string[] = [];

  if (fs.existsSync(backendDirPath)) {
    const globOptions: glob.IOptions = {
      absolute: false,
      cwd: backendDirPath,
      follow: false,
      nodir: true,
    };

    const templateFileNames = glob.sync('**/*template.{yaml,yml,json}', globOptions);

    for (const templateFileName of templateFileNames) {
      const absolutePath = path.join(backendDirPath, templateFileName);
      const fileContent = fs.readFileSync(absolutePath, 'utf8');

      if (checkFileContent(fileContent)) {
        filesToUpdate.push(templateFileName);
      }
    }
  }

  if (filesToUpdate.length > 0) {
    const confirmed = context.input.options?.yes || (await promptForConfirmation(context, filesToUpdate));

    if (confirmed) {
      for (const fileName of filesToUpdate) {
        const absolutePath = path.join(backendDirPath, fileName);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');

        const newFileContent = updateFileContent(fileContent);

        fs.writeFileSync(absolutePath, newFileContent, 'utf8');
      }

      context.print.info('');
      context.print.success(
        `Node.js runtime version successfully updated  to ${lambdaRuntimeVersion} in all the CloudFormation templates.`,
      );
      context.print.warning('Run “amplify push” to deploy the updated templates to the cloud.');

      result = true;
    }
  } else {
    // No update means 'updated' for caller
    result = true;
  }

  return result;
}

function checkFileContent(fileContent: string): boolean {
  for (const prevLambdaRuntimeVersion of prevLambdaRuntimeVersions) {
    if (fileContent.includes(prevLambdaRuntimeVersion)) {
      return true;
    }
  }

  return false;
}

function updateFileContent(fileString: string): string {
  let result = fileString;

  for (const prevLambdaRuntimeVersion of prevLambdaRuntimeVersions) {
    result = result.replace(prevLambdaRuntimeVersion, lambdaRuntimeVersion);
  }

  return result;
}

async function promptForConfirmation(context: Context, filesToUpdate: string[]): Promise<boolean> {
  context.print.info('');
  context.print.info('Amplify CLI uses AWS Lambda to manage part of your backend resources.');
  context.print.info(
    `In response to the Lambda Runtime support deprecation schedule, the Node.js runtime needs to be updated from ${prevLambdaRuntimeVersions.join(
      ', ',
    )} to ${lambdaRuntimeVersion} in the following template files:`,
  );
  context.print.warning(
    `Node.js runtime needs to be updated from ${prevLambdaRuntimeVersions.join(
      ', ',
    )} to ${lambdaRuntimeVersion} in the following template files:`,
  );

  for (const fileToUpdate of filesToUpdate) {
    context.print.info(fileToUpdate);
  }

  context.print.info('');

  context.print.warning(
    `Test the changes in a test environment before pushing them to production. There might be a need to update your Lambda function source code due to the Node.js runtime update. Take a look at https://docs.amplify.aws/cli/migration/lambda-node-version-update for more information`,
  );

  context.print.info('');

  const question: ConfirmQuestion = {
    type: 'confirm',
    name: 'confirmUpdateNodeVersion',
    message: `Confirm to update the Node.js runtime version to ${lambdaRuntimeVersion}`,
    default: true,
  };

  const answer = await inquirer.prompt(question);

  if (!answer.confirmUpdateNodeVersion) {
    const warningMessage = `After a runtime is deprecated, \
Lambda might retire it completely at any time by disabling invocation. \
Deprecated runtimes aren't eligible for security updates or technical support. \
Before retiring a runtime, Lambda sends additional notifications to affected customers.`;
    context.print.warning(warningMessage);
    context.print.info('You will need to manually update the Node.js runtime in the template files and push the updates to the cloud.');
  }

  return answer.confirmUpdateNodeVersion;
}
