import { FunctionTemplateParameters } from 'amplify-function-plugin-interface';
import fs from 'fs-extra';
import path from 'path';
import { templateRoot } from '../utils/constants';
import { getDstMap } from '../utils/destFileMapper';
import { lambdaAPIAuthSelection } from '../utils/lambdaAPIAuthSelection';

const pathToTemplateFilesAPIKey = path.join(templateRoot, 'lambda/appsync-todo/api_key');
const pathToTemplateFilesIAM = path.join(templateRoot, 'lambda/appsync-todo/iam');

/**
 * Prompt user for Auth type and return the corresponding path to the template files
 */
export async function provideAppSyncTodo(): Promise<FunctionTemplateParameters> {
  const selection = await lambdaAPIAuthSelection();

  if (selection.selection === 'IAM') {
    const files = fs.readdirSync(pathToTemplateFilesIAM);
    return Promise.resolve({
      functionTemplate: {
        sourceRoot: pathToTemplateFilesIAM,
        sourceFiles: files,
        defaultEditorFile: path.join('src', 'index.js'),
        destMap: getDstMap(files),
      },
    });
  }
  const files = fs.readdirSync(pathToTemplateFilesAPIKey);
  return Promise.resolve({
    functionTemplate: {
      sourceRoot: pathToTemplateFilesAPIKey,
      sourceFiles: files,
      defaultEditorFile: path.join('src', 'index.js'),
      destMap: getDstMap(files),
    },
  });
}
