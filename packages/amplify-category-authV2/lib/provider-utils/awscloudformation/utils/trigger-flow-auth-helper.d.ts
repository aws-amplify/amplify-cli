import { $TSContext } from 'amplify-cli-core';
import { AuthStackOptions, AuthTriggerConnection, Triggers } from '../service-walkthrough-types';
export declare function handleTriggers(
  context: $TSContext,
  coreAnswers: AuthStackOptions,
  previouslySaved: AuthStackOptions,
): Promise<{
  triggers: Triggers;
  authTriggerConnections: AuthTriggerConnection[];
}>;
//# sourceMappingURL=trigger-flow-auth-helper.d.ts.map
