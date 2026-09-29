/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyStudioClient } from '../../clients';
import { getAppId } from './environmentHelpers';

/**
 * process to decide if we should render components
 */
export const shouldRenderComponents = async (context: $TSContext): Promise<boolean> => {
  const projectConfig = stateManager.getProjectConfig();

  if (process.env.FORCE_RENDER) {
    printer.debug('Forcing component render since environment variable flag is set.');
    return true;
  }
  if (context?.input?.options?.['no-codegen']) {
    printer.debug('Not pulling components because --no-codegen flag is set.');
    return false;
  }

  if (!projectConfig) {
    printer.debug('Not pulling components because there is no projectConfig set for this project.');
    return false;
  }

  if (!projectConfig.providers.includes('awscloudformation')) {
    printer.debug('Not pulling components because there is no "awscloudformation" provider.');
    return false;
  }

  if (projectConfig.frontend !== 'javascript') {
    printer.debug('Not pulling components because this project is not configured as a javascript frontend.');
    return false;
  }

  if (projectConfig.javascript.framework !== 'react') {
    printer.debug('Not pulling components because this project is not configured with the "react" framework.');
    return false;
  }

  if (!(await AmplifyStudioClient.isAmplifyApp(context, getAppId(context)))) {
    printer.debug('Not pulling components because this project is not Amplify Studio enabled.');
    return false;
  }

  return true;
};
