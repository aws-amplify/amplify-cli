import { AMPLIFY_SUPPORT_DOCS } from '../cliConstants';
import {
  AmplifyException, AmplifyExceptionOptions, AmplifyErrorType, PartialAmplifyExceptionOptions,
} from './amplify-exception';

/**
 * Base class for all Amplify errors
 */
export class AmplifyError extends AmplifyException {
  /**
   * Create a new Amplify Exception.
   *
   * @param {AmplifyErrorType} name - a user friendly name for the exception
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyError(...,...,downstreamException);
   * }
   */
  constructor(
    name: AmplifyErrorType,
    options: AmplifyExceptionOptions,
    downstreamException?: Error,
  ) {
    super(name, 'ERROR', options, downstreamException);
  }
}

/**
 * convenience method to return an amplify error with the default troubleshooting link
 * @deprecated prefer using AmplifyError and passing the resolution steps
 */
export const amplifyErrorWithTroubleshootingLink = (
  name: AmplifyErrorType,
  options: PartialAmplifyExceptionOptions,
  downstreamException?: Error,
)
  : AmplifyError => new AmplifyError(
  name,
  {
    ...options,
    link: 'link' in options && options.link ? options.link : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
  },
  downstreamException,
);
