import { $TSContext } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { generateAuthStackTemplate } from './generate-auth-stack-template';
import { migrateResourceToSupportOverride } from './migrate-override-resource';

export const checkAuthResourceMigration = async (context: $TSContext, authName: string) => {
  // check if its imported auth
  const { imported } = context.amplify.getImportedAuthProperties(context);
  if (!imported) {
    const cliState = new AuthInputState(authName);
    if (!cliState.cliInputFileExists()) {
      printer.debug('Cli-inputs.json doesnt exist');
      // put spinner here
      const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
      if (headlessMigrate || (await prompter.yesOrNo(`Do you want to migrate this ${authName} to support overrides?`, true))) {
        // generate cli-inputs for migration from parameters.json
        await migrateResourceToSupportOverride(authName);
        // fetch cli Inputs again
        const cliInputs = cliState.getCLIInputPayload();
        await generateAuthStackTemplate(context, cliInputs.cognitoConfig.resourceName);
      }
    }
  }
};
