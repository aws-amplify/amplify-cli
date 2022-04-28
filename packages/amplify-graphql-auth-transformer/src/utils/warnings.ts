import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { printer } from 'amplify-prompts';
import { AuthRule } from '.';

/**
 * Displays a warning when a default owner field is used and the feature flag is
 * disabled.
 */
export const showDefaultIdentityClaimWarning = (context: TransformerContextProvider, optionRules?: AuthRule[]): void => {
  const rules = optionRules || [];
  const usesDefaultIdentityClaim = rules.some(rule => rule.allow === 'owner' && rule.identityClaim === undefined);

  if (usesDefaultIdentityClaim) {
    const hasFeatureFlagEnabled = context.featureFlags?.getBoolean('useSubUsernameForDefaultIdentityClaim');

    if (hasFeatureFlagEnabled) return;

    printer.warn(
      ' WARNING: Amplify CLI will change the default identity claim from \'username\' '
        + 'to use \'sub::username\'. To continue using only usernames, set \'identityClaim: "username"\' on your '
        + '\'owner\' rules on your schema. The default will be officially switched with v9.0.0. To read '
        + 'more: https://docs.amplify.aws/cli/migration/identity-claim-changes/',
    );
  }
};
