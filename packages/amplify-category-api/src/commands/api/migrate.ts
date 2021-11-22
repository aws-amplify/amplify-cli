import { $TSAny, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { attemptV2TransformerMigration, revertV2Migration } from '@aws-amplify/graphql-transformer-migrator';
import * as path from 'path';
import { category } from '../../category-constants';

const subcommand = 'migrate';

export const name = subcommand;

export const run = async (context: $TSContext) => {
  const apiNames = Object.entries(stateManager.getMeta()?.api || {})
    .filter(([_, apiResource]) => (apiResource as $TSAny).service === 'AppSync')
    .map(([name]) => name);
  if (apiNames.length === 0) {
    printer.info(
      'No GraphQL API configured in the project. Only GraphQL APIs can be migrated. To add a GraphQL API run `amplify add api`.',
    );
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
  const apiResourceDir = path.join(pathManager.getBackendDirPath(), category, apiName);

  if (context.parameters?.options?.revert) {
    await revertV2Migration(apiResourceDir, stateManager.getCurrentEnvName());
    return;
  }
  await attemptV2TransformerMigration(apiResourceDir, apiName, stateManager.getCurrentEnvName());
};
