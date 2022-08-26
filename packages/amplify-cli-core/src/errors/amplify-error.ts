import { AmplifyException, AmplifyExceptionOptions, AmplifyErrorType } from './amplify-exception';

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
