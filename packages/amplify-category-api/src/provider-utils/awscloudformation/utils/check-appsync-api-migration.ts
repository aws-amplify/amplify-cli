import { $TSContext, AmplifyCategories, getMigrateResourceMessageForOverride } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AppsyncApiInputState } from '../api-input-manager/appsync-api-input-state';
import { migrateResourceToSupportOverride } from './migrate-api-override-resource';

export const checkAppsyncApiResourceMigration = async (context: $TSContext, apiName: string, isUpdate: boolean): Promise<boolean> => {
  const cliState = new AppsyncApiInputState(apiName);
  /**
   * Below steps checks for TransformerV1 app and updates the FF { useexperimentalpipelinedtransformer , transformerversion}
   */
  const transformerVersion = await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getTransformerVersion', [
    context,
  ]);
  if (transformerVersion === 2) {
    if (!cliState.cliInputFileExists()) {
      printer.debug('cli-inputs.json doesnt exist');
      const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
      if (
        headlessMigrate ||
        (await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.API, apiName, isUpdate), true))
      ) {
        // generate cli-inputs for migration from parameters.json
        await migrateResourceToSupportOverride(apiName);
        return true;
      }
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
};
