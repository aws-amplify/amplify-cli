import { EOL } from 'os';
import { BannerMessage } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

/**
 * A factory function that returns a function that prints the "success message" after adding auth
 * @param print The amplify print object
 */
export const getPostAddAuthMessagePrinter =
  (print: any) =>
  (resourceName: string, skipNextSteps: boolean = false) => {
    print.success(`Successfully added auth resource ${resourceName} locally`);

    if (!skipNextSteps) {
      printCommonText(print);
    }
  };

/**
 * A factory function that returns a function that prints the "success message" after updating auth
 * @param context The amplify print object
 */
export const getPostUpdateAuthMessagePrinter = (print: any) => (resourceName: string) => {
  printer.success(`Successfully updated auth resource ${resourceName} locally`);
  printCommonText(print);
};

const printCommonText = (print: any) => {
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
