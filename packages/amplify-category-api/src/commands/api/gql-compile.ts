import { $TSContext } from 'amplify-cli-core';

const subcommand = 'gql-compile';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const {
    parameters: { options },
  } = context;
  return context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
    forceCompile: true,
    minify: options['minify'],
  });
};
