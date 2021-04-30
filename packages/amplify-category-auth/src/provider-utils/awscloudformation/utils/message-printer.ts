import { ServiceQuestionsResult } from '../service-walkthrough-types';

/**
 * A factory function that returns a function that prints the "success message" after adding auth
 * @param print The amplify print object
 */
export const getPostAddAuthMessagePrinter = (print: any) => (resourceName: string) => {
  print.success(`Successfully added auth resource ${resourceName} locally`);
  printCommonText(print);
};

/**
 * A factory function that returns a function that prints the "success message" after updating auth
 * @param context The amplify print object
 */
export const getPostUpdateAuthMessagePrinter = (print: any) => (resourceName: string) => {
  print.success(`Successfully updated auth resource ${resourceName} locally`);
  printCommonText(print);
};

const printCommonText = (print: any) => {
  print.info('');
  print.success('Some next steps:');
  print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  print.info(
    '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
  );
  print.info('');
};

const printSMSSandboxWarning = (print: any) => {
  print.info('');
  print.info('TODO: Add message about SMS Sandbox and graduation');
};

export const doesConfigurationIncludeSMS = (request: ServiceQuestionsResult): boolean => {
  if ((request.mfaConfiguration === 'OPTIONAL' || request.mfaConfiguration === 'ON') && request.mfaTypes?.includes('SMS Text Message')) {
    return true;
  }

  if (request.usernameAttributes?.includes('phone_number')) {
    return true;
  }

  return false;
};
