import { $TSContext } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { migrateResourceToSupportOverride } from './migrate-api-override-resource';

export const checkAppsyncApiResourceMigration = async (context: $TSContext, authName: string) => {
  const cliState = new AppsyncApiInputState(authName);
  if (!cliState.cliInputFileExists()) {
    printer.debug('Cli-inputs.json doesnt exist');
    // put spinner here
    const isMigrate = await prompter.yesOrNo(`Do you want to migrate this ${authName} to support overrides?`, true);
    if (isMigrate) {
      // generate cli-inputs for migration from parameters.json
      await migrateResourceToSupportOverride(authName);
      // fetch cli Inputs again
      // call compile schema here
      context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    }
  }
};
