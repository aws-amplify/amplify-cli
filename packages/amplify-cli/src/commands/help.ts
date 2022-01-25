import { printer } from 'amplify-prompts';
import { showAllHelp } from '../extensions/amplify-helpers/show-all-help';

const TROUBLESHOOTING_PROJECT_URL = "https://docs.amplify.aws/project/troubleshooting/";

export const run = async context => {
  await showAllHelp(context);
};

/**
 * This function displays the url to the recommended troubleshooting guide.
 * This will eventually evolve to print the URL given the error-type/error-string to
 * provide a more streamlined dx.
 */
export const showTroubleshootingURL = ()=>{
  printer.warn(`Please refer to the Troubleshooting guide at : ${TROUBLESHOOTING_PROJECT_URL}`);
}
