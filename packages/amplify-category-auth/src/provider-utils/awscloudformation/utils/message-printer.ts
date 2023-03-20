import { EOL } from 'os';
import { BannerMessage } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * A factory function that returns a function that prints the "success message" after adding auth
 * @param print The amplify print object
 */
export const getPostAddAuthMessagePrinter = (resourceName: string, skipNextSteps = false) => {
  printer.success(`Successfully added auth resource ${resourceName} locally`);

  if (!skipNextSteps) {
    printCommonText();
  }
};

/**
 * A factory function that returns a function that prints the "success message" after updating auth
 * @param context The amplify print object
 */
export const getPostUpdateAuthMessagePrinter = () => (resourceName: string) => {
  printer.success(`Successfully updated auth resource ${resourceName} locally`);
  printCommonText();
};

const printCommonText = () => {
  printer.blankLine();
  printer.success('Some next steps:');
  printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  printer.info(
    '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
  );
  printer.blankLine();
};

export const printSMSSandboxWarning = async () => {
  const postAddUpdateSMSSandboxInfo = await BannerMessage.getMessage('COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO');
  if (postAddUpdateSMSSandboxInfo) {
    printer.warn(`${postAddUpdateSMSSandboxInfo}${EOL}`);
  }
};
