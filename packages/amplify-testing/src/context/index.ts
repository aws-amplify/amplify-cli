/**
 * Build sane defaults for the Amplify Context object
 */

import { $TSContext } from 'amplify-cli-core';

export function createContext(): $TSContext {
  return {} as $TSContext;
}
