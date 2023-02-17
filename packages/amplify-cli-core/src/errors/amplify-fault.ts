import { AmplifyException, AmplifyExceptionOptions, AmplifyFaultType } from './amplify-exception';

/**
 * Base class for all Amplify faults
 */
export class AmplifyFault extends AmplifyException {
  /**
   * Create a new Amplify Fault
   *
   * @param {AmplifyErrorType} name - a user friendly name for the exception
   * @param {AmplifyExceptionOptions} options - error stack, resolution steps, details, or help links
   *
   * @param {Error | null} downstreamException If you are throwing this exception from within a catch block,
   * you must provide the exception that was caught.
   * @example
   * try {
   *  ...
   * } catch (downstreamException){
   *    throw new AmplifyFault(downstreamException,...,...);
   * }
   */
  constructor(name: AmplifyFaultType, options: AmplifyExceptionOptions, downstreamException?: Error) {
    super(name, 'FAULT', options, downstreamException);
  }
}
