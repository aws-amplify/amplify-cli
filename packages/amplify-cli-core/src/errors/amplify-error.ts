import { AmplifyException, AmplifyExceptionOptions, AmplifyErrorType } from './amplify-exception';

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
  constructor(name: AmplifyErrorType, options: AmplifyExceptionOptions, downstreamException?: Error) {
    super(name, 'ERROR', options, downstreamException);
    this.stack = undefined;
  }
}
