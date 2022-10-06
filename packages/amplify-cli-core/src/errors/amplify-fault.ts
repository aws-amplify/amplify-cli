import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import {
  AmplifyException, AmplifyExceptionOptions, AmplifyFaultType, PartialAmplifyExceptionOptions,
} from './amplify-exception';

/**
 * Base class for all Amplify faults
 */
export class AmplifyFault extends AmplifyException {
  /**
   * Create a new Amplify Fault
   *
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyFault(downstreamException,...,...);
   * }
   * @param {AmplifyErrorType} name - a user friendly name for the exception
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   */
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
  options: PartialAmplifyExceptionOptions,
)
  : AmplifyFault => new AmplifyFault(
  downstreamException,
  name, {
    ...options,
    link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
  },
);
