import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import { AmplifyException, AmplifyExceptionOptions, AmplifyFaultType, PartialAmplifyExceptionOptions } from './amplify-exception';

/**
 * Base class for all Amplify faults
 */
export class AmplifyFault extends AmplifyException {
  constructor(
    downstreamException: Error | null,
    name: AmplifyFaultType,
    options: AmplifyExceptionOptions,
  ) {
    super(downstreamException, name, 'FAULT', options);
  }
}

/**
 * returns an amplify fault with the default troubleshooting link if not passed
 */
export const amplifyFaultWithTroubleshootingLink = (
  downstreamException: Error | null,
  name: AmplifyFaultType, 
  options: PartialAmplifyExceptionOptions)
  : AmplifyFault => {
      return  new AmplifyFault(
        downstreamException, 
        name, {
          ...options,
          link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
        });
  };
