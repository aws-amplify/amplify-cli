import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
export async function shouldRenderComponents(context: $TSContext) {
  if (process.env.FORCE_RENDER) {
    printer.debug('Forcing component render since environment variable flag is set.');
    return true;
  }
  if (context.input.options && context.input.options['no-codegen']) {
    printer.debug('Not pulling components because --no-codegen flag is set');
    return false;
  }

  if (!context.exeInfo || !context.exeInfo.projectConfig) {
    printer.debug('Not pulling components because there is no projectConfig set for this project');
    return false;
  }

  if (!context.exeInfo.projectConfig.providers.includes('awscloudformation')) {
    printer.debug('Not pulling components because there is no "awscloudformation" provider');
    return false;
  }

  if (context.exeInfo.projectConfig.frontend !== 'javascript') {
    printer.debug('Not pulling components because this project is not configured as a javascript frontend');
    return false;
  }

  if (context.exeInfo.projectConfig['javascript'].framework !== 'react') {
    printer.debug('Not pulling components because this project is not configured with the "react" framework');
    return false;
  }

  return true;
}
