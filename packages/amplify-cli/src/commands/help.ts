import { printer } from 'amplify-prompts';
import { showAllHelp } from '../extensions/amplify-helpers/show-all-help';
import { AMPLIFY_SUPPORT_DOCS } from 'amplify-cli-core';

export const run = async context => {
  await showAllHelp(context);
};

/**
 * This function displays the url to the recommended troubleshooting guide.
 * This will eventually evolve to print the URL given the error-type/error-string to
 * provide a more streamlined dx.
 */
export const showTroubleshootingURL = ()=>{
  printer.warn(`Please refer ${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.name} at : ${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`);
}
