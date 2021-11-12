import { $TSContext, AmplifyCategories, getMigrateResourceMessageForOverride } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { generateAuthStackTemplate } from './generate-auth-stack-template';
import { migrateResourceToSupportOverride } from './migrate-override-resource';

/*
 * returns true if check goes through, false if cancelled
 */
export const checkAuthResourceMigration = async (context: $TSContext, authName: string, isUpdate: boolean): Promise<boolean> => {
  // check if its imported auth
  const { imported } = context.amplify.getImportedAuthProperties(context);
  if (!imported) {
    const cliState = new AuthInputState(authName);
    if (!cliState.cliInputFileExists()) {
      printer.debug("cli-inputs.json doesn't exist");
      // put spinner here
      const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;

      if (
        headlessMigrate ||
        (await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.AUTH, authName, isUpdate), true))
      ) {
        // generate cli-inputs for migration from parameters.json
        await migrateResourceToSupportOverride(authName);
        // fetch cli Inputs again
        const cliInputs = cliState.getCLIInputPayload();
        await generateAuthStackTemplate(context, cliInputs.cognitoConfig.resourceName);
        return true;
      }
      return false;
    }
  }
  return true;
};
