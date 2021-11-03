import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

const subcommand = 'gql-compile';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  try {
    const {
      parameters: { options },
    } = context;
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
      forceCompile: true,
      minify: options['minify'],
    });
  } catch (err) {
    printer.error(err.toString());
    await context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
