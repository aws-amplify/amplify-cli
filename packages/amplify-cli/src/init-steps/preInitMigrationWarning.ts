import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { isNewProject } from './s0-analyzeProject';

export const migrationWarning = async (context: $TSContext): Promise<$TSContext | false> => {
  if (!isNewProject(context)) {
    return context;
  }
  printer.warn(
    `AWS Amplify recommends using Amplify Gen 2 for new projects. Learn how to get started at https://docs.amplify.aws/react/start/quickstart/`,
  );

  const continueWithGen1 = await prompter.confirmContinue('Do you want to continue with Amplify Gen 1?');

  if (!continueWithGen1) {
    return false;
  }

  const whyContinueWithGen1 = await prompter.pick('Why would you like to use Amplify Gen 1?', [
    'I am a current Gen 1 user',
    'Gen 2 is missing features I need from Gen 1',
    'I find the Gen 1 CLI easier to use',
    'Prefer not to answer',
  ]);

  context.exeInfo.projectConfig = {
    whyContinueWithGen1,
  };

  return context;
};
