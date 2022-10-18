import { $TSContext } from 'amplify-cli-core';
import { init, onInitSuccessful as _onInitSuccessful } from './configuration-manager';

/**
 Initializer run
 */
export const run = (context): Promise<void> => init(context);

/**
 Initializer successful run
 */
export const onInitSuccessful = (context): $TSContext => _onInitSuccessful(context);

export default {
  run,
  onInitSuccessful,
};
