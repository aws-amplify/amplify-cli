import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { printer } from 'amplify-prompts';
import { AuthRule } from '.';

/**
 * Displays a warning when a default owner field is used and the feature flag is
 * disabled.
 */
export const showDefaultIdentityClaimWarning = (context: TransformerContextProvider, optionRules?: AuthRule[]): void => {
  const rules = optionRules || [];
  const usesCognitoUsernameAsDefault = !context.featureFlags?.getBoolean('useSubUsernameForDefaultIdentityClaim');
  const usesDefaultIdentityClaim = rules.some(rule => rule.allow === 'owner' && rule.identityClaim === undefined);

  if (usesCognitoUsernameAsDefault && usesDefaultIdentityClaim) {
    printer.warn(
      ' WARNING: Amplify CLI will change the default identity claim from \'username\' '
        + 'to use \'sub:username\'. To continue using usernames, set \'identityClaim: "sub:username"\' on your '
        + '\'owner\' rules on your schema. The default will be officially switched with v8.0.0. To read '
        + 'more: https://link.to/docs-and-migration-gudes',
    );
  }
};
