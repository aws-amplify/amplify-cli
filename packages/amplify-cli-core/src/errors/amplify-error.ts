import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import { AmplifyException, AmplifyExceptionOptions, AmplifyErrorType, PartialAmplifyExceptionOptions } from './amplify-exception';

/**
 * Base class for all Amplify errors
 */
export class AmplifyError extends AmplifyException {
  constructor(
    name: AmplifyErrorType,
    options: AmplifyExceptionOptions,
  ) {
    super(name, 'ERROR', options);
  }
}

/**
 * convenience method to return an amplify error with the default troubleshooting link
 * @deprecated prefer using AmplifyError and passing the resolution steps
 */
export const amplifyErrorWithTroubleshootingLink = (name: AmplifyErrorType, options: PartialAmplifyExceptionOptions)
  : AmplifyError => new AmplifyError(name, {
  ...options,
  link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
});
