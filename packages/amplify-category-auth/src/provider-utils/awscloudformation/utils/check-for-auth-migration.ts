import { $TSContext, AmplifyCategories } from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import { EOL } from 'os';
import { AuthInputState } from '../auth-inputs-manager/auth-input-state';
import { generateAuthStackTemplate } from './generate-auth-stack-template';
import { migrateResourceToSupportOverride } from './migrate-override-resource';

export const checkAuthResourceMigration = async (context: $TSContext, authName: string) => {
  // check if its imported auth
  const { imported } = context.amplify.getImportedAuthProperties(context);
  if (!imported) {
    const cliState = new AuthInputState(authName);
    if (!cliState.cliInputFileExists()) {
      printer.debug("cli-inputs.json doesn't exist");
      // put spinner here
      const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
      const docsLink = 'https://docs.amplify.aws/cli/migration/overrides';
      const migrateResourceMessage =
        `Do you want to migrate ${AmplifyCategories.AUTH} resource "${authName}" to support overrides?` +
        `${EOL}(Recommended to try in a non-production environment first: "amplify env add".) Learn more about this migration: ${docsLink}`;

      if (headlessMigrate || (await prompter.yesOrNo(migrateResourceMessage, true))) {
        // generate cli-inputs for migration from parameters.json
        await migrateResourceToSupportOverride(authName);
        // fetch cli Inputs again
        const cliInputs = cliState.getCLIInputPayload();
        await generateAuthStackTemplate(context, cliInputs.cognitoConfig.resourceName);
      }
    }
  }
};
