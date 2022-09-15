import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import { AmplifyException, AmplifyExceptionOptions, AmplifyFaultType, PartialAmplifyExceptionOptions } from './amplify-exception';

/**
 * Base class for all Amplify faults
 */
export class AmplifyFault extends AmplifyException {
  constructor(
    name: AmplifyFaultType,
    options: AmplifyExceptionOptions,
  ) {
    super(name, 'FAULT', options);
  }
}

/**
 * returns an amplify fault with the default troubleshooting link if not passed
 */
export const amplifyFaultWithTroubleshootingLink = (name: AmplifyFaultType, options: PartialAmplifyExceptionOptions)
  : AmplifyFault => new AmplifyFault(name, {
  ...options,
  link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
});
