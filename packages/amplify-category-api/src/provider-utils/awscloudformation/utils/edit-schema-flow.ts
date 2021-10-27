import inquirer, { ConfirmQuestion } from 'inquirer';
import path from 'path';
import { category } from '../../../category-constants';
import { gqlSchemaFilename } from '../aws-constants';

export const editSchemaFlow = async (context: any, apiName: string) => {
  const prompt: ConfirmQuestion = {
    type: 'confirm',
    name: 'editNow',
    message: 'Do you want to edit the schema now?',
    default: false,
  };

  if (!(await inquirer.prompt(prompt)).editNow) return;

  const schemaPath = path.join(context.amplify.pathManager.getBackendDirPath(), category, apiName, gqlSchemaFilename);
  await context.amplify.openEditor(context, schemaPath, false);
};
