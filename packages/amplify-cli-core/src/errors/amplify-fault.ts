import { AmplifyException, AmplifyExceptionOptions, AmplifyFaultType } from './amplify-exception';

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
