import { $TSContext, AmplifyCategories, getMigrateResourceMessageForOverride } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { migrateResourceToSupportOverride } from './migrate-api-override-resource';

export const checkAppsyncApiResourceMigration = async (context: $TSContext, apiName: string, isUpdate: boolean): Promise<boolean> => {
  const cliState = new AppsyncApiInputState(apiName);
  if (!cliState.cliInputFileExists()) {
    printer.debug('cli-inputs.json doesnt exist');
    const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
    if (headlessMigrate || (await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.API, apiName, isUpdate), true))) {
      // generate cli-inputs for migration from parameters.json
      await migrateResourceToSupportOverride(apiName);
      return true;
    }
    return false;
  }
  return true;
};
