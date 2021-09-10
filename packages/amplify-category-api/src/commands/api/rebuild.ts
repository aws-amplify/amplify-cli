import { $TSContext, FeatureFlags, stateManager } from 'amplify-cli-core';
import { printer, prompter, exact } from 'amplify-prompts';

const subcommand = 'rebuild';
const category = 'api';

export const name = subcommand;

const rebuild = true;

export const run = async (context: $TSContext) => {
  if (!FeatureFlags.getBoolean('graphqlTransformer.enableIterativeGSIUpdates')) {
    printer.error('Iterative GSI Updates must be enabled to rebuild an API. See https://docs.amplify.aws/cli/reference/feature-flags/');
    return;
  }
  const apiNames = Object.entries(stateManager.getMeta()?.api || {})
    .filter(([_, meta]) => (meta as any).service === 'AppSync')
    .map(([name]) => name);
  if (apiNames.length === 0) {
    printer.info('No GraphQL API configured in the project. Only GraphQL APIs can be rebuilt. To add a GraphQL API run `amplify add api`.');
    return;
  }
  if (apiNames.length > 1) {
    // this condition should never hit as we have upstream defensive logic to prevent multiple GraphQL APIs. But just to cover all the bases
    printer.error(
      'You have multiple GraphQL APIs in the project. Only one GraphQL API is allowed per project. Run `amplify remove api` to remove an API.',
    );
    return;
  }
  const apiName = apiNames[0];
  printer.warn(`This will recreate all tables backing models in your GraphQL API ${apiName}.`);
  printer.warn('ALL EXISTING DATA IN THESE TABLES WILL BE LOST.');
  await prompter.input('Type the name of the API to confirm you want to continue', {
    validate: exact(apiName, 'Input does not match the GraphQL API name'),
  });
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  amplify.constructExeInfo(context);
  return amplify.pushResources(context, category, resourceName, undefined, rebuild);
};
