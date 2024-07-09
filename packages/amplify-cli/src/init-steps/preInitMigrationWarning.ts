import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { printer, prompter } from '@aws-amplify/amplify-prompts';

export const migrationWarning = async (context: $TSContext): Promise<void> => {
  printer.warn(
    `AWS Amplify recommends using Amplify Gen 2 for new projects. Learn how to get started at https://docs.amplify.aws/react/start/quickstart/`,
  );
};
